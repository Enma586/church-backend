/**
 * @description Entry point for the Appointments domain schemas.
 * Centralizes the appointment validation logic.
 */
import { createAppointmentSchema, updateAppointmentSchema, queryAppointmentSchema } from './Appointment.js';

export {
    createAppointmentSchema,
    updateAppointmentSchema,
    queryAppointmentSchema
};
