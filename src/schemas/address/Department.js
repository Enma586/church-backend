import Joi from 'joi';
import { paginationFields } from '../pagination.js';

/**
 * @description Validation schema for Department creation.
 */
const createDepartmentSchema = Joi.object({
    name: Joi.string()
        .trim()
        .required()
        .messages({
            'string.empty': 'El nombre del departamento es requerido',
            'any.required': 'El nombre del departamento es requerido'
        }),
    isoCode: Joi.string()
        .trim()
        .optional()
});

/**
 * @description Validation schema for Department updates.
 */
const updateDepartmentSchema = Joi.object({
    name: Joi.string()
        .trim()
        .optional(),
    isoCode: Joi.string()
        .trim()
        .optional()
}).min(1);

const queryDepartmentSchema = Joi.object({
    ...paginationFields,
    search: Joi.string()
        .trim()
        .optional()
});

export {
    createDepartmentSchema,
    updateDepartmentSchema,
    queryDepartmentSchema
};
