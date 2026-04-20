import bcrypt from 'bcryptjs';
import { User } from '../../models/index.js';
import { aggregatePaginate } from '../../utils/aggregatePaginate.js';
import { getPagination, getPagingData } from '../../utils/pagination.js';
import { getIO } from '../../config/socket.js';

export const createUser = async (data) => {
    const salt = await bcrypt.genSalt(10);
    data.password = await bcrypt.hash(data.password, salt);
    const user = await User.create(data);

    const io = getIO();
    io.emit('user:created', user.toObject({ minimize: true }));

    return user;
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
    const updated = await User.findByIdAndUpdate(id, data, { new: true, runValidators: true }).select('-password');

    const io = getIO();
    io.emit('user:updated', updated);

    return updated;
};

export const removeUser = async (id) => {
    const deleted = await User.findByIdAndDelete(id);

    const io = getIO();
    io.emit('user:deleted', { id });

    return deleted;
};

export const findUserByUsername = async (username) => {
    return await User.findOne({ username })
        .select('+password +isActive')
        .populate('memberId', 'fullName role');
};

export const comparePassword = async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
};
