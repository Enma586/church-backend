import { Op } from 'sequelize'
import { JournalEntry, Account, Product, Counter } from '../../models/index.js'
import { aggregatePaginate } from '../../utils/aggregatePaginate.js'
import { getIO } from '../../config/socket.js'
import { AppError } from '../../utils/AppError.js'
import { parseLocalDate, dateFromFilter, dateToFilter } from '../../utils/date.js'

const generateVoucherNumber = async (date) => {
    const yearMonth = date.toISOString().slice(0, 7).replace('-', '')
    const counterId = `voucher-${yearMonth}`

    const [counter] = await Counter.findOrCreate({
        where: { _id: counterId },
        defaults: { _id: counterId, seq: 0 },
    })

    await counter.increment('seq', { by: 1 })
    await counter.reload()

    return `VCH-${yearMonth}-${String(counter.seq).padStart(4, '0')}`
}

export const createJournalEntry = async (data, userId) => {
    const account = await Account.findByPk(data.account)
    if (!account) {
        throw new AppError('La cuenta especificada no existe', 404)
    }
    if (!account.isActive) {
        throw new AppError(`La cuenta "${account.code} - ${account.name}" está inactiva`, 400)
    }
    if (!account.acceptsTransactions) {
        throw new AppError(`La cuenta "${account.code} - ${account.name}" es de agrupación y no acepta transacciones`, 400)
    }

    if (data.product) {
        const product = await Product.findByPk(data.product)
        if (!product) {
            throw new AppError('El producto especificado no existe', 404)
        }
        if (!product.isActive) {
            throw new AppError('El producto especificado está inactivo', 400)
        }
    }

    if (!data.amount || data.amount <= 0) {
        throw new AppError('El monto debe ser mayor a cero', 400)
    }

    const entryDate = parseLocalDate(data.date) || new Date()
    const voucherNumber = await generateVoucherNumber(entryDate)

    const entry = await JournalEntry.create({
        ...data,
        date: entryDate,
        voucherNumber,
        createdBy: userId,
    })

    const populated = await JournalEntry.findByPk(entry._id, {
        include: [
            { association: 'accountData', attributes: ['_id', 'code', 'name', 'type'] },
            { association: 'productData', attributes: ['_id', 'name', 'defaultPrice'] },
            { association: 'createdByData', attributes: ['_id', 'username', 'role'] },
        ],
    })

    const io = getIO()
    io.emit('journal-entry:created', populated.toJSON())

    return populated
}

export const findAllJournalEntries = async (query) => {
    const { page, limit, dateFrom, dateTo, type, status, search } = query

    const filter = {}
    if (type) filter.type = type
    if (status) filter.status = status
    if (dateFrom || dateTo) {
        filter.date = {}
        if (dateFrom) filter.date[Op.gte] = dateFromFilter(dateFrom)
        if (dateTo) filter.date[Op.lte] = dateToFilter(dateTo)
    }
    if (search) {
        filter[Op.or] = [
            { concept: { [Op.iLike]: `%${search}%` } },
            { voucherNumber: { [Op.iLike]: `%${search}%` } },
        ]
    }

    return await aggregatePaginate(JournalEntry, {
        filter,
        sort: { date: -1, voucherNumber: -1 },
        page,
        limit,
        include: [
            { association: 'accountData', attributes: ['_id', 'code', 'name', 'type'] },
            { association: 'productData', attributes: ['_id', 'name', 'defaultPrice'] },
            { association: 'createdByData', attributes: ['_id', 'username', 'role'] },
        ],
    })
}

export const findJournalEntryById = async (id) => {
    return await JournalEntry.findByPk(id, {
        include: [
            { association: 'accountData', attributes: ['_id', 'code', 'name', 'type'] },
            { association: 'productData', attributes: ['_id', 'name', 'defaultPrice'] },
            { association: 'createdByData', attributes: ['_id', 'username', 'role'] },
        ],
    })
}

export const updateJournalEntry = async (id, data) => {
    const existing = await JournalEntry.findByPk(id)
    if (!existing) {
        throw new AppError('Asiento contable no encontrado', 404)
    }

    if (existing.status === 'Anulado') {
        throw new AppError('El asiento ya se encuentra anulado', 400)
    }

    await existing.update({ status: data.status })

    const updated = await JournalEntry.findByPk(id, {
        include: [
            { association: 'accountData', attributes: ['_id', 'code', 'name', 'type'] },
            { association: 'productData', attributes: ['_id', 'name', 'defaultPrice'] },
            { association: 'createdByData', attributes: ['_id', 'username', 'role'] },
        ],
    })

    const io = getIO()
    io.emit('journal-entry:updated', updated.toJSON())

    return updated
}

export const removeJournalEntry = async (id) => {
    const entry = await JournalEntry.findByPk(id)
    if (!entry) {
        throw new AppError('Asiento contable no encontrado', 404)
    }

    await entry.destroy()

    const io = getIO()
    io.emit('journal-entry:deleted', { id })

    return entry
}
