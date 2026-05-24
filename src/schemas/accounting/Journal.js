/**
 * @fileoverview Schemas de validación Zod para asientos contables simplificados.
 */

import { z } from 'zod';
import { paginationFields } from '../pagination.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// ── Create ──────────────────────────────────────────────────────────────────────
export const createJournalEntrySchema = z.object({
  date: z.coerce.date()
    .default(() => new Date()),
  type: z.enum(['Ingreso', 'Egreso'], { message: 'El tipo debe ser Ingreso o Egreso' }),
  concept: z.string()
    .trim()
    .min(1, 'El concepto del asiento es requerido'),
  account: z.string()
    .regex(objectIdRegex, 'ID de cuenta inválido'),
  product: z.string()
    .regex(objectIdRegex, 'ID de producto inválido')
    .optional()
    .nullable(),
  amount: z.number()
    .positive('El monto debe ser mayor a cero'),
});

// ── Update (solo anular) ────────────────────────────────────────────────────────
export const updateJournalEntrySchema = z.object({
  status: z.enum(['Valido', 'Anulado'], { message: 'Estado inválido' }),
});

// ── Query ───────────────────────────────────────────────────────────────────────
export const queryJournalEntrySchema = z.object({
  ...paginationFields,
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  type: z.enum(['Ingreso', 'Egreso']).optional(),
  status: z.enum(['Valido', 'Anulado']).optional(),
  search: z.string().trim().optional(),
}).refine(
  (data) => {
    if (data.dateFrom && data.dateTo) {
      return data.dateTo >= data.dateFrom;
    }
    return true;
  },
  { message: 'La fecha final debe ser posterior o igual a la inicial', path: ['dateTo'] }
);