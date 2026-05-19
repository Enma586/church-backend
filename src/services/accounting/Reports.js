/**
 * @fileoverview Servicios de reportes contables para sistema de Ingreso/Egreso.
 * Libro Mayor, Balanza, Balance General, Estado de Resultados + Exportación PDF.
 */

import { JournalEntry, Account } from '../../models/index.js';
import { getPagination, getPagingData } from '../../utils/pagination.js';
import { AppError } from '../../utils/AppError.js';
import PDFDocument from 'pdfkit';

// ── Libro Mayor ─────────────────────────────────────────────────────────────────
export const getLedger = async (query) => {
  const { accountId, dateFrom, dateTo, page, limit } = query;

  const account = await Account.findById(accountId).lean();
  if (!account) {
    throw new AppError('Cuenta contable no encontrada', 404);
  }

  const { skip, limit: pageSize } = getPagination(page, limit);

  const match = {
    account: account._id,
    status: 'Valido',
  };
  if (dateFrom || dateTo) {
    match.date = {};
    if (dateFrom) match.date.$gte = new Date(dateFrom);
    if (dateTo) match.date.$lte = new Date(dateTo);
  }

  const pipeline = [
    { $match: match },
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
            type: '$type',
            amount: '$amount',
          },
        },
      },
    },
  ];

  const result = await JournalEntry.aggregate(pipeline);
  const total = result[0]?.total ?? 0;
  const allRows = result[0]?.rows ?? [];

  const pagedRows = allRows.slice(skip, skip + pageSize);

  // Calcular saldo acumulado: Ingresos suman, Egresos restan
  let runningBalance = 0;
  const rowsWithBalance = pagedRows.map((row) => {
    runningBalance += row.type === 'Ingreso' ? row.amount : -row.amount;
    return { ...row, balance: runningBalance };
  });

  return {
    account: {
      _id: account._id,
      code: account.code,
      name: account.name,
      type: account.type,
    },
    data: rowsWithBalance,
    pagination: getPagingData(total, page, pageSize),
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
    {
      $group: {
        _id: '$account',
        totalIngresos: {
          $sum: { $cond: [{ $eq: ['$type', 'Ingreso'] }, '$amount', 0] },
        },
        totalEgresos: {
          $sum: { $cond: [{ $eq: ['$type', 'Egreso'] }, '$amount', 0] },
        },
      },
    },
    {
      $lookup: {
        from: 'accounts',
        localField: '_id',
        foreignField: '_id',
        as: 'account',
      },
    },
    { $unwind: { path: '$account', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        accountId: '$_id',
        code: '$account.code',
        name: '$account.name',
        type: '$account.type',
        totalIngresos: 1,
        totalEgresos: 1,
        balance: { $subtract: ['$totalIngresos', '$totalEgresos'] },
      },
    },
    { $sort: { code: 1 } },
  ];

  const rows = await JournalEntry.aggregate(pipeline);

  const totals = rows.reduce(
    (acc, row) => {
      acc.totalIngresos += row.totalIngresos;
      acc.totalEgresos += row.totalEgresos;
      return acc;
    },
    { totalIngresos: 0, totalEgresos: 0 }
  );

  return {
    data: rows,
    totals: {
      ...totals,
      saldoNeto: totals.totalIngresos - totals.totalEgresos,
    },
  };
};

// ── Balance General ─────────────────────────────────────────────────────────────
export const getBalanceSheet = async (query) => {
  const asOfDate = query.asOfDate ? new Date(query.asOfDate) : new Date();

  const pipeline = [
    { $match: { status: 'Valido', date: { $lte: asOfDate } } },
    {
      $group: {
        _id: '$account',
        totalIngresos: {
          $sum: { $cond: [{ $eq: ['$type', 'Ingreso'] }, '$amount', 0] },
        },
        totalEgresos: {
          $sum: { $cond: [{ $eq: ['$type', 'Egreso'] }, '$amount', 0] },
        },
      },
    },
    {
      $lookup: {
        from: 'accounts',
        localField: '_id',
        foreignField: '_id',
        as: 'account',
      },
    },
    { $unwind: { path: '$account', preserveNullAndEmptyArrays: true } },
    {
      $match: {
        'account.type': { $in: ['Activo', 'Pasivo', 'Patrimonio'] },
      },
    },
    {
      $project: {
        _id: 0,
        accountId: '$_id',
        code: '$account.code',
        name: '$account.name',
        type: '$account.type',
        parentAccount: '$account.parentAccount',
        totalIngresos: 1,
        totalEgresos: 1,
        balance: {
          $cond: {
            if: { $eq: ['$account.type', 'Activo'] },
            then: { $subtract: ['$totalIngresos', '$totalEgresos'] },
            else: { $subtract: ['$totalEgresos', '$totalIngresos'] },
          },
        },
      },
    },
    { $sort: { code: 1 } },
  ];

  const rows = await JournalEntry.aggregate(pipeline);

  const activo = rows.filter((r) => r.type === 'Activo');
  const pasivo = rows.filter((r) => r.type === 'Pasivo');
  const patrimonio = rows.filter((r) => r.type === 'Patrimonio');

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
      balanceado: sumActivo === sumPasivo + sumPatrimonio,
    },
  };
};

