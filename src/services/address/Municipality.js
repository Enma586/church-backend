import { Op } from 'sequelize'
import { Municipality } from '../../models/index.js'
import { aggregatePaginate } from '../../utils/aggregatePaginate.js'

export const createMunicipality = async (data) => {
    return await Municipality.create(data)
}

export const findAllMunicipalities = async (query) => {
    const { page, limit, search, departmentId } = query

    const filter = {}
    if (search) filter.name = { [Op.iLike]: `%${search}%` }
    if (departmentId) filter.departmentId = departmentId

    return await aggregatePaginate(Municipality, {
        filter,
        sort: { name: 1 },
        page,
        limit,
    })
}

export const findMunicipalityById = async (id) => {
    return await Municipality.findByPk(id, {
        include: [{ association: 'department', attributes: ['_id', 'name', 'isoCode'] }],
    })
}

export const updateMunicipality = async (id, data) => {
    await Municipality.update(data, { where: { _id: id } })
    return await Municipality.findByPk(id, {
        include: [{ association: 'department', attributes: ['_id', 'name', 'isoCode'] }],
    })
}

export const removeMunicipality = async (id) => {
    const mun = await Municipality.findByPk(id)
    if (mun) await mun.destroy()
    return mun
}
