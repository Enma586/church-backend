import { Appointment } from '../../models/index.js';
import { aggregatePaginate } from '../../utils/aggregatePaginate.js';
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
        googleEventId = await createCalendarEvent({
            title: data.title,
            description: data.description,
            startDateTime: data.startDateTime,
            endDateTime: data.endDateTime,
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

    return await Appointment.create({ ...data, googleEventId, syncStatus });
};

export const findAllAppointments = async (query) => {
    const { page, limit, status, memberId, search, dateFrom, dateTo } = query;

    const filter = {};
    if (status) filter.status = status;
    if (memberId) filter.memberId = memberId;
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (dateFrom || dateTo) {
        filter.startDateTime = {};
        if (dateFrom) filter.startDateTime.$gte = new Date(dateFrom);
        if (dateTo) filter.startDateTime.$lte = new Date(dateTo);
    }

    return await aggregatePaginate(Appointment, {
        filter,
        sort: { startDateTime: 1 },
        page,
        limit,
        lookups: [
            {
                $lookup: {
                    from: 'members',
                    localField: 'memberId',
                    foreignField: '_id',
                    as: 'member'
                }
            },
            { $unwind: { path: '$member', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'createdBy',
                    foreignField: '_id',
                    as: 'creator'
                }
            },
            { $unwind: { path: '$creator', preserveNullAndEmptyArrays: true } }
        ],
        project: { 'creator.password': 0 }
    });
};

export const findAppointmentById = async (id) => {
    return await Appointment.findById(id)
        .populate('memberId', 'fullName phone email')
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
                endDateTime: data.endDateTime,
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

    return await Appointment.findByIdAndUpdate(id, data, { new: true, runValidators: true });
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

    return await Appointment.findByIdAndDelete(id);
};
