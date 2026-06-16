import { Op } from 'sequelize'
import { Appointment, AppointmentParticipant, Member } from '../../models/index.js'
import { aggregatePaginate } from '../../utils/aggregatePaginate.js'
import { getIO } from '../../config/socket.js'
import { dateFromFilter, dateToFilter } from '../../utils/date.js'
import {
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    GoogleErrorType,
    classifyGoogleError,
} from '../config/GoogleCalendar.js'

export const createAppointment = async (data) => {
    let googleEventId
    let syncStatus = 'synced'

    try {
        googleEventId = await createCalendarEvent({
            title: data.title,
            description: data.description,
            startDateTime: data.startDateTime,
            allDayDate: data.allDayDate ? new Date(data.allDayDate).toISOString().split('T')[0] : undefined,
            reminders: {
                useDefault: false,
                overrides: [{ method: 'popup', minutes: 1440 }],
            },
        })
    } catch (error) {
        const errorType = error._googleErrorType || classifyGoogleError(error)
        if (errorType === GoogleErrorType.FORBIDDEN || errorType === GoogleErrorType.INVALID_INPUT) {
            console.error(`[GoogleCalendar] Fallo permanente al crear evento (${errorType}):`, error.message)
            syncStatus = 'failed'
        } else {
            console.error(`[GoogleCalendar] Error al crear evento (${errorType}):`, error.message)
            syncStatus = 'pending_sync'
        }
    }

    const { participants, ...appointmentData } = data
    const appointment = await Appointment.create({ ...appointmentData, googleEventId, syncStatus })

    if (participants && participants.length > 0) {
        const participantRecords = participants.map(memberId => ({
            appointmentId: appointment._id,
            memberId,
        }))
        await AppointmentParticipant.bulkCreate(participantRecords)
    }

    const created = await Appointment.findByPk(appointment._id, {
        include: [
            { association: 'member', attributes: ['_id', 'fullName', 'phone', 'email'] },
            { association: 'participants', include: [{ association: 'member', attributes: ['_id', 'fullName', 'phone', 'email'] }] },
            { association: 'creator', attributes: ['_id', 'username', 'role'] },
        ],
    })

    const io = getIO()
    io.emit('appointment:created', created.toJSON())

    return created
}

export const findAllAppointments = async (query) => {
    const { page, limit, status, memberId, type, search, dateFrom, dateTo } = query

    const filter = {}
    if (status) filter.status = status
    if (memberId) filter.memberId = memberId
    if (type) filter.type = type
    if (search) filter.title = { [Op.iLike]: `%${search}%` }

    if (dateFrom || dateTo) {
        const dateQuery = {}
        if (dateFrom) dateQuery[Op.gte] = dateFromFilter(dateFrom)
        if (dateTo) dateQuery[Op.lt] = dateToFilter(dateTo)

        filter[Op.or] = [
            { startDateTime: dateQuery },
            { allDayDate: dateQuery },
        ]
    }

    return await aggregatePaginate(Appointment, {
        filter,
        sort: { startDateTime: 1, allDayDate: 1 },
        page,
        limit,
        include: [
            { association: 'member', attributes: ['_id', 'fullName', 'phone', 'email'] },
            {
                association: 'participants',
                include: [{ association: 'member', attributes: ['_id', 'fullName', 'phone', 'email'] }],
            },
            { association: 'creator', attributes: ['_id', 'username', 'role'] },
        ],
    })
}

export const findAppointmentById = async (id) => {
    return await Appointment.findByPk(id, {
        include: [
            { association: 'member', attributes: ['_id', 'fullName', 'phone', 'email'] },
            {
                association: 'participants',
                include: [{ association: 'member', attributes: ['_id', 'fullName', 'phone', 'email'] }],
            },
            { association: 'creator', attributes: ['_id', 'username', 'role'] },
        ],
    })
}

export const updateAppointment = async (id, data) => {
    const appointment = await Appointment.findByPk(id)
    if (!appointment) return null

    if (appointment.googleEventId) {
        try {
            await updateCalendarEvent(appointment.googleEventId, {
                title: data.title,
                description: data.description,
                startDateTime: data.startDateTime,
                allDayDate: data.allDayDate ? new Date(data.allDayDate).toISOString().split('T')[0] : undefined,
            })
            data.syncStatus = 'synced'
        } catch (error) {
            const errorType = error._googleErrorType || classifyGoogleError(error)
            if (errorType === GoogleErrorType.NOT_FOUND) {
                console.warn(`[GoogleCalendar] Evento ${appointment.googleEventId} no existe en Google. Limpiando referencia.`)
                data.googleEventId = undefined
                data.syncStatus = 'orphan'
            } else {
                console.error(`[GoogleCalendar] Error al actualizar evento (${errorType}):`, error.message)
                data.syncStatus = 'pending_sync'
            }
        }
    }

    const { participants, ...updateData } = data
    await appointment.update(updateData)

    if (participants !== undefined) {
        await AppointmentParticipant.destroy({ where: { appointmentId: id } })
        if (participants.length > 0) {
            const participantRecords = participants.map(memberId => ({
                appointmentId: id,
                memberId,
            }))
            await AppointmentParticipant.bulkCreate(participantRecords)
        }
    }

    const updated = await Appointment.findByPk(id, {
        include: [
            { association: 'member', attributes: ['_id', 'fullName', 'phone', 'email'] },
            {
                association: 'participants',
                include: [{ association: 'member', attributes: ['_id', 'fullName', 'phone', 'email'] }],
            },
            { association: 'creator', attributes: ['_id', 'username', 'role'] },
        ],
    })

    const io = getIO()
    io.emit('appointment:updated', updated.toJSON())

    return updated
}

export const removeAppointment = async (id) => {
    const appointment = await Appointment.findByPk(id)
    if (!appointment) return null

    console.log('[Appointment] Borrando:', {
        id,
        hasGoogleId: !!appointment.googleEventId,
        googleEventId: appointment.googleEventId,
        type: appointment.type,
        title: appointment.title,
    })

    if (appointment.googleEventId) {
        try {
            await deleteCalendarEvent(appointment.googleEventId)
        } catch (error) {
            const errorType = error._googleErrorType || classifyGoogleError(error)
            if (errorType !== GoogleErrorType.NOT_FOUND) {
                console.error(`[GoogleCalendar] Error al eliminar evento (${errorType}):`, error.message)
            }
        }
    }

    await AppointmentParticipant.destroy({ where: { appointmentId: id } })
    await appointment.destroy()

    const io = getIO()
    io.emit('appointment:deleted', { id })

    return appointment
}
