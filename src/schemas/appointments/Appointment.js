import { z } from 'zod';
import { paginationFields } from '../pagination.js';
import { APPOINTMENT_STATUS } from '../../constants/index.js';

const createAppointmentSchema = z.object({
    memberId: z.string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Una cita debe estar vinculada a un miembro'),
    title: z.string()
        .trim()
        .min(1, 'El título de la cita es requerido'),
    description: z.string()
        .trim()
        .optional(),
    startDateTime: z.coerce.date(),
    endDateTime: z.coerce.date(),
    suggestions: z.string()
        .trim()
        .optional(),
    observations: z.string()
        .trim()
        .optional(),
    status: z.enum(APPOINTMENT_STATUS)
        .default('Programada')
}).refine(
    data => data.endDateTime > data.startDateTime,
    { message: 'La fecha de fin debe ser posterior a la fecha de inicio', path: ['endDateTime'] }
);

const updateAppointmentSchema = z.object({
    memberId: z.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional(),
    title: z.string()
        .trim()
        .optional(),
    description: z.string()
        .trim()
        .optional(),
    startDateTime: z.coerce.date()
        .optional(),
    endDateTime: z.coerce.date()
        .optional(),
    suggestions: z.string()
        .trim()
        .optional(),
    observations: z.string()
        .trim()
        .optional(),
    status: z.enum(APPOINTMENT_STATUS)
        .optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar'
}).refine(
    data => {
        if (data.startDateTime && data.endDateTime) {
            return data.endDateTime > data.startDateTime;
        }
        return true;
    },
    { message: 'La fecha de fin debe ser posterior a la fecha de inicio', path: ['endDateTime'] }
);

const queryAppointmentSchema = z.object({
    ...paginationFields,
    status: z.enum(APPOINTMENT_STATUS)
        .optional(),
    memberId: z.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional(),
    search: z.string()
        .trim()
        .optional(),
    dateFrom: z.coerce.date()
        .optional(),
    dateTo: z.coerce.date()
        .optional()
}).refine(
    data => {
        if (data.dateFrom && data.dateTo) {
            return data.dateTo > data.dateFrom;
        }
        return true;
    },
    { message: 'La fecha final debe ser posterior a la fecha inicial', path: ['dateTo'] }
);

export {
    createAppointmentSchema,
    updateAppointmentSchema,
    queryAppointmentSchema
};
