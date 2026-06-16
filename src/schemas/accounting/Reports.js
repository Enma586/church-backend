import { z } from 'zod';
import { paginationFields } from '../pagination.js';

export const ledgerQuerySchema = z.object({
  accountId: z.string().uuid('ID de cuenta inválido'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  ...paginationFields,
}).refine(
  (data) => {
    if (data.dateFrom && data.dateTo) {
      return data.dateTo >= data.dateFrom;
    }
    return true;
  },
  { message: 'La fecha final debe ser posterior o igual a la inicial', path: ['dateTo'] }
);

export const trialBalanceQuerySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
}).refine(
  (data) => {
    if (data.dateFrom && data.dateTo) {
      return data.dateTo >= data.dateFrom;
    }
    return true;
  },
  { message: 'La fecha final debe ser posterior o igual a la inicial', path: ['dateTo'] }
);

export const incomeStatementQuerySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
}).refine(
  (data) => {
    if (data.dateFrom && data.dateTo) {
      return data.dateTo >= data.dateFrom;
    }
    return true;
  },
  { message: 'La fecha final debe ser posterior o igual a la inicial', path: ['dateTo'] }
);

// ── Nuevo: Exportar journal a PDF ──────────────────────────────────
export const exportJournalPDFSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  type: z.enum(['Ingreso', 'Egreso']).optional(),
  status: z.enum(['Valido', 'Anulado']).optional(),
}).refine(
  (data) => {
    if (data.dateFrom && data.dateTo) {
      return data.dateTo >= data.dateFrom;
    }
    return true;
  },
  { message: 'La fecha final debe ser posterior o igual a la inicial', path: ['dateTo'] }
);

export const cashBalanceQuerySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
}).refine(
  (data) => {
    if (data.dateFrom && data.dateTo) {
      return data.dateTo >= data.dateFrom;
    }
    return true;
  },
  { message: 'La fecha final debe ser posterior o igual a la inicial', path: ['dateTo'] }
);

export const balanceSheetQuerySchema = z.object({
  asOfDate: z.coerce.date().default(() => new Date()).optional(),
});