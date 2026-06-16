import { Op } from 'sequelize'
import { PastoralNote } from '../../models/index.js'
import { aggregatePaginate } from '../../utils/aggregatePaginate.js'
import { getIO } from '../../config/socket.js'

export const createPastoralNote = async (data) => {
    const note = await PastoralNote.create(data)

    const created = await PastoralNote.findByPk(note._id, {
        include: [
            { association: 'member', attributes: ['_id', 'fullName', 'phone', 'email'] },
            { association: 'author', attributes: ['_id', 'username', 'role'] },
        ],
    })

    const io = getIO()
    io.emit('pastoral-note:created', created.toJSON())

    return created
}

export const findAllPastoralNotes = async (query) => {
    const { page, limit, memberId, isSensitive } = query

    const filter = {}
    if (memberId) filter.memberId = memberId
    if (isSensitive !== undefined) {
        filter.isSensitive = isSensitive === 'true' || isSensitive === true
    }

    return await aggregatePaginate(PastoralNote, {
        filter,
        sort: { createdAt: -1 },
        page,
        limit,
        include: [
            { association: 'member', attributes: ['_id', 'fullName', 'phone', 'email'] },
            { association: 'author', attributes: ['_id', 'username', 'role'] },
        ],
    })
}

export const findPastoralNoteById = async (id) => {
    return await PastoralNote.findByPk(id, {
        include: [
            { association: 'member', attributes: ['_id', 'fullName', 'phone', 'email'] },
            { association: 'author', attributes: ['_id', 'username', 'role'] },
        ],
    })
}

export const updatePastoralNote = async (id, data) => {
    const note = await PastoralNote.findByPk(id)
    if (!note) return null

    await note.update(data)

    const updated = await PastoralNote.findByPk(id, {
        include: [
            { association: 'member', attributes: ['_id', 'fullName', 'phone', 'email'] },
            { association: 'author', attributes: ['_id', 'username', 'role'] },
        ],
    })

    const io = getIO()
    io.emit('pastoral-note:updated', updated.toJSON())

    return updated
}

export const removePastoralNote = async (id) => {
    const note = await PastoralNote.findByPk(id)
    if (!note) return null

    await note.destroy()

    const io = getIO()
    io.emit('pastoral-note:deleted', { id })

    return note
}
