import { z } from 'zod';
import { paginationFields } from '../pagination.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const ledgerQuerySchema = z.object({
  accountId: z.string().regex(objectIdRegex, 'ID de cuenta inválido'),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  ...paginationFields,
}).refine(
  (data) => {
    if (data.dateFrom && data.dateTo) {
      return data.dateTo > data.dateFrom;
    }
    return true;
  },
  { message: 'La fecha final debe ser posterior a la fecha inicial', path: ['dateTo'] }
);

export const trialBalanceQuerySchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
}).refine(
  (data) => {
    if (data.dateFrom && data.dateTo) {
      return data.dateTo > data.dateFrom;
    }
    return true;
  },
  { message: 'La fecha final debe ser posterior a la fecha inicial', path: ['dateTo'] }
);

export const balanceSheetQuerySchema = z.object({
  asOfDate: z.coerce.date().default(() => new Date()).optional(),
});

export const incomeStatementQuerySchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
}).refine(
  (data) => {
    if (data.dateFrom && data.dateTo) {
      return data.dateTo > data.dateFrom;
    }
    return true;
  },
  { message: 'La fecha final debe ser posterior a la fecha inicial', path: ['dateTo'] }
);

// ── Nuevo: Exportar journal a PDF ──────────────────────────────────
export const exportJournalPDFSchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  type: z.enum(['Ingreso', 'Egreso']).optional(),
  status: z.enum(['Valido', 'Anulado']).optional(),
}).refine(
  (data) => {
    if (data.dateFrom && data.dateTo) {
      return data.dateTo > data.dateFrom;
    }
    return true;
  },
  { message: 'La fecha final debe ser posterior a la fecha inicial', path: ['dateTo'] }
);