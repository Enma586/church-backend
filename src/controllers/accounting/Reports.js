/**
 * @fileoverview Controladores HTTP para reportes contables.
 */

import * as AccountingService from '../../services/index.js';

export const ledger = async (req, res, next) => {
  try {
    const result = await AccountingService.getLedger(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const trialBalance = async (req, res, next) => {
  try {
    const result = await AccountingService.getTrialBalance(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const balanceSheet = async (req, res, next) => {
  try {
    const result = await AccountingService.getBalanceSheet(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const incomeStatement = async (req, res, next) => {
  try {
    const result = await AccountingService.getIncomeStatement(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// ── NUEVO: Exportar journal a PDF ────────────────────────────────
export const exportJournalPDF = async (req, res, next) => {
  try {
    await AccountingService.exportJournalPDF(req.query, res);
  } catch (err) {
    next(err);
  }
};

export const cashBalance = async (req, res, next) => {
  try {
    const result = await AccountingService.getCashBalance(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};