// ── Estado de Resultados ────────────────────────────────────────────────────────
export const getIncomeStatement = async (query) => {
  const { dateFrom, dateTo } = query;

  const match = { status: 'Valido' };
  if (dateFrom || dateTo) {
    match.date = {};
    if (dateFrom) match.date.$gte = new Date(dateFrom);
    if (dateTo) match.date.$lte = new Date(dateTo);
  }

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: '$account',
        totalIngresos: {
          $sum: { $cond: [{ $eq: ['$type', 'Ingreso'] }, '$amount', 0] },
        },
        totalEgresos: {
          $sum: { $cond: [{ $eq: ['$type', 'Egreso'] }, '$amount', 0] },
        },
      },
    },
    {
      $lookup: {
        from: 'accounts',
        localField: '_id',
        foreignField: '_id',
        as: 'account',
      },
    },
    { $unwind: { path: '$account', preserveNullAndEmptyArrays: true } },
    {
      $match: {
        'account.type': { $in: ['Ingreso', 'Gasto'] },
      },
    },
    {
      $project: {
        _id: 0,
        accountId: '$_id',
        code: '$account.code',
        name: '$account.name',
        type: '$account.type',
        totalIngresos: 1,
        totalEgresos: 1,
        balance: {
          $cond: {
            if: { $eq: ['$account.type', 'Ingreso'] },
            then: '$totalIngresos',
            else: '$totalEgresos',
          },
        },
      },
    },
    { $sort: { code: 1 } },
  ];

  const rows = await JournalEntry.aggregate(pipeline);

  const ingresos = rows.filter((r) => r.type === 'Ingreso');
  const gastos = rows.filter((r) => r.type === 'Gasto');

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
      resultadoNeto,
    },
  };
};

