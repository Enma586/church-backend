/**
 * @fileoverview Lógica de negocio para asientos contables simplificados.
 * Sistema de Ingreso/Egreso directo.
 */

import { JournalEntry, Account, Product, Counter } from '../../models/index.js';
import { aggregatePaginate } from '../../utils/aggregatePaginate.js';
import { getIO } from '../../config/socket.js';
import { AppError } from '../../utils/AppError.js';
import { parseLocalDate } from '../../utils/date.js';

// ── Generación atómica de número de comprobante ─────────────────────────────────
const generateVoucherNumber = async (date) => {
  const yearMonth = date.toISOString().slice(0, 7).replace('-', ''); // "202605"
  const counterId = `voucher-${yearMonth}`;

  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );

  return `VCH-${yearMonth}-${String(counter.seq).padStart(4, '0')}`;
};

// ── Create ──────────────────────────────────────────────────────────────────────
export const createJournalEntry = async (data, userId) => {
  // Validar que la cuenta exista, esté activa y acepte transacciones
  const account = await Account.findById(data.account).lean();
  if (!account) {
    throw new AppError('La cuenta especificada no existe', 404);
  }
  if (!account.isActive) {
    throw new AppError(`La cuenta "${account.code} - ${account.name}" está inactiva`, 400);
  }
  if (!account.acceptsTransactions) {
    throw new AppError(`La cuenta "${account.code} - ${account.name}" es de agrupación y no acepta transacciones`, 400);
  }

  // Validar producto si se especifica
  if (data.product) {
    const product = await Product.findById(data.product).lean();
    if (!product) {
      throw new AppError('El producto especificado no existe', 404);
    }
    if (!product.isActive) {
      throw new AppError('El producto especificado está inactivo', 400);
    }
  }

  // Validar monto positivo
  if (!data.amount || data.amount <= 0) {
    throw new AppError('El monto debe ser mayor a cero', 400);
  }

    // Generar número de comprobante
    const entryDate = parseLocalDate(data.date) || new Date();
    const voucherNumber = await generateVoucherNumber(entryDate);

    const entry = await JournalEntry.create({
      ...data,
      date: entryDate,
      voucherNumber,
      createdBy: userId,
    });

  // Populate para respuesta completa
  const populated = await JournalEntry.findById(entry._id)
    .populate('account', 'code name type')
    .populate('product', 'name defaultPrice')
    .populate('createdBy', 'username role');

  const io = getIO();
  io.emit('journal-entry:created', populated);

  return populated;
};

// ── Find All ────────────────────────────────────────────────────────────────────
export const findAllJournalEntries = async (query) => {
  const { page, limit, dateFrom, dateTo, type, status, search } = query;

  const filter = {};
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) filter.date.$gte = parseLocalDate(dateFrom);
    if (dateTo) filter.date.$lte = parseLocalDate(dateTo);
  }
  if (search) {
    filter.$or = [
      { concept: { $regex: search, $options: 'i' } },
      { voucherNumber: { $regex: search, $options: 'i' } },
    ];
  }

  return await aggregatePaginate(JournalEntry, {
    filter,
    sort: { date: -1, voucherNumber: -1 },
    page,
    limit,
    lookups: [
      {
        $lookup: {
          from: 'accounts',
          localField: 'account',
          foreignField: '_id',
          as: 'accountData',
        },
      },
      { $unwind: { path: '$accountData', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productData',
        },
      },
      { $unwind: { path: '$productData', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdByData',
        },
      },
      { $unwind: { path: '$createdByData', preserveNullAndEmptyArrays: true } },
    ],
    project: { 'createdByData.password': 0 },
  });
};

// ── Find By ID ──────────────────────────────────────────────────────────────────
export const findJournalEntryById = async (id) => {
  return await JournalEntry.findById(id)
    .populate('account', 'code name type')
    .populate('product', 'name defaultPrice')
    .populate('createdBy', 'username role');
};

// ── Update (solo anulación) ─────────────────────────────────────────────────────
export const updateJournalEntry = async (id, data) => {
  const existing = await JournalEntry.findById(id);
  if (!existing) {
    throw new AppError('Asiento contable no encontrado', 404);
  }

  if (existing.status === 'Anulado') {
    throw new AppError('El asiento ya se encuentra anulado', 400);
  }

  const updated = await JournalEntry.findByIdAndUpdate(
    id,
    { status: data.status },
    { new: true, runValidators: true }
  )
    .populate('account', 'code name type')
    .populate('product', 'name defaultPrice')
    .populate('createdBy', 'username role');

  const io = getIO();
  io.emit('journal-entry:updated', updated);

  return updated;
};

// ── Remove ──────────────────────────────────────────────────────────────────────
export const removeJournalEntry = async (id) => {
  const entry = await JournalEntry.findById(id);
  if (!entry) {
    throw new AppError('Asiento contable no encontrado', 404);
  }

  await JournalEntry.findByIdAndDelete(id);

  const io = getIO();
  io.emit('journal-entry:deleted', { id });

  return entry;
};