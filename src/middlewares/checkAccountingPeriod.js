/**
 * @fileoverview Middleware de protección de períodos contables.
 * Bloquea operaciones transaccionales en meses o ejercicios fiscales cerrados.
 */

import Configuration from '../models/config/Configuration.js';
import { AppError } from '../utils/AppError.js';

/**
 * Valida que la fecha de la transacción corresponda a un período contable abierto.
 * Requiere que el request body contenga la propiedad 'date', de lo contrario asume la fecha actual del servidor.
 * * @param {Object} req - Objeto de petición Express.
 * @param {Object} res - Objeto de respuesta Express.
 * @param {Function} next - Función middleware de Express.
 */
export const checkAccountingPeriod = async (req, res, next) => {
    try {
        // Se determina la fecha de la transacción
        const transactionDate = req.body.date ? new Date(req.body.date) : new Date();

        // Se obtiene la configuración global del sistema
        const config = await Configuration.findOne();

        // Si no hay configuración o no se ha definido una fecha de cierre, se permite el paso
        if (!config || !config.accountingClosedDate) {
            return next();
        }

        const closedDate = new Date(config.accountingClosedDate);

        // Se bloquea la petición si la fecha de transacción es menor o igual a la fecha de cierre
        if (transactionDate <= closedDate) {
            throw new AppError(
                'Infracción fiscal: El período contable para la fecha proporcionada se encuentra cerrado. No se permiten modificaciones históricas.', 
                403
            );
        }

        next();
    } catch (error) {
        next(error);
    }
};