/**
 * @fileoverview Schema Zod para cierre de caja.
 */

import { z } from 'zod';
import { paginationFields } from '../pagination.js';

const denominationSchema = z.object({
  denomination: z.number().positive(),
  quantity: z.number().int().min(0),
});

export const createCashClosingSchema = z.object({
  date: z.coerce.date()
    .default(() => new Date()),
  concept: z.string().trim().optional(),
  denominations: z.array(denominationSchema)
    .min(1, 'Debe incluir al menos una denominación'),
  notes: z.string().trim().optional(),
});

export const queryCashClosingSchema = z.object({
  ...paginationFields,
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});