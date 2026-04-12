import Joi from 'joi';
import { paginationFields } from '../pagination.js';

/**
 * @description Validation schema for Member creation.
 */
const createMemberSchema = Joi.object({
    fullName: Joi.string()
        .trim()
        .required()
        .messages({
            'string.empty': 'El nombre completo es requerido',
            'any.required': 'El nombre completo es requerido'
        }),
    dateOfBirth: Joi.date()
        .required()
        .messages({
            'any.required': 'La fecha de nacimiento es requerida'
        }),
    gender: Joi.string()
        .valid('Masculino', 'Femenino', 'Otro')
        .required(),
    phone: Joi.string()
        .trim()
        .optional(),
    email: Joi.string()
        .trim()
        .email()
        .lowercase()
        .optional(),
    departmentId: Joi.string()
        .hex()
        .length(24)
        .required(),
    municipalityId: Joi.string()
        .hex()
        .length(24)
        .required(),
    addressDetails: Joi.string()
        .trim()
        .optional(),
    family: Joi.array()
        .items(
            Joi.object({
                name: Joi.string().trim().required(),
                relationship: Joi.string()
                    .valid('Padre', 'Madre', 'Cónyuge', 'Hijo/a', 'Hermano/a', 'Tutor', 'Otro')
                    .required(),
                isMember: Joi.boolean().default(false)
            })
        )
        .optional(),
    status: Joi.string()
        .valid('Activo', 'Inactivo', 'Fallecido')
        .default('Activo')
});

/**
 * @description Validation schema for Member updates.
 */
const updateMemberSchema = Joi.object({
    fullName: Joi.string()
        .trim()
        .optional(),
    dateOfBirth: Joi.date()
        .optional(),
    gender: Joi.string()
        .valid('Masculino', 'Femenino', 'Otro')
        .optional(),
    phone: Joi.string()
        .trim()
        .optional(),
    email: Joi.string()
        .trim()
        .email()
        .lowercase()
        .optional(),
    departmentId: Joi.string()
        .hex()
        .length(24)
        .optional(),
    municipalityId: Joi.string()
        .hex()
        .length(24)
        .optional(),
    addressDetails: Joi.string()
        .trim()
        .optional(),
    family: Joi.array()
        .items(
            Joi.object({
                name: Joi.string().trim().required(),
                relationship: Joi.string()
                    .valid('Padre', 'Madre', 'Cónyuge', 'Hijo/a', 'Hermano/a', 'Tutor', 'Otro')
                    .required(),
                isMember: Joi.boolean().default(false)
            })
        )
        .optional(),
    status: Joi.string()
        .valid('Activo', 'Inactivo', 'Fallecido')
        .optional()
}).min(1);

const queryMemberSchema = Joi.object({
    ...paginationFields,
    status: Joi.string()
        .valid('Activo', 'Inactivo', 'Fallecido')
        .optional(),
    gender: Joi.string()
        .valid('Masculino', 'Femenino', 'Otro')
        .optional(),
    departmentId: Joi.string()
        .hex()
        .length(24)
        .optional(),
    search: Joi.string()
        .trim()
        .optional()
});

export {
    createMemberSchema,
    updateMemberSchema,
    queryMemberSchema
};
