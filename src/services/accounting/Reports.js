/**
 * @fileoverview Servicios de reportes contables: Libro Mayor, Balanza de Comprobación,
 * Balance General y Estado de Resultados. Todos son agregaciones de solo lectura.
 */

import { JournalEntry, Account } from '../../models/index.js';
import { getPagination, getPagingData } from '../../utils/pagination.js';
import { AppError } from '../../utils/AppError.js';

// ── Libro Mayor ─────────────────────────────────────────────────────────────────
export const getLedger = async (query) => {
    const { accountId, dateFrom, dateTo, page, limit } = query;

    const account = await Account.findById(accountId).lean();
    if (!account) {
        throw new AppError('Cuenta contable no encontrada', 404);
    }

    const { skip, limit: pageSize } = getPagination(page, limit);

    const match = {
        'lines.account': account._id,
        status: 'Valido'
    };
    if (dateFrom || dateTo) {
        match.date = {};
        if (dateFrom) match.date.$gte = new Date(dateFrom);
        if (dateTo) match.date.$lte = new Date(dateTo);
    }

    const pipeline = [
        { $match: { status: 'Valido', 'lines.account': account._id } },
        {
            // Filtrar solo líneas de esta cuenta
            $addFields: {
                lines: {
                    $filter: {
                        input: '$lines',
                        cond: { $eq: ['$$this.account', account._id] }
                    }
                }
            }
        },
        { $unwind: '$lines' },
    ];

    // Aplicar filtro de fechas si existe
    if (dateFrom || dateTo) {
        const dateFilter = {};
        if (dateFrom) dateFilter.$gte = new Date(dateFrom);
        if (dateTo) dateFilter.$lte = new Date(dateTo);
        pipeline.push({ $match: { date: dateFilter } });
    }

    pipeline.push(
        { $sort: { date: 1, voucherNumber: 1 } },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                rows: {
                    $push: {
                        date: '$date',
                        voucherNumber: '$voucherNumber',
                        concept: '$concept',
                        debit: '$lines.debit',
                        credit: '$lines.credit'
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                total: 1,
                rows: 1
            }
        }
    );

    const result = await JournalEntry.aggregate(pipeline);
    const total = result[0]?.total ?? 0;
    const allRows = result[0]?.rows ?? [];

    // Aplicar paginación manual
    const pagedRows = allRows.slice(skip, skip + pageSize);

    // Calcular saldo acumulado
    let runningBalance = 0;
    const rowsWithBalance = pagedRows.map(row => {
        runningBalance += row.debit - row.credit;
        return { ...row, balance: runningBalance };
    });

    return {
        account: { _id: account._id, code: account.code, name: account.name, type: account.type },
        data: rowsWithBalance,
        pagination: getPagingData(total, page, pageSize)
    };
};

// ── Balanza de Comprobación ─────────────────────────────────────────────────────
export const getTrialBalance = async (query) => {
    const { dateFrom, dateTo } = query;

    const match = { status: 'Valido' };
    if (dateFrom || dateTo) {
        match.date = {};
        if (dateFrom) match.date.$gte = new Date(dateFrom);
        if (dateTo) match.date.$lte = new Date(dateTo);
    }

    const pipeline = [
        { $match: match },
        { $unwind: '$lines' },
        {
            $group: {
                _id: '$lines.account',
                totalDebit: { $sum: '$lines.debit' },
                totalCredit: { $sum: '$lines.credit' }
            }
        },
        {
            $lookup: {
                from: 'accounts',
                localField: '_id',
                foreignField: '_id',
                as: 'account'
            }
        },
        { $unwind: { path: '$account', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 0,
                accountId: '$_id',
                code: '$account.code',
                name: '$account.name',
                type: '$account.type',
                totalDebit: 1,
                totalCredit: 1,
                balance: { $subtract: ['$totalDebit', '$totalCredit'] }
            }
        },
        { $sort: { code: 1 } }
    ];

    const rows = await JournalEntry.aggregate(pipeline);

    const totals = rows.reduce(
        (acc, row) => {
            acc.totalDebit += row.totalDebit;
            acc.totalCredit += row.totalCredit;
            return acc;
        },
        { totalDebit: 0, totalCredit: 0 }
    );

    return {
        data: rows,
        totals
    };
};

