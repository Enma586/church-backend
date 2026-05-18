/**
 * @fileoverview Lógica de negocio para el catálogo de cuentas contables.
 * Gestiona estructura jerárquica, validaciones de integridad y emisión de eventos socket.
 */

import { Account, JournalEntry, Product } from '../../models/index.js';
import { aggregatePaginate } from '../../utils/aggregatePaginate.js';
import { getIO } from '../../config/socket.js';
import { AppError } from '../../utils/AppError.js';

// ── Create ──────────────────────────────────────────────────────────────────────
export const createAccount = async (data) => {
    // Validar unicidad de código
    const existing = await Account.findOne({ code: data.code }).lean();
    if (existing) {
        throw new AppError(`El código de cuenta "${data.code}" ya existe`, 409);
    }

    // Validar cuenta padre si se especifica
    if (data.parentAccount) {
        const parent = await Account.findById(data.parentAccount).lean();
        if (!parent) {
            throw new AppError('La cuenta padre especificada no existe', 404);
        }
        if (parent.acceptsTransactions === true) {
            throw new AppError('La cuenta padre debe ser una cuenta de agrupación (acceptsTransactions: false)', 400);
        }
    }

    const account = await Account.create(data);

    const io = getIO();
    io.emit('account:created', account);

    return account;
};

// ── Find All ────────────────────────────────────────────────────────────────────
export const findAllAccounts = async (query) => {
    const { page, limit, type, isActive, search } = query;

    const filter = {};
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive;
    if (search) {
        filter.$or = [
            { code: { $regex: search, $options: 'i' } },
            { name: { $regex: search, $options: 'i' } }
        ];
    }

    return await aggregatePaginate(Account, {
        filter,
        sort: { code: 1 },
        page,
        limit,
        lookups: [
            {
                $lookup: {
                    from: 'accounts',
                    localField: 'parentAccount',
                    foreignField: '_id',
                    as: 'parentAccountData'
                }
            },
            { $unwind: { path: '$parentAccountData', preserveNullAndEmptyArrays: true } }
        ]
    });
};

// ── Find By ID ──────────────────────────────────────────────────────────────────
export const findAccountById = async (id) => {
    const account = await Account.findById(id)
        .populate('parentAccount', 'code name type')
        .lean();

    if (!account) return null;

    // Obtener subcuentas
    const children = await Account.find({ parentAccount: id })
        .select('code name type isActive acceptsTransactions')
        .sort({ code: 1 })
        .lean();

    return { ...account, children };
};

// ── Update ──────────────────────────────────────────────────────────────────────
export const updateAccount = async (id, data) => {
    const account = await Account.findById(id);
    if (!account) {
        throw new AppError('Cuenta contable no encontrada', 404);
    }

    // Si se cambia parentAccount, validar que no genere ciclos
    if (data.parentAccount !== undefined && data.parentAccount !== null) {
        if (data.parentAccount === id) {
            throw new AppError('Una cuenta no puede ser su propia padre', 400);
        }
        const parent = await Account.findById(data.parentAccount).lean();
        if (!parent) {
            throw new AppError('La cuenta padre especificada no existe', 404);
        }
        if (parent.acceptsTransactions === true) {
            throw new AppError('La cuenta padre debe ser una cuenta de agrupación', 400);
        }
        // Prevenir ciclo: verificar que no sea descendiente
        let current = parent;
        while (current && current.parentAccount) {
            if (current.parentAccount.toString() === id) {
                throw new AppError('Referencia circular detectada: la cuenta seleccionada es descendiente de esta cuenta', 400);
            }
            current = await Account.findById(current.parentAccount).lean();
        }
    }

    if (data.parentAccount === null) {
        data.parentAccount = null;
    }

    const updated = await Account.findByIdAndUpdate(id, data, { new: true, runValidators: true });

    const io = getIO();
    io.emit('account:updated', updated);

    return updated;
};

// ── Remove ──────────────────────────────────────────────────────────────────────
export const removeAccount = async (id) => {
    const account = await Account.findById(id);
    if (!account) {
        throw new AppError('Cuenta contable no encontrada', 404);
    }

    // Verificar que no tenga cuentas hijas
    const childCount = await Account.countDocuments({ parentAccount: id });
    if (childCount > 0) {
        throw new AppError(
            `No se puede eliminar: esta cuenta tiene ${childCount} subcuenta(s). Elimine las subcuentas primero.`,
            409
        );
    }

    // Verificar que no tenga asientos asociados
    const entryCount = await JournalEntry.countDocuments({ 'lines.account': id });
    if (entryCount > 0) {
        throw new AppError(
            `No se puede eliminar: esta cuenta está referenciada en ${entryCount} asiento(s) contable(s).`,
            409
        );
    }

    // Verificar que no esté referenciada en productos
    const productCount = await Product.countDocuments({ incomeAccountId: id });
    if (productCount > 0) {
        throw new AppError(
            `No se puede eliminar: esta cuenta está vinculada a ${productCount} producto(s).`,
            409
        );
    }

    await Account.findByIdAndDelete(id);

    const io = getIO();
    io.emit('account:deleted', { id });

    return account;
};