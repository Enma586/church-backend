/**
 * @fileoverview Schemas de validación Zod para asientos contables (partida doble).
 */

import { z } from 'zod';
import { paginationFields } from '../pagination.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// ── Línea de asiento ────────────────────────────────────────────────────────────
const journalLineSchema = z.object({
    account: z.string()
        .regex(objectIdRegex, 'ID de cuenta inválido'),
    debit: z.number()
        .min(0, 'El débito no puede ser negativo')
        .default(0),
    credit: z.number()
        .min(0, 'El crédito no puede ser negativo')
        .default(0),
    description: z.string().trim().optional()
}).refine(
    line => !(line.debit > 0 && line.credit > 0),
    { message: 'Una línea no puede tener débito y crédito simultáneamente' }
);

// ── Create ──────────────────────────────────────────────────────────────────────
export const createJournalEntrySchema = z.object({
    date: z.coerce.date()
        .default(() => new Date()),
    concept: z.string()
        .trim()
        .min(1, 'El concepto del asiento es requerido'),
    lines: z.array(journalLineSchema)
        .min(2, 'Un asiento contable requiere al menos dos líneas')
});

// ── Update (solo permite anular) ────────────────────────────────────────────────
export const updateJournalEntrySchema = z.object({
    status: z.enum(['VALIDO', 'ANULADO'], { message: 'Estado inválido' })
});

// ── Query ───────────────────────────────────────────────────────────────────────
export const queryJournalEntrySchema = z.object({
    ...paginationFields,
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    status: z.enum(['VALIDO', 'ANULADO']).optional(),
    search: z.string().trim().optional()
}).refine(
    data => {
        if (data.dateFrom && data.dateTo) {
            return data.dateTo > data.dateFrom;
        }
        return true;
    },
    { message: 'La fecha final debe ser posterior a la fecha inicial', path: ['dateTo'] }
);