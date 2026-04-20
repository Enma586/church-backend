import { Sacrament } from '../../models/index.js';
import { aggregatePaginate } from '../../utils/aggregatePaginate.js';
import { getIO } from '../../config/socket.js';

export const createSacrament = async (data) => {
    const sacrament = await Sacrament.create(data);

    const io = getIO();
    io.emit('sacrament:created', sacrament);

    return sacrament;
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
    const updated = await Sacrament.findByIdAndUpdate(id, data, { new: true, runValidators: true });

    const io = getIO();
    io.emit('sacrament:updated', updated);

    return updated;
};

export const removeSacrament = async (id) => {
    const deleted = await Sacrament.findByIdAndDelete(id);

    const io = getIO();
    io.emit('sacrament:deleted', { id });

    return deleted;
};
