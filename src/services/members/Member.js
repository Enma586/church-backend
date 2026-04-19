import { Member } from '../../models/index.js';
import { aggregatePaginate } from '../../utils/aggregatePaginate.js';

export const createMember = async (data) => {
    return await Member.create(data);
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
    return await Member.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

export const removeMember = async (id) => {
    return await Member.findByIdAndDelete(id);
};
