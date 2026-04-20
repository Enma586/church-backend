import { z } from 'zod';
import { paginationFields } from '../pagination.js';

const createMunicipalitySchema = z.object({
    name: z.string()
        .trim()
        .min(1, 'El nombre del municipio es requerido'),
    departmentId: z.string()
        .regex(/^[0-9a-fA-F]{24}$/, 'El municipio debe pertenecer a un departamento'),
    code: z.string()
        .trim()
        .optional()
});

const updateMunicipalitySchema = z.object({
    name: z.string()
        .trim()
        .optional(),
    departmentId: z.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional(),
    code: z.string()
        .trim()
        .optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar'
});

const queryMunicipalitySchema = z.object({
    ...paginationFields,
    search: z.string()
        .trim()
        .optional(),
    departmentId: z.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional()
});

export {
    createMunicipalitySchema,
    updateMunicipalitySchema,
    queryMunicipalitySchema
};
