import { Op } from 'sequelize'
import { Sacrament, Godparent } from '../../models/index.js'
import { aggregatePaginate } from '../../utils/aggregatePaginate.js'
import { getIO } from '../../config/socket.js'
import { AppError } from '../../utils/AppError.js'
import { dateFromFilter, dateToFilter } from '../../utils/date.js'

export const createSacrament = async (data) => {
    const existing = await Sacrament.findOne({ where: { memberId: data.memberId } })
    if (existing) {
        throw new AppError('Este miembro ya tiene un registro sacramental. Edítalo para actualizarlo.', 409)
    }

    const { godparents, ...sacramentData } = data
    const sacrament = await Sacrament.create(sacramentData)

    if (godparents && godparents.length > 0) {
        const godparentRecords = godparents.map(g => ({ ...g, sacramentId: sacrament._id }))
        await Godparent.bulkCreate(godparentRecords)
    }

    const created = await Sacrament.findByPk(sacrament._id, {
        include: [
            { association: 'member', attributes: ['_id', 'fullName', 'phone', 'email'] },
            { association: 'godparents' },
        ],
    })

    const io = getIO()
    io.emit('sacrament:created', created.toJSON())

    return created
}

export const findAllSacraments = async (query) => {
    const { page, limit, type, memberId, dateFrom, dateTo } = query

    const filter = {}
    if (type) filter.type = type
    if (memberId) filter.memberId = memberId
    if (dateFrom || dateTo) {
        filter.date = {}
        if (dateFrom) filter.date[Op.gte] = dateFromFilter(dateFrom)
        if (dateTo) filter.date[Op.lt] = dateToFilter(dateTo)
    }

    return await aggregatePaginate(Sacrament, {
        filter,
        sort: { date: -1 },
        page,
        limit,
        include: [
            { association: 'member', attributes: ['_id', 'fullName', 'phone', 'email'] },
            { association: 'godparents' },
        ],
    })
}

export const findSacramentById = async (id) => {
    return await Sacrament.findByPk(id, {
        include: [
            { association: 'member', attributes: ['_id', 'fullName', 'phone', 'email'] },
            { association: 'godparents' },
        ],
    })
}

export const updateSacrament = async (id, data) => {
    const sacrament = await Sacrament.findByPk(id)
    if (!sacrament) return null

    const { godparents, ...sacramentData } = data
    await sacrament.update(sacramentData)

    if (godparents !== undefined) {
        await Godparent.destroy({ where: { sacramentId: id } })
        if (godparents.length > 0) {
            const godparentRecords = godparents.map(g => ({ ...g, sacramentId: id }))
            await Godparent.bulkCreate(godparentRecords)
        }
    }

    const updated = await Sacrament.findByPk(id, {
        include: [
            { association: 'member', attributes: ['_id', 'fullName', 'phone', 'email'] },
            { association: 'godparents' },
        ],
    })

    const io = getIO()
    io.emit('sacrament:updated', updated.toJSON())

    return updated
}

export const removeSacrament = async (id) => {
    const sacrament = await Sacrament.findByPk(id)
    if (!sacrament) return null

    await Godparent.destroy({ where: { sacramentId: id } })
    await sacrament.destroy()

    const io = getIO()
    io.emit('sacrament:deleted', { id })

    return sacrament
}
