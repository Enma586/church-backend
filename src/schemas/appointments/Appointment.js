import Joi from 'joi';
import { paginationFields } from '../pagination.js';

/**
 * @description Validation schema for Appointment creation.
 */
const createAppointmentSchema = Joi.object({
    memberId: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            'any.required': 'Una cita debe estar vinculada a un miembro'
        }),
    title: Joi.string()
        .trim()
        .required()
        .messages({
            'string.empty': 'El título de la cita es requerido',
            'any.required': 'El título de la cita es requerido'
        }),
    description: Joi.string()
        .trim()
        .optional(),
    startDateTime: Joi.date()
        .required()
        .messages({
            'any.required': 'La fecha y hora de inicio son requeridas'
        }),
    endDateTime: Joi.date()
        .greater(Joi.ref('startDateTime'))
        .required()
        .messages({
            'any.required': 'La fecha y hora de fin son requeridas',
            'date.greater': 'La fecha de fin debe ser posterior a la fecha de inicio'
        }),
    suggestions: Joi.string()
        .trim()
        .optional(),
    observations: Joi.string()
        .trim()
        .optional(),
    googleEventId: Joi.string()
        .optional(),
    status: Joi.string()
        .valid('Programada', 'Completada', 'Cancelada', 'No asistió')
        .default('Programada'),
    createdBy: Joi.string()
        .hex()
        .length(24)
        .required()
});

/**
 * @description Validation schema for Appointment updates.
 */
const updateAppointmentSchema = Joi.object({
    memberId: Joi.string()
        .hex()
        .length(24)
        .optional(),
    title: Joi.string()
        .trim()
        .optional(),
    description: Joi.string()
        .trim()
        .optional(),
    startDateTime: Joi.date()
        .optional(),
    endDateTime: Joi.date()
        .greater(Joi.ref('startDateTime'))
        .optional(),
    suggestions: Joi.string()
        .trim()
        .optional(),
    observations: Joi.string()
        .trim()
        .optional(),
    googleEventId: Joi.string()
        .optional(),
    status: Joi.string()
        .valid('Programada', 'Completada', 'Cancelada', 'No asistió')
        .optional()
}).min(1);

const queryAppointmentSchema = Joi.object({
    ...paginationFields,
    status: Joi.string()
        .valid('Programada', 'Completada', 'Cancelada', 'No asistió')
        .optional(),
    memberId: Joi.string()
        .hex()
        .length(24)
        .optional(),
    search: Joi.string()
        .trim()
        .optional(),
    dateFrom: Joi.date()
        .optional(),
    dateTo: Joi.date()
        .greater(Joi.ref('dateFrom'))
        .optional()
        .messages({
            'date.greater': 'La fecha final debe ser posterior a la fecha inicial'
        })
});

export {
    createAppointmentSchema,
    updateAppointmentSchema,
    queryAppointmentSchema
};
