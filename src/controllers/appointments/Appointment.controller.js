import * as AppointmentService from '../../services/appointments/Appointment.js';

/**
 * @description Creates a new appointment.
 * The createdBy field is typically taken from req.user._id (injected by auth middleware).
 */
export const create = async (req, res, next) => {
    try {
        // Inject current user ID as the creator of the appointment
        const appointmentData = {
            ...req.body,
            createdBy: req.user._id 
        };

        const appointment = await AppointmentService.createAppointment(appointmentData);
        res.status(201).json({ success: true, data: appointment });
    } catch (err) {
        next(err);
    }
};

/**
 * @description Retrieves all appointments with pagination and filters (status, dates, memberId).
 */
export const findAll = async (req, res, next) => {
    try {
        // req.query is pre-validated by Joi (contains page, limit, etc.)
        const result = await AppointmentService.findAllAppointments(req.query);
        res.status(200).json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
};

/**
 * @description Gets a single appointment with populated Member and Creator data.
 */
export const findById = async (req, res, next) => {
    try {
        const appointment = await AppointmentService.findAppointmentById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Cita no encontrada' });
        }
        res.status(200).json({ success: true, data: appointment });
    } catch (err) {
        next(err);
    }
};

/**
 * @description Updates an appointment (status, observations, suggestions, etc.).
 */
export const update = async (req, res, next) => {
    try {
        const appointment = await AppointmentService.updateAppointment(req.params.id, req.body);
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Cita no encontrada' });
        }
        res.status(200).json({ success: true, data: appointment });
    } catch (err) {
        next(err);
    }
};

/**
 * @description Removes an appointment record.
 */
export const remove = async (req, res, next) => {
    try {
        const appointment = await AppointmentService.removeAppointment(req.params.id);
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Cita no encontrada' });
        }
        res.status(200).json({ success: true, message: 'Cita eliminada correctamente' });
    } catch (err) {
        next(err);
    }
};