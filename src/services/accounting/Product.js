/**
 * @fileoverview Lógica de negocio para catálogo de productos y servicios.
 * Valida vínculo contable con cuentas de ingreso.
 */

import { Product, Account } from '../../models/index.js';
import { aggregatePaginate } from '../../utils/aggregatePaginate.js';
import { getIO } from '../../config/socket.js';
import { AppError } from '../../utils/AppError.js';

// ── Create ──────────────────────────────────────────────────────────────────────
export const createProduct = async (data) => {
    // Validar que la cuenta de ingreso exista y sea de tipo INGRESO
    const incomeAccount = await Account.findById(data.incomeAccountId).lean();
    if (!incomeAccount) {
        throw new AppError('La cuenta de ingreso especificada no existe', 404);
    }
    if (incomeAccount.type !== 'Ingreso') {
        throw new AppError(
            `La cuenta "${incomeAccount.code} - ${incomeAccount.name}" no es de tipo Ingreso`,
            400
        );
    }

    const product = await Product.create(data);

    const populated = await Product.findById(product._id)
        .populate('incomeAccountId', 'code name type');

    const io = getIO();
    io.emit('product:created', populated);

    return populated;
};

// ── Find All ────────────────────────────────────────────────────────────────────
export const findAllProducts = async (query) => {
    const { page, limit, isActive, search } = query;

    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive;
    if (search) {
        filter.name = { $regex: search, $options: 'i' };
    }

    return await aggregatePaginate(Product, {
        filter,
        sort: { name: 1 },
        page,
        limit,
        lookups: [
            {
                $lookup: {
                    from: 'accounts',
                    localField: 'incomeAccountId',
                    foreignField: '_id',
                    as: 'incomeAccountIdData'
                }
            },
            { $unwind: { path: '$incomeAccountIdData', preserveNullAndEmptyArrays: true } }
        ]
    });
};

// ── Find By ID ──────────────────────────────────────────────────────────────────
export const findProductById = async (id) => {
    return await Product.findById(id)
        .populate('incomeAccountId', 'code name type');
};

// ── Update ──────────────────────────────────────────────────────────────────────
export const updateProduct = async (id, data) => {
    if (data.incomeAccountId) {
        const incomeAccount = await Account.findById(data.incomeAccountId).lean();
        if (!incomeAccount) {
            throw new AppError('La cuenta de ingreso especificada no existe', 404);
        }
        if (incomeAccount.type !== 'Ingreso') {
            throw new AppError(
                `La cuenta "${incomeAccount.code}" no es de tipo Ingreso`,
                400
            );
        }
    }

    const updated = await Product.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true
    }).populate('incomeAccountId', 'code name type');

    if (!updated) {
        throw new AppError('Producto no encontrado', 404);
    }

    const io = getIO();
    io.emit('product:updated', updated);

    return updated;
};

// ── Remove ──────────────────────────────────────────────────────────────────────
export const removeProduct = async (id) => {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
        throw new AppError('Producto no encontrado', 404);
    }

    const io = getIO();
    io.emit('product:deleted', { id });

    return product;
};