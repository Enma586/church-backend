import { z } from 'zod';
import { paginationFields } from '../pagination.js';
import { SACRAMENT_TYPE } from '../../constants/index.js';

const godparentSchema = z.object({
    name: z.string().trim().optional(),
    role: z.string().trim().default('Padrino/Madrina')
});

const godparentUpdateSchema = z.object({
    name: z.string().trim().optional(),
    role: z.string().trim().optional()
});

const createSacramentSchema = z.object({
    memberId: z.string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Un sacramento debe estar vinculado a un miembro'),
    type: z.enum(SACRAMENT_TYPE, { message: 'El tipo de sacramento es requerido' }),
    date: z.coerce.date(),
    place: z.string()
        .trim()
        .optional(),
    celebrant: z.string()
        .trim()
        .optional(),
    godparents: z.array(godparentSchema)
        .optional()
});

const updateSacramentSchema = z.object({
    type: z.enum(SACRAMENT_TYPE)
        .optional(),
    date: z.coerce.date()
        .optional(),
    place: z.string()
        .trim()
        .optional(),
    celebrant: z.string()
        .trim()
        .optional(),
    godparents: z.array(godparentUpdateSchema)
        .optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar'
});

const querySacramentSchema = z.object({
    ...paginationFields,
    type: z.enum(SACRAMENT_TYPE)
        .optional(),
    memberId: z.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional(),
    dateFrom: z.coerce.date()
        .optional(),
    dateTo: z.coerce.date()
        .optional()
}).refine(
    data => {
        if (data.dateFrom && data.dateTo) {
            return data.dateTo > data.dateFrom;
        }
        return true;
    },
    { message: 'La fecha final debe ser posterior a la fecha inicial', path: ['dateTo'] }
);

export {
    createSacramentSchema,
    updateSacramentSchema,
    querySacramentSchema
};
