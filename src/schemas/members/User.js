import Joi from 'joi';
import { paginationFields } from '../pagination.js';
import { USER_ROLE } from '../../constants/index.js';

const createUserSchema = Joi.object({
    memberId: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            'any.required': 'El usuario debe estar vinculado a un perfil de Miembro'
        }),
    username: Joi.string()
        .trim()
        .lowercase()
        .required()
        .messages({
            'string.empty': 'El nombre de usuario es requerido',
            'any.required': 'El nombre de usuario es requerido'
        }),
    password: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.empty': 'La contraseña es requerida',
            'string.min': 'La contraseña debe tener al menos 6 caracteres',
            'any.required': 'La contraseña es requerida'
        }),
    role: Joi.string()
        .valid(...USER_ROLE)
        .default('Subcoordinador'),
    isActive: Joi.boolean()
        .default(true)
});

const updateUserSchema = Joi.object({
    username: Joi.string()
        .trim()
        .lowercase()
        .optional(),
    password: Joi.string()
        .min(6)
        .optional(),
    role: Joi.string()
        .valid(...USER_ROLE)
        .optional(),
    isActive: Joi.boolean()
        .optional()
}).min(1);

const loginUserSchema = Joi.object({
    username: Joi.string()
        .trim()
        .lowercase()
        .required()
        .messages({
            'any.required': 'El nombre de usuario es requerido'
        }),
    password: Joi.string()
        .required()
        .messages({
            'any.required': 'La contraseña es requerida'
        })
});

const queryUserSchema = Joi.object({
    ...paginationFields,
    role: Joi.string()
        .valid(...USER_ROLE)
        .optional(),
    isActive: Joi.boolean()
        .optional(),
    search: Joi.string()
        .trim()
        .optional()
});

export {
    createUserSchema,
    updateUserSchema,
    loginUserSchema,
    queryUserSchema
};
