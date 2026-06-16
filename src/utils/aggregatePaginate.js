import { getPagination, getPagingData } from './pagination.js'

export const aggregatePaginate = async (Model, { filter = {}, sort = {}, page = 1, limit = 10, include = [], attributes } = {}) => {
    const { skip, limit: pageSize } = getPagination(page, limit)

    const order = Object.entries(sort).map(([key, dir]) => [key, dir === 1 ? 'ASC' : 'DESC'])

    const [data, total] = await Promise.all([
        Model.findAll({
            where: filter,
            order: order.length ? order : undefined,
            offset: skip,
            limit: pageSize,
            include: include.length ? include : undefined,
            attributes: attributes || undefined,
            subQuery: false,
        }),
        Model.count({ where: filter }),
    ])

    return {
        data,
        pagination: getPagingData(total, page, pageSize),
    }
}
