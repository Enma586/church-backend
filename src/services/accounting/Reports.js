import { Op } from 'sequelize'
import sequelize from '../../config/db.js'
import { JournalEntry, Account } from '../../models/index.js'
import { getPagination, getPagingData } from '../../utils/pagination.js'
import { AppError } from '../../utils/AppError.js'
import { parseLocalDate, dateFromFilter, dateToFilter } from '../../utils/date.js'
import PDFDocument from 'pdfkit'

export const getLedger = async (query) => {
    const { accountId, dateFrom, dateTo, page, limit } = query

    const account = await Account.findByPk(accountId)
    if (!account) {
        throw new AppError('Cuenta contable no encontrada', 404)
    }

    const { skip, limit: pageSize } = getPagination(page, limit)

    const conditions = [`je.status = 'Valido'`, `je.account = '${accountId}'`]
    const params = []
    let paramIndex = 1

    if (dateFrom || dateTo) {
        const dateConds = []
        if (dateFrom) {
            dateConds.push(`je.date >= $${paramIndex++}`)
            params.push(dateFromFilter(dateFrom))
        }
        if (dateTo) {
            dateConds.push(`je.date <= $${paramIndex++}`)
            params.push(dateToFilter(dateTo))
        }
        conditions.push(`(${dateConds.join(' AND ')})`)
    }

    const where = conditions.join(' AND ')

    const countResult = await sequelize.query(
        `SELECT COUNT(*) as total FROM journal_entries je WHERE ${where}`,
        { bind: params, type: sequelize.QueryTypes.SELECT }
    )
    const total = parseInt(countResult[0].total, 10)

    const rows = await sequelize.query(
        `SELECT
            je.date, je.voucher_number AS "voucherNumber",
            je.concept, je.type, je.amount
        FROM journal_entries je
        WHERE ${where}
        ORDER BY je.date ASC, je.voucher_number ASC
        OFFSET ${skip} LIMIT ${pageSize}`,
        { bind: params, type: sequelize.QueryTypes.SELECT }
    )

    let runningBalance = 0
    const rowsWithBalance = rows.map((row) => {
        runningBalance += row.type === 'Ingreso' ? parseFloat(row.amount) : -parseFloat(row.amount)
        return { ...row, balance: runningBalance }
    })

    return {
        account: {
            _id: account._id,
            code: account.code,
            name: account.name,
            type: account.type,
        },
        data: rowsWithBalance,
        pagination: getPagingData(total, page, pageSize),
    }
}

export const getTrialBalance = async (query) => {
    const { dateFrom, dateTo } = query

    const conditions = [`je.status = 'Valido'`]
    const params = []
    let paramIndex = 1

    if (dateFrom || dateTo) {
        const dateConds = []
        if (dateFrom) {
            dateConds.push(`je.date >= $${paramIndex++}`)
            params.push(dateFromFilter(dateFrom))
        }
        if (dateTo) {
            dateConds.push(`je.date <= $${paramIndex++}`)
            params.push(dateToFilter(dateTo))
        }
        conditions.push(`(${dateConds.join(' AND ')})`)
    }

    const where = conditions.join(' AND ')

    const rows = await sequelize.query(
        `SELECT
            a._id AS "accountId",
            a.code, a.name, a.type,
            COALESCE(SUM(CASE WHEN je.type = 'Ingreso' THEN je.amount ELSE 0 END), 0) AS "totalIngresos",
            COALESCE(SUM(CASE WHEN je.type = 'Egreso' THEN je.amount ELSE 0 END), 0) AS "totalEgresos",
            COALESCE(SUM(CASE WHEN je.type = 'Ingreso' THEN je.amount ELSE -je.amount END), 0) AS balance
        FROM journal_entries je
        INNER JOIN accounts a ON a._id = je.account
        WHERE ${where}
        GROUP BY a._id, a.code, a.name, a.type
        ORDER BY a.code ASC`,
        { bind: params, type: sequelize.QueryTypes.SELECT }
    )

    const parsed = rows.map(r => ({
        ...r,
        totalIngresos: parseFloat(r.totalIngresos),
        totalEgresos: parseFloat(r.totalEgresos),
        balance: parseFloat(r.balance),
    }))

    const totals = parsed.reduce(
        (acc, row) => {
            acc.totalIngresos += row.totalIngresos
            acc.totalEgresos += row.totalEgresos
            return acc
        },
        { totalIngresos: 0, totalEgresos: 0 }
    )

    return {
        data: parsed,
        totals: {
            ...totals,
            saldoNeto: totals.totalIngresos - totals.totalEgresos,
        },
    }
}

