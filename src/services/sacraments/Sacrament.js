import { Sacrament } from '../../models/index.js';
import { aggregatePaginate } from '../../utils/aggregatePaginate.js';

export const createSacrament = async (data) => {
    return await Sacrament.create(data);
};

export const findAllSacraments = async (query) => {
    const { page, limit, type, memberId, dateFrom, dateTo } = query;

    const filter = {};
    if (type) filter.type = type;
    if (memberId) filter.memberId = memberId;
    if (dateFrom || dateTo) {
        filter.date = {};
        if (dateFrom) filter.date.$gte = new Date(dateFrom);
        if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    return await aggregatePaginate(Sacrament, {
        filter,
        sort: { date: -1 },
        page,
        limit,
        lookups: [
            {
                $lookup: {
                    from: 'members',
                    localField: 'memberId',
                    foreignField: '_id',
                    as: 'member'
                }
            },
            { $unwind: { path: '$member', preserveNullAndEmptyArrays: true } }
        ]
    });
};

export const findSacramentById = async (id) => {
    return await Sacrament.findById(id).populate('memberId', 'fullName phone email');
};

export const updateSacrament = async (id, data) => {
    return await Sacrament.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

export const removeSacrament = async (id) => {
    return await Sacrament.findByIdAndDelete(id);
};
