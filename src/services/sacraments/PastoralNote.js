import { PastoralNote } from '../../models/index.js';
import { aggregatePaginate } from '../../utils/aggregatePaginate.js';

export const createPastoralNote = async (data) => {
    return await PastoralNote.create(data);
};

export const findAllPastoralNotes = async (query) => {
    const { page, limit, memberId, isSensitive } = query;

    const filter = {};
    if (memberId) filter.memberId = memberId;
    if (isSensitive !== undefined) filter.isSensitive = isSensitive;

    return await aggregatePaginate(PastoralNote, {
        filter,
        sort: { createdAt: -1 },
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
            { $unwind: { path: '$member', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'authorId',
                    foreignField: '_id',
                    as: 'author'
                }
            },
            { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } }
        ],
        project: { 'author.password': 0 }
    });
};

export const findPastoralNoteById = async (id) => {
    return await PastoralNote.findById(id)
        .populate('memberId', 'fullName phone email')
        .populate('authorId', 'username role');
};

export const updatePastoralNote = async (id, data) => {
    return await PastoralNote.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

export const removePastoralNote = async (id) => {
    return await PastoralNote.findByIdAndDelete(id);
};