export const getBalanceSheet = async (query) => {
    const asOfDate = query.asOfDate ? parseLocalDate(query.asOfDate) : new Date()

    const rows = await sequelize.query(
        `SELECT
            a._id AS "accountId",
            a.code, a.name, a.type,
            a.parent_account AS "parentAccount",
            COALESCE(SUM(CASE WHEN je.type = 'Ingreso' THEN je.amount ELSE 0 END), 0) AS "totalIngresos",
            COALESCE(SUM(CASE WHEN je.type = 'Egreso' THEN je.amount ELSE 0 END), 0) AS "totalEgresos",
            CASE
                WHEN a.type = 'Activo'
                THEN COALESCE(SUM(CASE WHEN je.type = 'Ingreso' THEN je.amount ELSE -je.amount END), 0)
                ELSE COALESCE(SUM(CASE WHEN je.type = 'Egreso' THEN je.amount ELSE -je.amount END), 0)
            END AS balance
        FROM journal_entries je
        INNER JOIN accounts a ON a._id = je.account
        WHERE je.status = 'Valido' AND je.date <= $1
            AND a.type IN ('Activo', 'Pasivo', 'Patrimonio')
        GROUP BY a._id, a.code, a.name, a.type, a.parent_account
        ORDER BY a.code ASC`,
        { bind: [asOfDate], type: sequelize.QueryTypes.SELECT }
    )

    const parsed = rows.map(r => ({
        ...r,
        totalIngresos: parseFloat(r.totalIngresos),
        totalEgresos: parseFloat(r.totalEgresos),
        balance: parseFloat(r.balance),
    }))

    const activo = parsed.filter((r) => r.type === 'Activo')
    const pasivo = parsed.filter((r) => r.type === 'Pasivo')
    const patrimonio = parsed.filter((r) => r.type === 'Patrimonio')

    const sumActivo = activo.reduce((s, r) => s + r.balance, 0)
    const sumPasivo = pasivo.reduce((s, r) => s + r.balance, 0)
    const sumPatrimonio = patrimonio.reduce((s, r) => s + r.balance, 0)

    return {
        asOfDate,
        data: { activo, pasivo, patrimonio },
        totals: {
            activo: sumActivo,
            pasivo: sumPasivo,
            patrimonio: sumPatrimonio,
            pasivoPatrimonio: sumPasivo + sumPatrimonio,
            balanceado: Math.abs(sumActivo - (sumPasivo + sumPatrimonio)) < 0.01,
        },
    }
}

export const getIncomeStatement = async (query) => {
    const { dateFrom, dateTo } = query

    const conditions = [`je.status = 'Valido'`]
    const params = []
    let paramIndex = 1

    if (dateFrom || dateTo) {
        const dateConds = []
        if (dateFrom) {
            dateConds.push(`je.date >= $${paramIndex++}`)
            params.push(dateFromFilter(dateFrom))
        }
        if (dateTo) {
            dateConds.push(`je.date <= $${paramIndex++}`)
            params.push(dateToFilter(dateTo))
        }
        conditions.push(`(${dateConds.join(' AND ')})`)
    }

    const where = conditions.join(' AND ')

    const rows = await sequelize.query(
        `SELECT
            a._id AS "accountId",
            a.code, a.name, a.type,
            COALESCE(SUM(CASE WHEN je.type = 'Ingreso' THEN je.amount ELSE 0 END), 0) AS "totalIngresos",
            COALESCE(SUM(CASE WHEN je.type = 'Egreso' THEN je.amount ELSE 0 END), 0) AS "totalEgresos",
            CASE
                WHEN a.type = 'Ingreso'
                THEN COALESCE(SUM(CASE WHEN je.type = 'Ingreso' THEN je.amount ELSE 0 END), 0)
                ELSE COALESCE(SUM(CASE WHEN je.type = 'Egreso' THEN je.amount ELSE 0 END), 0)
            END AS balance
        FROM journal_entries je
        INNER JOIN accounts a ON a._id = je.account
        WHERE ${where} AND a.type IN ('Ingreso', 'Gasto')
        GROUP BY a._id, a.code, a.name, a.type
        ORDER BY a.code ASC`,
        { bind: params, type: sequelize.QueryTypes.SELECT }
    )

    const parsed = rows.map(r => ({
        ...r,
        totalIngresos: parseFloat(r.totalIngresos),
        totalEgresos: parseFloat(r.totalEgresos),
        balance: parseFloat(r.balance),
    }))

    const ingresos = parsed.filter((r) => r.type === 'Ingreso')
    const gastos = parsed.filter((r) => r.type === 'Gasto')

    const totalIngresos = ingresos.reduce((s, r) => s + r.balance, 0)
    const totalGastos = gastos.reduce((s, r) => s + r.balance, 0)
    const resultadoNeto = totalIngresos - totalGastos

    return {
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        data: { ingresos, gastos },
        totals: {
            ingresos: totalIngresos,
            gastos: totalGastos,
            resultadoNeto,
        },
    }
}

