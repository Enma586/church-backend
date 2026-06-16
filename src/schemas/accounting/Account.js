/**
 * @fileoverview Schemas de validación Zod para el catálogo de cuentas contables.
 */

import { z } from 'zod';
import { paginationFields } from '../pagination.js';
import { CUENTA_TYPE } from '../../constants/index.js';

const objectId = z.string().uuid('ID de cuenta inválido');

// ── Create ──────────────────────────────────────────────────────────────────────
export const createAccountSchema = z.object({
    code: z.string()
        .trim()
        .min(1, 'El código de cuenta es requerido'),
    name: z.string()
        .trim()
        .min(1, 'El nombre de la cuenta es requerido'),
    type: z.enum(CUENTA_TYPE, { message: 'Tipo de cuenta inválido' }),
    parentAccount: objectId.nullable().optional(),
    acceptsTransactions: z.boolean().default(true),
    isActive: z.boolean().default(true)
});

// ── Update ──────────────────────────────────────────────────────────────────────
export const updateAccountSchema = z.object({
    name: z.string().trim().min(1).optional(),
    type: z.enum(CUENTA_TYPE).optional(),
    parentAccount: objectId.nullable().optional(),
    acceptsTransactions: z.boolean().optional(),
    isActive: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar'
});

// ── Query ───────────────────────────────────────────────────────────────────────
export const queryAccountSchema = z.object({
    ...paginationFields,
    type: z.enum(CUENTA_TYPE).optional(),
    isActive: z.coerce.boolean().optional(),
    search: z.string().trim().optional()
});