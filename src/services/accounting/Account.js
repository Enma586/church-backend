import { Op } from 'sequelize'
import { Account, JournalEntry, Product } from '../../models/index.js'
import { aggregatePaginate } from '../../utils/aggregatePaginate.js'
import { getIO } from '../../config/socket.js'
import { AppError } from '../../utils/AppError.js'

export const createAccount = async (data) => {
    const existing = await Account.findOne({ where: { code: data.code } })
    if (existing) {
        throw new AppError(`El código de cuenta "${data.code}" ya existe`, 409)
    }

    if (data.parentAccount) {
        const parent = await Account.findByPk(data.parentAccount)
        if (!parent) {
            throw new AppError('La cuenta padre especificada no existe', 404)
        }
        if (parent.acceptsTransactions === true) {
            throw new AppError('La cuenta padre debe ser una cuenta de agrupación (acceptsTransactions: false)', 400)
        }
    }

    const account = await Account.create(data)

    const io = getIO()
    io.emit('account:created', account.toJSON())

    return account
}

export const findAllAccounts = async (query) => {
    const { page, limit, type, isActive, search } = query

    const filter = {}
    if (type) filter.type = type
    if (isActive !== undefined) filter.isActive = isActive
    if (search) {
        filter[Op.or] = [
            { code: { [Op.iLike]: `%${search}%` } },
            { name: { [Op.iLike]: `%${search}%` } },
        ]
    }

    return await aggregatePaginate(Account, {
        filter,
        sort: { code: 1 },
        page,
        limit,
        include: [
            { association: 'parentAccountData', attributes: ['_id', 'code', 'name', 'type'] },
        ],
    })
}

export const findAccountById = async (id) => {
    const account = await Account.findByPk(id, {
        include: [{ association: 'parentAccountData', attributes: ['_id', 'code', 'name', 'type'] }],
    })
    if (!account) return null

    const children = await Account.findAll({
        where: { parentAccount: id },
        attributes: ['_id', 'code', 'name', 'type', 'isActive', 'acceptsTransactions'],
        order: [['code', 'ASC']],
    })

    const json = account.toJSON()
    json.children = children.map(c => c.toJSON())
    return json
}

export const updateAccount = async (id, data) => {
    const account = await Account.findByPk(id)
    if (!account) {
        throw new AppError('Cuenta contable no encontrada', 404)
    }

    if (data.parentAccount !== undefined && data.parentAccount !== null) {
        if (data.parentAccount === id) {
            throw new AppError('Una cuenta no puede ser su propia padre', 400)
        }
        const parent = await Account.findByPk(data.parentAccount)
        if (!parent) {
            throw new AppError('La cuenta padre especificada no existe', 404)
        }
        if (parent.acceptsTransactions === true) {
            throw new AppError('La cuenta padre debe ser una cuenta de agrupación', 400)
        }
        let current = parent
        while (current && current.parentAccount) {
            if (current.parentAccount === id) {
                throw new AppError('Referencia circular detectada: la cuenta seleccionada es descendiente de esta cuenta', 400)
            }
            current = await Account.findByPk(current.parentAccount)
        }
    }

    if (data.parentAccount === null) {
        data.parentAccount = null
    }

    await account.update(data)

    const updated = await Account.findByPk(id, {
        include: [{ association: 'parentAccountData', attributes: ['_id', 'code', 'name', 'type'] }],
    })

    const io = getIO()
    io.emit('account:updated', updated.toJSON())

    return updated
}

export const removeAccount = async (id) => {
    const account = await Account.findByPk(id)
    if (!account) {
        throw new AppError('Cuenta contable no encontrada', 404)
    }

    const childCount = await Account.count({ where: { parentAccount: id } })
    if (childCount > 0) {
        throw new AppError(
            `No se puede eliminar: esta cuenta tiene ${childCount} subcuenta(s). Elimine las subcuentas primero.`,
            409
        )
    }

    const entryCount = await JournalEntry.count({ where: { account: id } })
    if (entryCount > 0) {
        throw new AppError(
            `No se puede eliminar: esta cuenta está referenciada en ${entryCount} asiento(s) contable(s).`,
            409
        )
    }

    const productCount = await Product.count({ where: { incomeAccountId: id } })
    if (productCount > 0) {
        throw new AppError(
            `No se puede eliminar: esta cuenta está vinculada a ${productCount} producto(s).`,
            409
        )
    }

    await account.destroy()

    const io = getIO()
    io.emit('account:deleted', { id })

    return account
}
