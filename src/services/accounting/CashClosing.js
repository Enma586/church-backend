/**
 * @fileoverview Lógica de negocio para cierres de caja (arqueo).
 * Denominaciones de Honduras: billetes y monedas.
 */

import { CashClosing, JournalEntry, Counter } from '../../models/index.js';
import { getIO } from '../../config/socket.js';
import { AppError } from '../../utils/AppError.js';
import { parseLocalDate, dateFromFilter, dateToFilter } from '../../utils/date.js';

// Denominaciones de Honduras
const HONDURAS_DENOMINATIONS = [
  500, 200, 100, 50, 20, 10, 5, 2, 1,
];

// ── Generar referencia para cierre ──────────────────────────────────
const generateReference = async (date) => {
  const yearMonth = date.toISOString().slice(0, 7).replace('-', '');
  const counterId = `cash-close-${yearMonth}`;

  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );

  return `ARQ-${yearMonth}-${String(counter.seq).padStart(3, '0')}`;
};

// ── Create ──────────────────────────────────────────────────────────
export const createCashClosing = async (data, userId) => {
  const closeDate = parseLocalDate(data.date) || new Date();

  // Validar denominaciones
  if (!data.denominations || !Array.isArray(data.denominations) || data.denominations.length === 0) {
    throw new AppError('Debe proporcionar al menos una denominación', 400);
  }

  // Validar cantidades (no negativas, enteros para billetes)
  let totalCalculated = 0;
  const validatedDenominations = data.denominations.map((d) => {
    if (d.quantity < 0 || !Number.isInteger(d.quantity)) {
      throw new AppError(`Cantidad inválida para denominación L.${d.denomination}`, 400);
    }
    const subtotal = d.denomination * d.quantity;
    totalCalculated += subtotal;
    return { denomination: d.denomination, quantity: d.quantity, subtotal };
  });

  // Calcular saldo esperado del sistema (ingresos - egresos hasta la fecha)
  const pipeline = [
    { $match: { status: 'Valido', date: { $lte: closeDate } } },
    {
      $group: {
        _id: null,
        totalIngresos: {
          $sum: { $cond: [{ $eq: ['$type', 'Ingreso'] }, '$amount', 0] },
        },
        totalEgresos: {
          $sum: { $cond: [{ $eq: ['$type', 'Egreso'] }, '$amount', 0] },
        },
      },
    },
  ];
  const result = await JournalEntry.aggregate(pipeline);
  const expectedBalance = result[0]
    ? result[0].totalIngresos - result[0].totalEgresos
    : 0;

  const difference = totalCalculated - expectedBalance;

  // Generar referencia
  const reference = await generateReference(closeDate);

  const closing = await CashClosing.create({
    date: closeDate,
    reference,
    concept: data.concept || 'Cierre de caja',
    denominations: validatedDenominations,
    totalCalculated,
    expectedBalance,
    difference,
    notes: data.notes || '',
    createdBy: userId,
  });

  const populated = await CashClosing.findById(closing._id)
    .populate('createdBy', 'username role');

  const io = getIO();
  io.emit('cash-closing:created', populated);

  return populated;
};

// ── Find All ──────────────────────────────────────────────────────
export const findAllCashClosings = async (query) => {
  const { page = 1, limit = 20, dateFrom, dateTo } = query;

  const filter = {};
  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) filter.date.$gte = dateFromFilter(dateFrom);
    if (dateTo) filter.date.$lte = dateToFilter(dateTo);
  }

  const skip = (page - 1) * limit;
  const total = await CashClosing.countDocuments(filter);

  const items = await CashClosing.find(filter)
    .populate('createdBy', 'username role')
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    data: items,
    pagination: {
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      perPage: limit,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

// ── Find By ID ────────────────────────────────────────────────────
export const findCashClosingById = async (id) => {
  return await CashClosing.findById(id)
    .populate('createdBy', 'username role');
};

// ── Denominaciones disponibles ─────────────────────────────────────
export const getDenominations = () => {
  return HONDURAS_DENOMINATIONS;
};