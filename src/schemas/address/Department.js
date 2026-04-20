import { z } from 'zod';
import { paginationFields } from '../pagination.js';

const createDepartmentSchema = z.object({
    name: z.string()
        .trim()
        .min(1, 'El nombre del departamento es requerido'),
    isoCode: z.string()
        .trim()
        .optional()
});

const updateDepartmentSchema = z.object({
    name: z.string()
        .trim()
        .optional(),
    isoCode: z.string()
        .trim()
        .optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar'
});

const queryDepartmentSchema = z.object({
    ...paginationFields,
    search: z.string()
        .trim()
        .optional()
});

export {
    createDepartmentSchema,
    updateDepartmentSchema,
    queryDepartmentSchema
};
