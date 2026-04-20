import { z } from 'zod';
import { paginationFields } from '../pagination.js';

const createPastoralNoteSchema = z.object({
    memberId: z.string()
        .regex(/^[0-9a-fA-F]{24}$/, 'La nota debe estar vinculada a un miembro'),
    content: z.string()
        .trim()
        .min(1, 'El contenido de la nota no puede estar vacío'),
    isSensitive: z.boolean()
        .default(false)
});

const updatePastoralNoteSchema = z.object({
    content: z.string()
        .trim()
        .optional(),
    isSensitive: z.boolean()
        .optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar'
});

const queryPastoralNoteSchema = z.object({
    ...paginationFields,
    memberId: z.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional(),
    isSensitive: z.coerce.boolean()
        .optional()
});

export {
    createPastoralNoteSchema,
    updatePastoralNoteSchema,
    queryPastoralNoteSchema
};
