import { z } from 'zod';
import { paginationFields } from '../pagination.js';
import { GENDER, MEMBER_STATUS, FAMILY_RELATIONSHIP } from '../../constants/index.js';

const familyMemberSchema = z.object({
    name: z.string().trim().min(1),
    relationship: z.enum(FAMILY_RELATIONSHIP),
    isMember: z.boolean().default(false),
    contactNumber: z.string().trim().optional()
});

const createMemberSchema = z.object({
    fullName: z.string()
        .trim()
        .min(1, 'El nombre completo es requerido'),
    dateOfBirth: z.coerce.date(),
    gender: z.enum(GENDER),
    phone: z.string()
        .trim()
        .optional(),
    email: z.string()
        .trim()
        .email()
        .toLowerCase()
        .optional()
        .or(z.literal('')),
    departmentId: z.string()
        .regex(/^[0-9a-fA-F]{24}$/),
    municipalityId: z.string()
        .regex(/^[0-9a-fA-F]{24}$/),
    addressDetails: z.string()
        .trim()
        .optional(),
    family: z.array(familyMemberSchema)
        .optional(),
    status: z.enum(MEMBER_STATUS)
        .default('Activo')
});

const updateMemberSchema = z.object({
    fullName: z.string()
        .trim()
        .optional(),
    dateOfBirth: z.coerce.date()
        .optional(),
    gender: z.enum(GENDER)
        .optional(),
    phone: z.string()
        .trim()
        .optional(),
    email: z.string()
        .trim()
        .email()
        .toLowerCase()
        .optional()
        .or(z.literal('')),
    departmentId: z.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional(),
    municipalityId: z.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional(),
    addressDetails: z.string()
        .trim()
        .optional(),
    family: z.array(familyMemberSchema)
        .optional(),
    status: z.enum(MEMBER_STATUS)
        .optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar'
});

const queryMemberSchema = z.object({
    ...paginationFields,
    status: z.enum(MEMBER_STATUS)
        .optional(),
    gender: z.enum(GENDER)
        .optional(),
    departmentId: z.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional(),
    search: z.string()
        .trim()
        .optional()
});

export {
    createMemberSchema,
    updateMemberSchema,
    queryMemberSchema
};
