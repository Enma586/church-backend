import { Op } from 'sequelize'
import sequelize from '../../config/db.js'
import { CashClosing, CashDenomination, Counter } from '../../models/index.js'
import { getIO } from '../../config/socket.js'
import { AppError } from '../../utils/AppError.js'
import { parseLocalDate, dateFromFilter, dateToFilter } from '../../utils/date.js'

const HONDURAS_DENOMINATIONS = [
    500, 200, 100, 50, 20, 10, 5, 2, 1,
]

const generateReference = async (date) => {
    const yearMonth = date.toISOString().slice(0, 7).replace('-', '')
    const counterId = `cash-close-${yearMonth}`

    const [counter] = await Counter.findOrCreate({
        where: { _id: counterId },
        defaults: { _id: counterId, seq: 0 },
    })

    await counter.increment('seq', { by: 1 })
    await counter.reload()

    return `ARQ-${yearMonth}-${String(counter.seq).padStart(3, '0')}`
}

export const createCashClosing = async (data, userId) => {
    const closeDate = parseLocalDate(data.date) || new Date()

    if (!data.denominations || !Array.isArray(data.denominations) || data.denominations.length === 0) {
        throw new AppError('Debe proporcionar al menos una denominación', 400)
    }

    let totalCalculated = 0
    const validatedDenominations = data.denominations.map((d) => {
        if (d.quantity < 0 || !Number.isInteger(d.quantity)) {
            throw new AppError(`Cantidad inválida para denominación L.${d.denomination}`, 400)
        }
        const subtotal = d.denomination * d.quantity
        totalCalculated += subtotal
        return { denomination: d.denomination, quantity: d.quantity, subtotal }
    })

    const result = await sequelize.query(
        `SELECT
            COALESCE(SUM(CASE WHEN je.type = 'Ingreso' THEN je.amount ELSE 0 END), 0) AS "totalIngresos",
            COALESCE(SUM(CASE WHEN je.type = 'Egreso' THEN je.amount ELSE 0 END), 0) AS "totalEgresos"
        FROM journal_entries je
        WHERE je.status = 'Valido' AND je.date <= $1`,
        { bind: [closeDate], type: sequelize.QueryTypes.SELECT }
    )

    const expectedBalance = result[0]
        ? parseFloat(result[0].totalIngresos) - parseFloat(result[0].totalEgresos)
        : 0

    const difference = totalCalculated - expectedBalance

    const reference = await generateReference(closeDate)

    const closing = await CashClosing.create({
        date: closeDate,
        reference,
        concept: data.concept || 'Cierre de caja',
        totalCalculated,
        expectedBalance,
        difference,
        notes: data.notes || '',
        createdBy: userId,
    })

    if (validatedDenominations.length > 0) {
        const denomRecords = validatedDenominations.map(d => ({
            ...d,
            cashClosingId: closing._id,
        }))
        await CashDenomination.bulkCreate(denomRecords)
    }

    const populated = await CashClosing.findByPk(closing._id, {
        include: [
            { association: 'denominations' },
            { association: 'createdByData', attributes: ['_id', 'username', 'role'] },
        ],
    })

    const io = getIO()
    io.emit('cash-closing:created', populated.toJSON())

    return populated
}

export const findAllCashClosings = async (query) => {
    const { page = 1, limit = 20, dateFrom, dateTo } = query

    const filter = {}
    if (dateFrom || dateTo) {
        filter.date = {}
        if (dateFrom) filter.date[Op.gte] = dateFromFilter(dateFrom)
        if (dateTo) filter.date[Op.lte] = dateToFilter(dateTo)
    }

    const skip = (page - 1) * limit
    const total = await CashClosing.count({ where: filter })

    const items = await CashClosing.findAll({
        where: filter,
        include: [
            { association: 'denominations' },
            { association: 'createdByData', attributes: ['_id', 'username', 'role'] },
        ],
        order: [['date', 'DESC'], ['createdAt', 'DESC']],
        offset: skip,
        limit,
    })

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
    }
}

export const findCashClosingById = async (id) => {
    return await CashClosing.findByPk(id, {
        include: [
            { association: 'denominations' },
            { association: 'createdByData', attributes: ['_id', 'username', 'role'] },
        ],
    })
}

export const getDenominations = () => {
    return HONDURAS_DENOMINATIONS
}
