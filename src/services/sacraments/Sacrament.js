import mongoose from 'mongoose';
import { Sacrament } from '../../models/index.js';
import { aggregatePaginate } from '../../utils/aggregatePaginate.js';
import { getIO } from '../../config/socket.js';
import { AppError } from '../../utils/AppError.js'
import { dateFromFilter, dateToFilter } from '../../utils/date.js';


export const createSacrament = async (data) => {
    // One member = one sacrament record
    const existing = await Sacrament.findOne({ memberId: data.memberId }).lean();
    if (existing) {
        throw new AppError('Este miembro ya tiene un registro sacramental. Edítalo para actualizarlo.', 409);
    }

    const sacrament = await Sacrament.create(data);
    const io = getIO();
    io.emit('sacrament:created', sacrament);
    return sacrament;
};


export const findAllSacraments = async (query) => {
    const { page, limit, type, memberId, dateFrom, dateTo } = query;

    const filter = {};
    if (type) filter.type = type;
    if (memberId && mongoose.Types.ObjectId.isValid(memberId)) {
        filter.memberId = new mongoose.Types.ObjectId(memberId);
    }
    if (dateFrom || dateTo) {
        filter.date = {};
        if (dateFrom) filter.date.$gte = dateFromFilter(dateFrom);
        if (dateTo) filter.date.$lt = dateToFilter(dateTo);
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
                    as: 'memberId'
                }
            },
            { $unwind: { path: '$memberId', preserveNullAndEmptyArrays: true } }
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
