import { Op } from 'sequelize'
import { Department } from '../../models/index.js'
import { aggregatePaginate } from '../../utils/aggregatePaginate.js'

export const createDepartment = async (data) => {
    return await Department.create(data)
}

export const findAllDepartments = async (query) => {
    const { page, limit, search } = query

    const filter = search
        ? { name: { [Op.iLike]: `%${search}%` } }
        : {}

    return await aggregatePaginate(Department, {
        filter,
        sort: { name: 1 },
        page,
        limit,
    })
}

export const findDepartmentById = async (id) => {
    return await Department.findByPk(id)
}

export const updateDepartment = async (id, data) => {
    await Department.update(data, { where: { _id: id } })
    return await Department.findByPk(id)
}

export const removeDepartment = async (id) => {
    const dept = await Department.findByPk(id)
    if (dept) await dept.destroy()
    return dept
}
