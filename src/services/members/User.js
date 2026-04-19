import bcrypt from 'bcryptjs';
import { User } from '../../models/index.js';
import { aggregatePaginate } from '../../utils/aggregatePaginate.js';
import { getPagination, getPagingData } from '../../utils/pagination.js';

export const createUser = async (data) => {
    const salt = await bcrypt.genSalt(10);
    data.password = await bcrypt.hash(data.password, salt);
    return await User.create(data);
};

export const findAllUsers = async (query) => {
    const { page, limit, role, isActive, search } = query;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive;
    if (search) filter.username = { $regex: search, $options: 'i' };

    return await aggregatePaginate(User, {
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
            { $unwind: { path: '$member', preserveNullAndEmptyArrays: true } }
        ],
        project: { password: 0 }
    });
};

export const findUserById = async (id) => {
    return await User.findById(id)
        .select('-password')
        .populate('memberId', 'fullName phone email');
};

export const updateUser = async (id, data) => {
    if (data.password) {
        const salt = await bcrypt.genSalt(10);
        data.password = await bcrypt.hash(data.password, salt);
    }
    return await User.findByIdAndUpdate(id, data, { new: true, runValidators: true }).select('-password');
};

export const removeUser = async (id) => {
    return await User.findByIdAndDelete(id);
};

export const findUserByUsername = async (username) => {
    return await User.findOne({ username })
        .select('+password +isActive')
        .populate('memberId', 'fullName role');
};

export const comparePassword = async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
};
