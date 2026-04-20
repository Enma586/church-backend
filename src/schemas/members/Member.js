import Joi from 'joi';
import { paginationFields } from '../pagination.js';
import { GENDER, MEMBER_STATUS, FAMILY_RELATIONSHIP } from '../../constants/index.js';

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
        .valid(...GENDER)
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
                    .valid(...FAMILY_RELATIONSHIP)
                    .required(),
                isMember: Joi.boolean().default(false),
                contactNumber: Joi.string().trim().required()
            })
        )
        .optional(),
    status: Joi.string()
        .valid(...MEMBER_STATUS)
        .default('Activo')
});

const updateMemberSchema = Joi.object({
    fullName: Joi.string()
        .trim()
        .optional(),
    dateOfBirth: Joi.date()
        .optional(),
    gender: Joi.string()
        .valid(...GENDER)
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
                    .valid(...FAMILY_RELATIONSHIP)
                    .required(),
                isMember: Joi.boolean().default(false),
                contactNumber: Joi.string().trim().required()
            })
        )
        .optional(),
    status: Joi.string()
        .valid(...MEMBER_STATUS)
        .optional()
}).min(1);

const queryMemberSchema = Joi.object({
    ...paginationFields,
    status: Joi.string()
        .valid(...MEMBER_STATUS)
        .optional(),
    gender: Joi.string()
        .valid(...GENDER)
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
