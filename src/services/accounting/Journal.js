/**
 * @fileoverview Lógica de negocio para asientos contables con partida doble.
 * Maneja numeración atómica de comprobantes, validaciones y emisión de eventos socket.
 */

import { JournalEntry, Account, Counter } from '../../models/index.js';
import { aggregatePaginate } from '../../utils/aggregatePaginate.js';
import { getIO } from '../../config/socket.js';
import { AppError } from '../../utils/AppError.js';

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
    // Validar que todas las cuentas existan, estén activas y acepten transacciones
    const accountIds = [...new Set(data.lines.map(l => l.account))];
    const accounts = await Account.find({ _id: { $in: accountIds } }).lean();

    if (accounts.length !== accountIds.length) {
        throw new AppError('Una o más cuentas especificadas no existen', 404);
    }

    for (const acct of accounts) {
        if (!acct.isActive) {
            throw new AppError(`La cuenta "${acct.code} - ${acct.name}" está inactiva`, 400);
        }
        if (!acct.acceptsTransactions) {
            throw new AppError(`La cuenta "${acct.code} - ${acct.name}" es de agrupación y no acepta transacciones`, 400);
        }
    }

    // Generar número de comprobante
    const voucherNumber = await generateVoucherNumber(data.date);

    const entry = await JournalEntry.create({
        ...data,
        voucherNumber,
        createdBy: userId
    });

    // Populate para respuesta completa
    const populated = await JournalEntry.findById(entry._id)
        .populate('lines.account', 'code name type')
        .populate('createdBy', 'username role');

    const io = getIO();
    io.emit('journal-entry:created', populated);

    return populated;
};

// ── Find All ────────────────────────────────────────────────────────────────────
export const findAllJournalEntries = async (query) => {
    const { page, limit, dateFrom, dateTo, status, search } = query;

    const filter = {};
    if (status) filter.status = status;
    if (dateFrom || dateTo) {
        filter.date = {};
        if (dateFrom) filter.date.$gte = new Date(dateFrom);
        if (dateTo) filter.date.$lte = new Date(dateTo);
    }
    if (search) {
        filter.$or = [
            { concept: { $regex: search, $options: 'i' } },
            { voucherNumber: { $regex: search, $options: 'i' } }
        ];
    }

    return await aggregatePaginate(JournalEntry, {
        filter,
        sort: { date: -1, voucherNumber: -1 },
        page,
        limit,
        lookups: [
            // Populate lines.account
            { $unwind: { path: '$lines', preserveNullAndEmptyArrays: false } },
            {
                $lookup: {
                    from: 'accounts',
                    localField: 'lines.account',
                    foreignField: '_id',
                    as: 'lines.accountData'
                }
            },
            { $unwind: { path: '$lines.accountData', preserveNullAndEmptyArrays: true } },
            // Reagrupar líneas
            {
                $group: {
                    _id: '$_id',
                    voucherNumber: { $first: '$voucherNumber' },
                    date: { $first: '$date' },
                    concept: { $first: '$concept' },
                    status: { $first: '$status' },
                    createdBy: { $first: '$createdBy' },
                    lines: { $push: '$lines' },
                    createdAt: { $first: '$createdAt' },
                    updatedAt: { $first: '$updatedAt' }
                }
            },
            // Populate createdBy
            {
                $lookup: {
                    from: 'users',
                    localField: 'createdBy',
                    foreignField: '_id',
                    as: 'createdByData'
                }
            },
            { $unwind: { path: '$createdByData', preserveNullAndEmptyArrays: true } }
        ],
        project: { 'createdByData.password': 0 }
    });
};

// ── Find By ID ──────────────────────────────────────────────────────────────────
export const findJournalEntryById = async (id) => {
    return await JournalEntry.findById(id)
        .populate('lines.account', 'code name type')
        .populate('createdBy', 'username role');
};

// ── Update (solo anulación) ─────────────────────────────────────────────────────
export const updateJournalEntry = async (id, data) => {
    const existing = await JournalEntry.findById(id);
    if (!existing) {
        throw new AppError('Asiento contable no encontrado', 404);
    }

    // Solo se permite cambiar el status (anular)
    if (existing.status === 'ANULADO') {
        throw new AppError('El asiento ya se encuentra anulado', 400);
    }

    const updated = await JournalEntry.findByIdAndUpdate(
        id,
        { status: data.status },
        { new: true, runValidators: true }
    )
        .populate('lines.account', 'code name type')
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