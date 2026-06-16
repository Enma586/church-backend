import { Op } from 'sequelize'
import { Member, FamilyMember } from '../../models/index.js'
import { aggregatePaginate } from '../../utils/aggregatePaginate.js'
import { getIO } from '../../config/socket.js'

export const createMember = async (data) => {
    const { family, ...memberData } = data

    const member = await Member.create(memberData)

    if (family && family.length > 0) {
        const familyRecords = family.map(f => ({ ...f, memberId: member._id }))
        await FamilyMember.bulkCreate(familyRecords)
    }

    const created = await Member.findByPk(member._id, {
        include: [
            { association: 'department', attributes: ['_id', 'name', 'isoCode'] },
            { association: 'municipality', attributes: ['_id', 'name', 'code'] },
            { association: 'family' },
        ],
    })

    const io = getIO()
    io.emit('member:created', created.toJSON())

    return created
}

export const findAllMembers = async (query) => {
    const { page, limit, status, gender, departmentId, search } = query

    const filter = {}
    if (status) filter.status = status
    if (gender) filter.gender = gender
    if (departmentId) filter.departmentId = departmentId
    if (search) filter.fullName = { [Op.iLike]: `%${search}%` }

    return await aggregatePaginate(Member, {
        filter,
        sort: { fullName: 1 },
        page,
        limit,
        include: [
            { association: 'department', attributes: ['_id', 'name', 'isoCode'] },
            { association: 'municipality', attributes: ['_id', 'name', 'code'] },
        ],
    })
}

export const findMemberById = async (id) => {
    return await Member.findByPk(id, {
        include: [
            { association: 'department', attributes: ['_id', 'name', 'isoCode'] },
            { association: 'municipality', attributes: ['_id', 'name', 'code'] },
            { association: 'family' },
        ],
    })
}

export const updateMember = async (id, data) => {
    const { family, ...memberData } = data

    const member = await Member.findByPk(id)
    if (!member) return null

    await member.update(memberData)

    if (family !== undefined) {
        await FamilyMember.destroy({ where: { memberId: id } })
        if (family.length > 0) {
            const familyRecords = family.map(f => ({ ...f, memberId: id }))
            await FamilyMember.bulkCreate(familyRecords)
        }
    }

    const updated = await Member.findByPk(id, {
        include: [
            { association: 'department', attributes: ['_id', 'name', 'isoCode'] },
            { association: 'municipality', attributes: ['_id', 'name', 'code'] },
            { association: 'family' },
        ],
    })

    const io = getIO()
    io.emit('member:updated', updated.toJSON())

    return updated
}

export const removeMember = async (id) => {
    const member = await Member.findByPk(id)
    if (!member) return null

    await FamilyMember.destroy({ where: { memberId: id } })
    await member.destroy()

    const io = getIO()
    io.emit('member:deleted', { id })

    return member
}
