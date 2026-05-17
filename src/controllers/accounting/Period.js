/**
 * @fileoverview Controladores HTTP para cierre y reapertura de períodos contables.
 */

import * as AccountingService from '../../services/index.js';

export const close = async (req, res, next) => {
    try {
        const result = await AccountingService.closePeriod(req.body.date);
        res.status(200).json({
            success: true,
            message: 'Período contable cerrado exitosamente',
            data: result
        });
    } catch (err) {
        next(err);
    }
};

export const reopen = async (req, res, next) => {
    try {
        const result = await AccountingService.reopenPeriod();
        res.status(200).json({
            success: true,
            message: 'Período contable reabierto exitosamente',
            data: result
        });
    } catch (err) {
        next(err);
    }
};