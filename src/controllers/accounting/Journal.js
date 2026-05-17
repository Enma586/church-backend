/**
 * @fileoverview Controladores HTTP para asientos contables (partida doble).
 */

import * as AccountingService from '../../services/index.js';

export const create = async (req, res, next) => {
    try {
        const entry = await AccountingService.createJournalEntry(req.body, req.user._id);
        res.status(201).json({ success: true, data: entry });
    } catch (err) {
        next(err);
    }
};

export const findAll = async (req, res, next) => {
    try {
        const result = await AccountingService.findAllJournalEntries(req.query);
        res.status(200).json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
};

export const findById = async (req, res, next) => {
    try {
        const entry = await AccountingService.findJournalEntryById(req.params.id);
        if (!entry) {
            return res.status(404).json({ success: false, message: 'Asiento contable no encontrado' });
        }
        res.status(200).json({ success: true, data: entry });
    } catch (err) {
        next(err);
    }
};

export const update = async (req, res, next) => {
    try {
        const entry = await AccountingService.updateJournalEntry(req.params.id, req.body);
        res.status(200).json({ success: true, data: entry });
    } catch (err) {
        next(err);
    }
};

export const remove = async (req, res, next) => {
    try {
        const entry = await AccountingService.removeJournalEntry(req.params.id);
        if (!entry) {
            return res.status(404).json({ success: false, message: 'Asiento contable no encontrado' });
        }
        res.status(200).json({ success: true, message: 'Asiento contable eliminado correctamente' });
    } catch (err) {
        next(err);
    }
};