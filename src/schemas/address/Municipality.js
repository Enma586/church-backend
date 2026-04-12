import Joi from 'joi';
import { paginationFields } from '../pagination.js';

/**
 * @description Validation schema for Municipality creation.
 */
const createMunicipalitySchema = Joi.object({
    name: Joi.string()
        .trim()
        .required()
        .messages({
            'string.empty': 'El nombre del municipio es requerido',
            'any.required': 'El nombre del municipio es requerido'
        }),
    departmentId: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            'any.required': 'El municipio debe pertenecer a un departamento'
        }),
    code: Joi.string()
        .trim()
        .optional()
});

/**
 * @description Validation schema for Municipality updates.
 */
const updateMunicipalitySchema = Joi.object({
    name: Joi.string()
        .trim()
        .optional(),
    departmentId: Joi.string()
        .hex()
        .length(24)
        .optional(),
    code: Joi.string()
        .trim()
        .optional()
}).min(1);

const queryMunicipalitySchema = Joi.object({
    ...paginationFields,
    search: Joi.string()
        .trim()
        .optional(),
    departmentId: Joi.string()
        .hex()
        .length(24)
        .optional()
});

export {
    createMunicipalitySchema,
    updateMunicipalitySchema,
    queryMunicipalitySchema
};
