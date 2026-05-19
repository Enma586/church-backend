/**
 * @fileoverview Lógica de negocio para cierre y reapertura de períodos contables.
 * Actualiza la configuración global con la fecha de corte fiscal.
 * Adaptado a sistema de Ingreso/Egreso.
 */

import { Configuration, JournalEntry } from '../../models/index.js';
import { getIO } from '../../config/socket.js';
import { AppError } from '../../utils/AppError.js';
import { parseLocalDate } from '../../utils/date.js';

export const closePeriod = async (date) => {
  const closeDate = parseLocalDate(date);

  if (closeDate > new Date()) {
    throw new AppError('No se puede cerrar el período con una fecha futura', 400);
  }

  // Verificar que no existan asientos con monto cero o negativo hasta la fecha
  const invalidEntries = await JournalEntry.find({
    date: { $lte: closeDate },
    status: 'Valido',
    amount: { $lte: 0 },
  }).lean();

  if (invalidEntries.length > 0) {
    throw new AppError(
      `Existen ${invalidEntries.length} asiento(s) con monto inválido. Corríjalos antes de cerrar.`,
      400
    );
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
    previousClosedDate: previousDate,
  });

  return {
    closedDate: updated.accountingClosedDate,
    previousClosedDate: previousDate,
  };
};

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
    previousClosedDate: previousDate,
  });

  return {
    previousClosedDate: previousDate,
    closedDate: null,
  };
};