// ── Balance General ─────────────────────────────────────────────────────────────
export const getBalanceSheet = async (query) => {
    const asOfDate = query.asOfDate ? new Date(query.asOfDate) : new Date();

    const pipeline = [
        { $match: { status: 'Valido', date: { $lte: asOfDate } } },
        { $unwind: '$lines' },
        {
            $group: {
                _id: '$lines.account',
                totalDebit: { $sum: '$lines.debit' },
                totalCredit: { $sum: '$lines.credit' }
            }
        },
        {
            $lookup: {
                from: 'accounts',
                localField: '_id',
                foreignField: '_id',
                as: 'account'
            }
        },
        { $unwind: { path: '$account', preserveNullAndEmptyArrays: true } },
        {
            $match: {
                'account.type': { $in: ['Activo', 'Pasivo', 'Patrimonio'] }
            }
        },
        {
            $project: {
                _id: 0,
                accountId: '$_id',
                code: '$account.code',
                name: '$account.name',
                type: '$account.type',
                parentAccount: '$account.parentAccount',
                totalDebit: 1,
                totalCredit: 1,
                // Para ACTIVO: débito - crédito (normalmente positivo)
                // Para PASIVO/PATRIMONIO: crédito - débito (normalmente positivo)
                balance: {
                    $cond: {
                        if: { $eq: ['$account.type', 'Activo'] },
                        then: { $subtract: ['$totalDebit', '$totalCredit'] },
                        else: { $subtract: ['$totalCredit', '$totalDebit'] }
                    }
                }
            }
        },
        { $sort: { code: 1 } }
    ];

    const rows = await JournalEntry.aggregate(pipeline);

    // Agrupar por tipo
    const activo = rows.filter(r => r.type === 'Activo');
    const pasivo = rows.filter(r => r.type === 'Pasivo');
    const patrimonio = rows.filter(r => r.type === 'Patrimonio');

    const sumActivo = activo.reduce((s, r) => s + r.balance, 0);
    const sumPasivo = pasivo.reduce((s, r) => s + r.balance, 0);
    const sumPatrimonio = patrimonio.reduce((s, r) => s + r.balance, 0);

    return {
        asOfDate,
        data: { activo, pasivo, patrimonio },
        totals: {
            activo: sumActivo,
            pasivo: sumPasivo,
            patrimonio: sumPatrimonio,
            pasivoPatrimonio: sumPasivo + sumPatrimonio,
            balanceado: sumActivo === (sumPasivo + sumPatrimonio)
        }
    };
};

// ── Estado de Resultados ────────────────────────────────────────────────────────
export const getIncomeStatement = async (query) => {
    const { dateFrom, dateTo } = query;

    const match = { status: 'VALIDO' };
    if (dateFrom || dateTo) {
        match.date = {};
        if (dateFrom) match.date.$gte = new Date(dateFrom);
        if (dateTo) match.date.$lte = new Date(dateTo);
    }

    const pipeline = [
        { $match: match },
        { $unwind: '$lines' },
        {
            $group: {
                _id: '$lines.account',
                totalDebit: { $sum: '$lines.debit' },
                totalCredit: { $sum: '$lines.credit' }
            }
        },
        {
            $lookup: {
                from: 'accounts',
                localField: '_id',
                foreignField: '_id',
                as: 'account'
            }
        },
        { $unwind: { path: '$account', preserveNullAndEmptyArrays: true } },
        {
            $match: {
                'account.type': { $in: ['Ingreso', 'Gasto'] }
            }
        },
        {
            $project: {
                _id: 0,
                accountId: '$_id',
                code: '$account.code',
                name: '$account.name',
                type: '$account.type',
                totalDebit: 1,
                totalCredit: 1,
                // INGRESO: crédito - débito (normalmente positivo)
                // GASTO: débito - crédito (normalmente positivo)
                balance: {
                    $cond: {
                        if: { $eq: ['$account.type', 'Ingreso'] },
                        then: { $subtract: ['$totalCredit', '$totalDebit'] },
                        else: { $subtract: ['$totalDebit', '$totalCredit'] }
                    }
                }
            }
        },
        { $sort: { code: 1 } }
    ];

    const rows = await JournalEntry.aggregate(pipeline);

    const ingresos = rows.filter(r => r.type === 'Ingreso');
    const gastos = rows.filter(r => r.type === 'Gasto');

    const totalIngresos = ingresos.reduce((s, r) => s + r.balance, 0);
    const totalGastos = gastos.reduce((s, r) => s + r.balance, 0);
    const resultadoNeto = totalIngresos - totalGastos;

    return {
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        data: { ingresos, gastos },
        totals: {
            ingresos: totalIngresos,
            gastos: totalGastos,
            resultadoNeto
        }
    };
};