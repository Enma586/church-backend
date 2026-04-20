import { z } from 'zod';
import { paginationFields } from '../pagination.js';
import { USER_ROLE } from '../../constants/index.js';

const createUserSchema = z.object({
    memberId: z.string()
        .regex(/^[0-9a-fA-F]{24}$/, 'El usuario debe estar vinculado a un perfil de Miembro'),
    username: z.string()
        .trim()
        .toLowerCase()
        .min(1, 'El nombre de usuario es requerido'),
    password: z.string()
        .min(6, 'La contraseña debe tener al menos 6 caracteres'),
    role: z.enum(USER_ROLE)
        .default('Subcoordinador'),
    isActive: z.boolean()
        .default(true)
});

const updateUserSchema = z.object({
    username: z.string()
        .trim()
        .toLowerCase()
        .optional(),
    password: z.string()
        .min(6)
        .optional(),
    role: z.enum(USER_ROLE)
        .optional(),
    isActive: z.boolean()
        .optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar'
});

const loginUserSchema = z.object({
    username: z.string()
        .trim()
        .toLowerCase()
        .min(1, 'El nombre de usuario es requerido'),
    password: z.string()
        .min(1, 'La contraseña es requerida')
});

const queryUserSchema = z.object({
    ...paginationFields,
    role: z.enum(USER_ROLE)
        .optional(),
    isActive: z.coerce.boolean()
        .optional(),
    search: z.string()
        .trim()
        .optional()
});

export {
    createUserSchema,
    updateUserSchema,
    loginUserSchema,
    queryUserSchema
};
