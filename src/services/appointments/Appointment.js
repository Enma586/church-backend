import { Appointment, Member } from '../../models/index.js';
import { aggregatePaginate } from '../../utils/aggregatePaginate.js';
import { getIO } from '../../config/socket.js';
import {
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    GoogleErrorType,
    classifyGoogleError,
} from '../config/GoogleCalendar.js';

export const createAppointment = async (data) => {
    let googleEventId;
    let syncStatus = 'synced';

    try {
        let attendeeEmail = undefined;
        // Solo buscamos el correo si es una cita pastoral con un miembro específico
        if (data.memberId) {
            const member = await Member.findById(data.memberId).select('email').lean();
            attendeeEmail = member?.email || undefined;
        }

        googleEventId = await createCalendarEvent({
            title: data.title,
            description: data.description,
            startDateTime: data.startDateTime,
            // Si hay un allDayDate, lo convertimos a formato YYYY-MM-DD para Google
            allDayDate: data.allDayDate ? new Date(data.allDayDate).toISOString().split('T')[0] : undefined,
            attendeeEmail,
            // Le pedimos a Google que ponga un recordatorio 24 horas antes (1440 mins)
            reminders: {
                useDefault: false,
                overrides: [{ method: 'popup', minutes: 1440 }]
            }
        });
    } catch (error) {
        const errorType = error._googleErrorType || classifyGoogleError(error);

        if (errorType === GoogleErrorType.FORBIDDEN || errorType === GoogleErrorType.INVALID_INPUT) {
            console.error(`[GoogleCalendar] Fallo permanente al crear evento (${errorType}):`, error.message);
            syncStatus = 'failed';
        } else {
            console.error(`[GoogleCalendar] Error al crear evento (${errorType}):`, error.message);
            syncStatus = 'pending_sync';
        }
    }

    const appointment = await Appointment.create({ ...data, googleEventId, syncStatus });

    const io = getIO();
    io.emit('appointment:created', appointment);

    return appointment;
};

export const findAllAppointments = async (query) => {
    // 1. Agregamos "type" a la destructuración
    const { page, limit, status, memberId, type, search, dateFrom, dateTo } = query;

    const filter = {};
    if (status) filter.status = status;
    if (memberId) filter.memberId = memberId;
    if (type) filter.type = type; // 2. Aplicamos el filtro de tipo
    if (search) filter.title = { $regex: search, $options: 'i' };
    
    if (dateFrom || dateTo) {
        const dateQuery = {};
        if (dateFrom) dateQuery.$gte = new Date(dateFrom);
        if (dateTo) dateQuery.$lte = new Date(dateTo);
        
        // 3. El filtro busca si la fecha cae en startDateTime (Citas) O en allDayDate (Cronograma)
        filter.$or = [
            { startDateTime: dateQuery },
            { allDayDate: dateQuery }
        ];
    }

    return await aggregatePaginate(Appointment, {
        filter,
        sort: { startDateTime: 1, allDayDate: 1 }, // Ordenar por ambas fechas posibles
        page,
        limit,
        lookups: [
            {
                $lookup: {
                    from: 'members',
                    localField: 'memberId',
                    foreignField: '_id',
                    as: 'memberId'
                }
            },
            { $unwind: { path: '$memberId', preserveNullAndEmptyArrays: true } },
            // NUEVO LOOKUP: Para el arreglo de participantes del cronograma
            {
                $lookup: {
                    from: 'members',
                    localField: 'participants',
                    foreignField: '_id',
                    as: 'participantsList' // Se llamará participantsList en el resultado
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'createdBy',
                    foreignField: '_id',
                    as: 'creatorId'
                }
            },
            { $unwind: { path: '$creatorId', preserveNullAndEmptyArrays: true } }
        ],
        project: { 'creator.password': 0 }
    });
};

export const findAppointmentById = async (id) => {
    return await Appointment.findById(id)
        .populate('memberId', 'fullName phone email')
        .populate('participants', 'fullName phone email') // Poblamos los involucrados del cronograma
        .populate('createdBy', 'username role');
};

export const updateAppointment = async (id, data) => {
    const existing = await Appointment.findById(id);

    if (existing?.googleEventId) {
        try {
            await updateCalendarEvent(existing.googleEventId, {
                title: data.title,
                description: data.description,
                startDateTime: data.startDateTime,
                allDayDate: data.allDayDate ? new Date(data.allDayDate).toISOString().split('T')[0] : undefined,
            });
            data.syncStatus = 'synced';
        } catch (error) {
            const errorType = error._googleErrorType || classifyGoogleError(error);

            if (errorType === GoogleErrorType.NOT_FOUND) {
                console.warn(`[GoogleCalendar] Evento ${existing.googleEventId} no existe en Google. Limpiando referencia.`);
                data.googleEventId = undefined;
                data.syncStatus = 'orphan';
            } else {
                console.error(`[GoogleCalendar] Error al actualizar evento (${errorType}):`, error.message);
                data.syncStatus = 'pending_sync';
            }
        }
    }

    // Usamos returnDocument: 'after' para eliminar el warning de Mongoose
    const updated = await Appointment.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true });

    const io = getIO();
    io.emit('appointment:updated', updated);

    return updated;
};

export const removeAppointment = async (id) => {
    const existing = await Appointment.findById(id);

    if (existing?.googleEventId) {
        try {
            await deleteCalendarEvent(existing.googleEventId);
        } catch (error) {
            const errorType = error._googleErrorType || classifyGoogleError(error);

            if (errorType !== GoogleErrorType.NOT_FOUND) {
                console.error(`[GoogleCalendar] Error al eliminar evento (${errorType}):`, error.message);
            }
        }
    }

    const deleted = await Appointment.findByIdAndDelete(id);

    const io = getIO();
    io.emit('appointment:deleted', { id });

    return deleted;
};