export const exportJournalPDF = async (query, res) => {
    const { dateFrom, dateTo, type, status } = query

    const filter = { status: status || 'Valido' }
    if (type) filter.type = type
    if (dateFrom || dateTo) {
        filter.date = {}
        if (dateFrom) filter.date[Op.gte] = dateFromFilter(dateFrom)
        if (dateTo) filter.date[Op.lte] = dateToFilter(dateTo)
    }

    const entries = await JournalEntry.findAll({
        where: filter,
        include: [
            { association: 'accountData', attributes: ['_id', 'code', 'name', 'type'] },
            { association: 'createdByData', attributes: ['_id', 'username'] },
        ],
        order: [['date', 'DESC'], ['voucherNumber', 'DESC']],
    })

    const doc = new PDFDocument({ margin: 40, size: 'LETTER' })
    const filename = `journal-${Date.now()}.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`)
    doc.pipe(res)

    doc.fontSize(16).font('Helvetica-Bold').text('Libro Diario - Reporte de Asientos Contables', { align: 'center' })
    doc.moveDown(0.5)

    doc.fontSize(10).font('Helvetica')
    if (dateFrom) doc.text(`Desde: ${parseLocalDate(dateFrom).toLocaleDateString('es-HN')}`, { continued: true })
    if (dateTo) doc.text(`   Hasta: ${parseLocalDate(dateTo).toLocaleDateString('es-HN')}`)
    if (type) doc.text(`Tipo: ${type}`)
    doc.moveDown(0.5)

    doc.moveTo(40, doc.y).lineTo(575, doc.y).stroke()
    doc.moveDown(0.5)

    const tableTop = doc.y
    const colWidths = { comp: 100, fecha: 65, tipo: 50, cuenta: 100, concepto: 150, monto: 70 }
    const rowHeight = 20

    doc.font('Helvetica-Bold').fontSize(8)
    doc.text('Comprobante', 40, tableTop)
    doc.text('Fecha', 40 + colWidths.comp, tableTop)
    doc.text('Tipo', 40 + colWidths.comp + colWidths.fecha, tableTop)
    doc.text('Cuenta', 40 + colWidths.comp + colWidths.fecha + colWidths.tipo, tableTop)
    doc.text('Concepto', 40 + colWidths.comp + colWidths.fecha + colWidths.tipo + colWidths.cuenta, tableTop)
    doc.text('Monto', 505, tableTop, { width: colWidths.monto, align: 'right' })

    doc.moveTo(40, tableTop + 12).lineTo(575, tableTop + 12).stroke()

    let y = tableTop + 18
    doc.font('Helvetica').fontSize(8)

    let totalIngresos = 0
    let totalEgresos = 0

    for (const entry of entries) {
        if (y > 720) {
            doc.addPage()
            y = 40
            doc.font('Helvetica-Bold').fontSize(8)
            doc.text('Comprobante', 40, y)
            doc.text('Fecha', 40 + colWidths.comp, y)
            doc.text('Tipo', 40 + colWidths.comp + colWidths.fecha, y)
            doc.text('Cuenta', 40 + colWidths.comp + colWidths.fecha + colWidths.tipo, y)
            doc.text('Concepto', 40 + colWidths.comp + colWidths.fecha + colWidths.tipo + colWidths.cuenta, y)
            doc.text('Monto', 505, y, { width: colWidths.monto, align: 'right' })
            doc.moveTo(40, y + 12).lineTo(575, y + 12).stroke()
            y += 18
        }

        const dateStr = new Date(entry.date).toLocaleDateString('es-HN')
        const accountCode = entry.accountData?.code ?? '—'
        const montoStr = `L. ${parseFloat(entry.amount).toFixed(2)}`

        doc.text(entry.voucherNumber, 40, y, { width: colWidths.comp - 5 })
        doc.text(dateStr, 40 + colWidths.comp, y, { width: colWidths.fecha })
        doc.text(entry.type, 40 + colWidths.comp + colWidths.fecha, y, { width: colWidths.tipo })
        doc.text(accountCode, 40 + colWidths.comp + colWidths.fecha + colWidths.tipo, y, { width: colWidths.cuenta - 5 })
        doc.text(entry.concept.substring(0, 55), 40 + colWidths.comp + colWidths.fecha + colWidths.tipo + colWidths.cuenta, y, { width: colWidths.concepto - 10 })

        if (entry.type === 'Ingreso') {
            doc.fillColor('green').text(montoStr, 505, y, { width: colWidths.monto, align: 'right' })
        } else {
            doc.fillColor('red').text(montoStr, 505, y, { width: colWidths.monto, align: 'right' })
        }
        doc.fillColor('black')

        if (entry.type === 'Ingreso') totalIngresos += parseFloat(entry.amount)
        else totalEgresos += parseFloat(entry.amount)

        y += rowHeight
    }

    y += 10
    doc.moveTo(40, y).lineTo(575, y).stroke()
    y += 10
    doc.font('Helvetica-Bold').fontSize(10)
    doc.text(`Total Ingresos: L. ${totalIngresos.toFixed(2)}`, 40, y)
    y += 16
    doc.fillColor('red').text(`Total Egresos: L. ${totalEgresos.toFixed(2)}`, 40, y)
    doc.fillColor('black')
    y += 16
    const balance = totalIngresos - totalEgresos
    doc.fillColor(balance >= 0 ? 'green' : 'red').text(`Saldo: L. ${balance.toFixed(2)}`, 40, y)
    doc.fillColor('black')

    doc.fontSize(7).font('Helvetica')
    doc.text(`Generado el ${new Date().toLocaleString('es-HN')}`, 40, 750, { align: 'center' })

    doc.end()
}