// ── Exportar Journal a PDF ──────────────────────────────────────────────────────
export const exportJournalPDF = async (query, res) => {
  const { dateFrom, dateTo, type, status } = query;

  const filter = { status: status || 'Valido' };
  if (type) filter.type = type;
  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) filter.date.$gte = new Date(dateFrom);
    if (dateTo) filter.date.$lte = new Date(dateTo);
  }

  const entries = await JournalEntry.find(filter)
    .populate('account', 'code name type')
    .populate('createdBy', 'username')
    .sort({ date: -1, voucherNumber: -1 })
    .lean();

  // ── Generar PDF ───────────────────────────────────────
  const doc = new PDFDocument({ margin: 40, size: 'LETTER' });
  const filename = `journal-${Date.now()}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  doc.pipe(res);

  // Título
  doc.fontSize(16).font('Helvetica-Bold').text('Libro Diario - Reporte de Asientos Contables', { align: 'center' });
  doc.moveDown(0.5);

  // Filtros aplicados
  doc.fontSize(10).font('Helvetica');
  if (dateFrom) doc.text(`Desde: ${new Date(dateFrom).toLocaleDateString('es-HN')}`, { continued: true });
  if (dateTo) doc.text(`   Hasta: ${new Date(dateTo).toLocaleDateString('es-HN')}`);
  if (type) doc.text(`Tipo: ${type}`);
  doc.moveDown(0.5);

  // Línea separadora
  doc.moveTo(40, doc.y).lineTo(575, doc.y).stroke();
  doc.moveDown(0.5);

  // Tabla
  const tableTop = doc.y;
  const colWidths = { comp: 100, fecha: 65, tipo: 50, cuenta: 100, concepto: 150, monto: 70 };
  const rowHeight = 20;

  // Encabezados
  doc.font('Helvetica-Bold').fontSize(8);
  doc.text('Comprobante', 40, tableTop);
  doc.text('Fecha', 40 + colWidths.comp, tableTop);
  doc.text('Tipo', 40 + colWidths.comp + colWidths.fecha, tableTop);
  doc.text('Cuenta', 40 + colWidths.comp + colWidths.fecha + colWidths.tipo, tableTop);
  doc.text('Concepto', 40 + colWidths.comp + colWidths.fecha + colWidths.tipo + colWidths.cuenta, tableTop);
  doc.text('Monto', 505, tableTop, { width: colWidths.monto, align: 'right' });

  doc.moveTo(40, tableTop + 12).lineTo(575, tableTop + 12).stroke();

  // Filas
  let y = tableTop + 18;
  doc.font('Helvetica').fontSize(8);

  let totalIngresos = 0;
  let totalEgresos = 0;

  for (const entry of entries) {
    if (y > 720) {
      doc.addPage();
      y = 40;
      // Re-imprimir encabezados
      doc.font('Helvetica-Bold').fontSize(8);
      doc.text('Comprobante', 40, y);
      doc.text('Fecha', 40 + colWidths.comp, y);
      doc.text('Tipo', 40 + colWidths.comp + colWidths.fecha, y);
      doc.text('Cuenta', 40 + colWidths.comp + colWidths.fecha + colWidths.tipo, y);
      doc.text('Concepto', 40 + colWidths.comp + colWidths.fecha + colWidths.tipo + colWidths.cuenta, y);
      doc.text('Monto', 505, y, { width: colWidths.monto, align: 'right' });
      doc.moveTo(40, y + 12).lineTo(575, y + 12).stroke();
      y += 18;
    }

    const dateStr = new Date(entry.date).toLocaleDateString('es-HN');
    const accountCode = entry.account?.code ?? '—';
    const montoStr = `L. ${entry.amount.toFixed(2)}`;

    doc.text(entry.voucherNumber, 40, y, { width: colWidths.comp - 5 });
    doc.text(dateStr, 40 + colWidths.comp, y, { width: colWidths.fecha });
    doc.text(entry.type, 40 + colWidths.comp + colWidths.fecha, y, { width: colWidths.tipo });
    doc.text(accountCode, 40 + colWidths.comp + colWidths.fecha + colWidths.tipo, y, { width: colWidths.cuenta - 5 });
    doc.text(entry.concept.substring(0, 55), 40 + colWidths.comp + colWidths.fecha + colWidths.tipo + colWidths.cuenta, y, { width: colWidths.concepto - 10 });
    
    if (entry.type === 'Ingreso') {
      doc.fillColor('green').text(montoStr, 505, y, { width: colWidths.monto, align: 'right' });
    } else {
      doc.fillColor('red').text(montoStr, 505, y, { width: colWidths.monto, align: 'right' });
    }
    doc.fillColor('black');

    if (entry.type === 'Ingreso') totalIngresos += entry.amount;
    else totalEgresos += entry.amount;

    y += rowHeight;
  }

  // Totales
  y += 10;
  doc.moveTo(40, y).lineTo(575, y).stroke();
  y += 10;
  doc.font('Helvetica-Bold').fontSize(10);
  doc.text(`Total Ingresos: L. ${totalIngresos.toFixed(2)}`, 40, y);
  y += 16;
  doc.fillColor('red').text(`Total Egresos: L. ${totalEgresos.toFixed(2)}`, 40, y);
  doc.fillColor('black');
  y += 16;
  const balance = totalIngresos - totalEgresos;
  doc.fillColor(balance >= 0 ? 'green' : 'red').text(`Saldo: L. ${balance.toFixed(2)}`, 40, y);
  doc.fillColor('black');

  // Footer
  doc.fontSize(7).font('Helvetica');
  doc.text(`Generado el ${new Date().toLocaleString('es-HN')}`, 40, 750, { align: 'center' });

  doc.end();
};

// ── Saldo de caja esperado (para cierre de caja) ──────────────────────────────
export const getCashBalance = async (query) => {
  const { dateFrom, dateTo } = query;

  const match = { status: 'Valido' };
  if (dateFrom || dateTo) {
    match.date = {};
    if (dateFrom) match.date.$gte = new Date(dateFrom);
    if (dateTo) match.date.$lte = new Date(dateTo);
  }

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: null,
        totalIngresos: {
          $sum: { $cond: [{ $eq: ['$type', 'Ingreso'] }, '$amount', 0] },
        },
        totalEgresos: {
          $sum: { $cond: [{ $eq: ['$type', 'Egreso'] }, '$amount', 0] },
        },
        count: { $sum: 1 },
      },
    },
  ];

  const result = await JournalEntry.aggregate(pipeline);
  const totals = result[0] ?? { totalIngresos: 0, totalEgresos: 0, count: 0 };

  return {
    totalIngresos: totals.totalIngresos,
    totalEgresos: totals.totalEgresos,
    saldoNeto: totals.totalIngresos - totals.totalEgresos,
    count: totals.count,
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
  };
};