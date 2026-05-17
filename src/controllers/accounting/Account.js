/**
 * @fileoverview Controladores HTTP para el catálogo de cuentas contables.
 */

import * as AccountingService from '../../services/index.js';

export const create = async (req, res, next) => {
    try {
        const account = await AccountingService.createAccount(req.body);
        res.status(201).json({ success: true, data: account });
    } catch (err) {
        next(err);
    }
};

export const findAll = async (req, res, next) => {
    try {
        const result = await AccountingService.findAllAccounts(req.query);
        res.status(200).json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
};

export const findById = async (req, res, next) => {
    try {
        const account = await AccountingService.findAccountById(req.params.id);
        if (!account) {
            return res.status(404).json({ success: false, message: 'Cuenta contable no encontrada' });
        }
        res.status(200).json({ success: true, data: account });
    } catch (err) {
        next(err);
    }
};

export const update = async (req, res, next) => {
    try {
        const account = await AccountingService.updateAccount(req.params.id, req.body);
        res.status(200).json({ success: true, data: account });
    } catch (err) {
        next(err);
    }
};

export const remove = async (req, res, next) => {
    try {
        await AccountingService.removeAccount(req.params.id);
        res.status(200).json({ success: true, message: 'Cuenta contable eliminada correctamente' });
    } catch (err) {
        next(err);
    }
};