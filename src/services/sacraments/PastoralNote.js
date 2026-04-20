import { PastoralNote } from '../../models/index.js';
import { aggregatePaginate } from '../../utils/aggregatePaginate.js';
import { getIO } from '../../config/socket.js';

export const createPastoralNote = async (data) => {
    const note = await PastoralNote.create(data);

    const io = getIO();
    io.emit('pastoral-note:created', note);

    return note;
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
    const updated = await PastoralNote.findByIdAndUpdate(id, data, { new: true, runValidators: true });

    const io = getIO();
    io.emit('pastoral-note:updated', updated);

    return updated;
};

export const removePastoralNote = async (id) => {
    const deleted = await PastoralNote.findByIdAndDelete(id);

    const io = getIO();
    io.emit('pastoral-note:deleted', { id });

    return deleted;
};
