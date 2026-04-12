import Joi from 'joi';
import { paginationFields } from '../pagination.js';

/**
 * @description Validation schema for Sacrament creation.
 */
const createSacramentSchema = Joi.object({
    memberId: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            'any.required': 'Un sacramento debe estar vinculado a un miembro'
        }),
    type: Joi.string()
        .valid('Bautismo', 'Primera Comunión', 'Confirmación', 'Matrimonio', 'Unción de los Enfermos')
        .required()
        .messages({
            'any.required': 'El tipo de sacramento es requerido'
        }),
    date: Joi.date()
        .required()
        .messages({
            'any.required': 'La fecha del sacramento es requerida'
        }),
    place: Joi.string()
        .trim()
        .optional(),
    celebrant: Joi.string()
        .trim()
        .optional(),
    godparents: Joi.array()
        .items(
            Joi.object({
                name: Joi.string().trim().optional(),
                role: Joi.string().trim().default('Padrino/Madrina')
            })
        )
        .optional()
});

/**
 * @description Validation schema for Sacrament updates.
 */
const updateSacramentSchema = Joi.object({
    type: Joi.string()
        .valid('Bautismo', 'Primera Comunión', 'Confirmación', 'Matrimonio', 'Unción de los Enfermos')
        .optional(),
    date: Joi.date()
        .optional(),
    place: Joi.string()
        .trim()
        .optional(),
    celebrant: Joi.string()
        .trim()
        .optional(),
    godparents: Joi.array()
        .items(
            Joi.object({
                name: Joi.string().trim().optional(),
                role: Joi.string().trim().optional()
            })
        )
        .optional()
}).min(1);

const querySacramentSchema = Joi.object({
    ...paginationFields,
    type: Joi.string()
        .valid('Bautismo', 'Primera Comunión', 'Confirmación', 'Matrimonio', 'Unción de los Enfermos')
        .optional(),
    memberId: Joi.string()
        .hex()
        .length(24)
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
    createSacramentSchema,
    updateSacramentSchema,
    querySacramentSchema
};
