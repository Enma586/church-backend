import bcrypt from 'bcryptjs'
import { Op } from 'sequelize'
import { User, Member } from '../../models/index.js'
import { aggregatePaginate } from '../../utils/aggregatePaginate.js'
import { getPagination, getPagingData } from '../../utils/pagination.js'
import { getIO } from '../../config/socket.js'

export const createUser = async (data) => {
    const salt = await bcrypt.genSalt(10)
    data.password = await bcrypt.hash(data.password, salt)

    const user = await User.create(data)

    const created = await User.scope('withPassword').findByPk(user._id, {
        include: [{ association: 'member', attributes: ['_id', 'fullName', 'phone', 'email'] }],
    })

    const io = getIO()
    const userJson = created.toJSON()
    delete userJson.password
    io.emit('user:created', userJson)

    return userJson
}

export const findAllUsers = async (query) => {
    const { page, limit, role, isActive, search } = query

    const filter = {}
    if (role) filter.role = role
    if (isActive !== undefined) {
        filter.isActive = isActive === 'true' || isActive === true
    }
    if (search) filter.username = { [Op.iLike]: `%${search}%` }

    return await aggregatePaginate(User, {
        filter,
        sort: { createdAt: -1 },
        page,
        limit,
        include: [
            { association: 'member', attributes: ['_id', 'fullName', 'phone', 'email'] },
        ],
        attributes: { exclude: ['password'] },
    })
}

export const findUserById = async (id) => {
    return await User.findByPk(id, {
        attributes: { exclude: ['password'] },
        include: [{ association: 'member', attributes: ['_id', 'fullName', 'phone', 'email'] }],
    })
}

export const updateUser = async (id, data) => {
    if (data.password) {
        const salt = await bcrypt.genSalt(10)
        data.password = await bcrypt.hash(data.password, salt)
    }

    const user = await User.scope('withPassword').findByPk(id)
    if (!user) return null

    await user.update(data)

    const updated = await User.findByPk(id, {
        attributes: { exclude: ['password'] },
        include: [{ association: 'member', attributes: ['_id', 'fullName', 'phone', 'email'] }],
    })

    const io = getIO()
    io.emit('user:updated', updated.toJSON())

    return updated
}

export const removeUser = async (id) => {
    const user = await User.findByPk(id)
    if (!user) return null

    await user.destroy()

    const io = getIO()
    io.emit('user:deleted', { id })

    return user
}

export const findUserByUsername = async (username) => {
    return await User.scope('withPassword').findOne({
        where: { username },
        include: [{ association: 'member', attributes: ['_id', 'fullName', 'phone', 'email'] }],
    })
}

export const comparePassword = async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword)
}
