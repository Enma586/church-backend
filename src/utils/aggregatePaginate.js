import { getPagination, getPagingData } from './pagination.js'

export const aggregatePaginate = async (Model, { filter = {}, sort = {}, page = 1, limit = 10, lookups = [], project = {} }) => {
    const { skip, limit: pageSize } = getPagination(page, limit)

    const pipeline = [
        { $match: filter },
        { $sort: sort },
        {
            $facet: {
                metadata: [{ $count: 'total' }],
                data: [
                    { $skip: skip },
                    { $limit: pageSize },
                    ...lookups,
                    ...(Object.keys(project).length ? [{ $project: project }] : [])
                ]
            }
        }
    ]

    const [result] = await Model.aggregate(pipeline)

    const total = result.metadata[0]?.total ?? 0
    const data = result.data ?? []

    return {
        data,
        pagination: getPagingData(total, page, pageSize)
    }
}
