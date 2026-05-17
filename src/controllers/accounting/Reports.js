/**
 * @fileoverview Controladores HTTP para reportes contables.
 */

import * as AccountingService from '../../services/index.js';

export const ledger = async (req, res, next) => {
    try {
        const result = await AccountingService.getLedger(req.query);
        res.status(200).json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
};

export const trialBalance = async (req, res, next) => {
    try {
        const result = await AccountingService.getTrialBalance(req.query);
        res.status(200).json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
};

export const balanceSheet = async (req, res, next) => {
    try {
        const result = await AccountingService.getBalanceSheet(req.query);
        res.status(200).json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
};

export const incomeStatement = async (req, res, next) => {
    try {
        const result = await AccountingService.getIncomeStatement(req.query);
        res.status(200).json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
};