import { Op } from 'sequelize'
import { Product, Account } from '../../models/index.js'
import { aggregatePaginate } from '../../utils/aggregatePaginate.js'
import { getIO } from '../../config/socket.js'
import { AppError } from '../../utils/AppError.js'

export const createProduct = async (data) => {
    const incomeAccount = await Account.findByPk(data.incomeAccountId)
    if (!incomeAccount) {
        throw new AppError('La cuenta de ingreso especificada no existe', 404)
    }
    if (incomeAccount.type !== 'Ingreso') {
        throw new AppError(
            `La cuenta "${incomeAccount.code} - ${incomeAccount.name}" no es de tipo Ingreso`,
            400
        )
    }

    const product = await Product.create(data)

    const populated = await Product.findByPk(product._id, {
        include: [{ association: 'incomeAccount', attributes: ['_id', 'code', 'name', 'type'] }],
    })

    const io = getIO()
    io.emit('product:created', populated.toJSON())

    return populated
}

export const findAllProducts = async (query) => {
    const { page, limit, isActive, search } = query

    const filter = {}
    if (isActive !== undefined) filter.isActive = isActive
    if (search) {
        filter.name = { [Op.iLike]: `%${search}%` }
    }

    return await aggregatePaginate(Product, {
        filter,
        sort: { name: 1 },
        page,
        limit,
        include: [
            { association: 'incomeAccount', attributes: ['_id', 'code', 'name', 'type'] },
        ],
    })
}

export const findProductById = async (id) => {
    return await Product.findByPk(id, {
        include: [{ association: 'incomeAccount', attributes: ['_id', 'code', 'name', 'type'] }],
    })
}

export const updateProduct = async (id, data) => {
    if (data.incomeAccountId) {
        const incomeAccount = await Account.findByPk(data.incomeAccountId)
        if (!incomeAccount) {
            throw new AppError('La cuenta de ingreso especificada no existe', 404)
        }
        if (incomeAccount.type !== 'Ingreso') {
            throw new AppError(
                `La cuenta "${incomeAccount.code}" no es de tipo Ingreso`,
                400
            )
        }
    }

    const product = await Product.findByPk(id)
    if (!product) {
        throw new AppError('Producto no encontrado', 404)
    }

    await product.update(data)

    const updated = await Product.findByPk(id, {
        include: [{ association: 'incomeAccount', attributes: ['_id', 'code', 'name', 'type'] }],
    })

    const io = getIO()
    io.emit('product:updated', updated.toJSON())

    return updated
}

export const removeProduct = async (id) => {
    const product = await Product.findByPk(id)
    if (!product) {
        throw new AppError('Producto no encontrado', 404)
    }

    await product.destroy()

    const io = getIO()
    io.emit('product:deleted', { id })

    return product
}