export const getCashBalance = async (query) => {
    const { dateFrom, dateTo } = query

    const conditions = [`je.status = 'Valido'`]
    const params = []
    let paramIndex = 1

    if (dateFrom || dateTo) {
        const dateConds = []
        if (dateFrom) {
            dateConds.push(`je.date >= $${paramIndex++}`)
            params.push(dateFromFilter(dateFrom))
        }
        if (dateTo) {
            dateConds.push(`je.date <= $${paramIndex++}`)
            params.push(dateToFilter(dateTo))
        }
        conditions.push(`(${dateConds.join(' AND ')})`)
    }

    const where = conditions.join(' AND ')

    const result = await sequelize.query(
        `SELECT
            COALESCE(SUM(CASE WHEN je.type = 'Ingreso' THEN je.amount ELSE 0 END), 0) AS "totalIngresos",
            COALESCE(SUM(CASE WHEN je.type = 'Egreso' THEN je.amount ELSE 0 END), 0) AS "totalEgresos",
            COUNT(*) AS count
        FROM journal_entries je
        WHERE ${where}`,
        { bind: params, type: sequelize.QueryTypes.SELECT }
    )

    const totals = result[0] || { totalIngresos: 0, totalEgresos: 0, count: 0 }

    return {
        totalIngresos: parseFloat(totals.totalIngresos),
        totalEgresos: parseFloat(totals.totalEgresos),
        saldoNeto: parseFloat(totals.totalIngresos) - parseFloat(totals.totalEgresos),
        count: parseInt(totals.count, 10),
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
    }
}
