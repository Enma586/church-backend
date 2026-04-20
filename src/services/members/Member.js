import { Member } from '../../models/index.js';
import { aggregatePaginate } from '../../utils/aggregatePaginate.js';
import { getIO } from '../../config/socket.js';

export const createMember = async (data) => {
    const member = await Member.create(data);

    const io = getIO();
    io.emit('member:created', member);

    return member;
};

export const findAllMembers = async (query) => {
    const { page, limit, status, gender, departmentId, search } = query;

    const filter = {};
    if (status) filter.status = status;
    if (gender) filter.gender = gender;
    if (departmentId) filter.departmentId = departmentId;
    if (search) filter.fullName = { $regex: search, $options: 'i' };

    return await aggregatePaginate(Member, {
        filter,
        sort: { fullName: 1 },
        page,
        limit,
        lookups: [
            {
                $lookup: {
                    from: 'departments',
                    localField: 'departmentId',
                    foreignField: '_id',
                    as: 'department'
                }
            },
            { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'municipalities',
                    localField: 'municipalityId',
                    foreignField: '_id',
                    as: 'municipality'
                }
            },
            { $unwind: { path: '$municipality', preserveNullAndEmptyArrays: true } }
        ]
    });
};

export const findMemberById = async (id) => {
    return await Member.findById(id)
        .populate('departmentId', 'name isoCode')
        .populate('municipalityId', 'name code');
};

export const updateMember = async (id, data) => {
    const updated = await Member.findByIdAndUpdate(id, data, { new: true, runValidators: true });

    const io = getIO();
    io.emit('member:updated', updated);

    return updated;
};

export const removeMember = async (id) => {
    const deleted = await Member.findByIdAndDelete(id);

    const io = getIO();
    io.emit('member:deleted', { id });

    return deleted;
};
