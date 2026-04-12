import Joi from 'joi';
import { paginationFields } from '../pagination.js';

/**
 * @description Validation schema for PastoralNote creation.
 */
const createPastoralNoteSchema = Joi.object({
    memberId: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            'any.required': 'La nota debe estar vinculada a un miembro'
        }),
    authorId: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            'any.required': 'Se requiere un autor (Usuario) para responsabilidad'
        }),
    content: Joi.string()
        .trim()
        .required()
        .messages({
            'string.empty': 'El contenido de la nota no puede estar vacío',
            'any.required': 'El contenido de la nota no puede estar vacío'
        }),
    isSensitive: Joi.boolean()
        .default(false)
});

/**
 * @description Validation schema for PastoralNote updates.
 */
const updatePastoralNoteSchema = Joi.object({
    content: Joi.string()
        .trim()
        .optional(),
    isSensitive: Joi.boolean()
        .optional()
}).min(1);

const queryPastoralNoteSchema = Joi.object({
    ...paginationFields,
    memberId: Joi.string()
        .hex()
        .length(24)
        .optional(),
    isSensitive: Joi.boolean()
        .optional()
});

export {
    createPastoralNoteSchema,
    updatePastoralNoteSchema,
    queryPastoralNoteSchema
};
