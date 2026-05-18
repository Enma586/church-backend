/**
 * @fileoverview Lógica de negocio para cierre y reapertura de períodos contables.
 * Actualiza la configuración global con la fecha de corte fiscal.
 */

import { Configuration, JournalEntry } from '../../models/index.js';
import { getIO } from '../../config/socket.js';
import { AppError } from '../../utils/AppError.js';

// ── Cerrar período ──────────────────────────────────────────────────────────────
export const closePeriod = async (date) => {
    const closeDate = new Date(date);

    // Validar que no sea una fecha futura
    if (closeDate > new Date()) {
        throw new AppError('No se puede cerrar el período con una fecha futura', 400);
    }

    // Verificar que no existan asientos desbalanceados hasta la fecha de cierre
    const unbalancedEntries = await JournalEntry.find({
        date: { $lte: closeDate },
        status: 'Valido'
    }).lean();

    // La validación de balance ya está en el pre-save del modelo,
    // así que todos los asientos guardados deberían estar balanceados.
    // Verificamos de todas formas por seguridad.
    for (const entry of unbalancedEntries) {
        let totalDebit = 0;
        let totalCredit = 0;
        for (const line of entry.lines) {
            totalDebit += line.debit;
            totalCredit += line.credit;
        }
        if (totalDebit !== totalCredit) {
            throw new AppError(
                `El asiento ${entry.voucherNumber} está desbalanceado. Corríjalo antes de cerrar.`,
                400
            );
        }
    }

    const config = await Configuration.findOne();
    if (!config) {
        throw new AppError('No existe configuración del sistema', 500);
    }

    const previousDate = config.accountingClosedDate;

    const updated = await Configuration.findByIdAndUpdate(
        config._id,
        { accountingClosedDate: closeDate },
        { new: true }
    );

    const io = getIO();
    io.emit('accounting:period-closed', {
        closedDate: closeDate,
        previousClosedDate: previousDate
    });

    return {
        closedDate: updated.accountingClosedDate,
        previousClosedDate: previousDate
    };
};

// ── Reabrir período ─────────────────────────────────────────────────────────────
export const reopenPeriod = async () => {
    const config = await Configuration.findOne();
    if (!config) {
        throw new AppError('No existe configuración del sistema', 500);
    }

    if (!config.accountingClosedDate) {
        throw new AppError('El período contable ya se encuentra abierto', 400);
    }

    const previousDate = config.accountingClosedDate;

    const updated = await Configuration.findByIdAndUpdate(
        config._id,
        { accountingClosedDate: null },
        { new: true }
    );

    const io = getIO();
    io.emit('accounting:period-reopened', {
        previousClosedDate: previousDate
    });

    return {
        previousClosedDate: previousDate,
        closedDate: null
    };
};