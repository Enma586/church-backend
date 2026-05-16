/**
 * @fileoverview Schemas de validación Zod para el catálogo de productos.
 */

import { z } from 'zod';
import { paginationFields } from '../pagination.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// ── Create ──────────────────────────────────────────────────────────────────────
export const createProductSchema = z.object({
    name: z.string()
        .trim()
        .min(1, 'El nombre del producto es requerido'),
    defaultPrice: z.number()
        .min(0, 'El precio no puede ser negativo')
        .default(0),
    incomeAccountId: z.string()
        .regex(objectIdRegex, 'ID de cuenta de ingreso inválido'),
    isActive: z.boolean().default(true)
});

// ── Update ──────────────────────────────────────────────────────────────────────
export const updateProductSchema = z.object({
    name: z.string().trim().min(1).optional(),
    defaultPrice: z.number().min(0).optional(),
    incomeAccountId: z.string().regex(objectIdRegex).optional(),
    isActive: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar'
});

// ── Query ───────────────────────────────────────────────────────────────────────
export const queryProductSchema = z.object({
    ...paginationFields,
    isActive: z.coerce.boolean().optional(),
    search: z.string().trim().optional()
});