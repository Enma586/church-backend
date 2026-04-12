import bcrypt from 'bcryptjs';
import { User } from '../../models/index.js';
import { getPagination, getPagingData } from '../../utils/pagination.js';

/**
 * Creates a new user account linked to a member profile.
 * The password is automatically hashed with bcrypt (salt rounds: 10) before storage.
 * @param {Object} data - User fields (memberId, username, password, role, isActive).
 * @param {string} data.password - Plain-text password to be hashed before saving.
 * @returns {Promise<Document>} The created user document (password already hashed).
 */
export const createUser = async (data) => {
    const salt = await bcrypt.genSalt(10);
    data.password = await bcrypt.hash(data.password, salt);
    return await User.create(data);
};

/**
 * Retrieves a paginated list of users with optional filtering.
 * Joins with the members collection to resolve the linked member profile.
 * The password field is excluded from all results.
 * @param {Object} query - Query parameters from the request.
 * @param {number} [query.page=1] - Current page number (1-based).
 * @param {number} [query.limit=10] - Number of items per page.
 * @param {string} [query.role] - Filter by user role (Administrador, Empleado).
 * @param {boolean} [query.isActive] - Filter by active status.
 * @param {string} [query.search] - Case-insensitive search term to match against username.
 * @returns {Promise<{data: Document[], pagination: Object}>} Paginated result with member populated and password excluded.
 */
export const findAllUsers = async (query) => {
    const { page, limit, role, isActive, search } = query;
    const { skip, limit: pageSize } = getPagination(page, limit);

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive;
    if (search) filter.username = { $regex: search, $options: 'i' };

    const { docs } = await User.aggregate([
        { $match: filter },
        { $sort: { createdAt: -1 } },
        { $facet: {
            metadata: [{ $count: 'total' }],
            data: [
                { $skip: skip },
                { $limit: pageSize },
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
                    $project: {
                        password: 0
                    }
                }
            ]
        }}
    ]);

    const total = docs[0]?.metadata[0]?.total ?? 0;
    const data = docs[0]?.data ?? [];

    return {
        data,
        pagination: getPagingData(total, page, pageSize)
    };
};

/**
 * Finds a single user by its ObjectId.
 * The password field is excluded from the result.
 * @param {string} id - The user's ObjectId.
 * @returns {Promise<Document|null>} The user document with member populated (password excluded), or null if not found.
 */
export const findUserById = async (id) => {
    return await User.findById(id)
        .select('-password')
        .populate('memberId', 'fullName phone email');
};

/**
 * Updates an existing user by its ObjectId.
 * If the password field is present in data, it is re-hashed before saving.
 * The password field is excluded from the returned document.
 * @param {string} id - The user's ObjectId.
 * @param {Object} data - Fields to update (username, password, role, isActive).
 * @param {string} [data.password] - New plain-text password to be hashed if provided.
 * @returns {Promise<Document|null>} The updated user document (password excluded), or null if not found.
 */
export const updateUser = async (id, data) => {
    if (data.password) {
        const salt = await bcrypt.genSalt(10);
        data.password = await bcrypt.hash(data.password, salt);
    }
    return await User.findByIdAndUpdate(id, data, { new: true, runValidators: true }).select('-password');
};

/**
 * Deletes a user by its ObjectId.
 * @param {string} id - The user's ObjectId.
 * @returns {Promise<Document|null>} The deleted user document, or null if not found.
 */
export const removeUser = async (id) => {
    return await User.findByIdAndDelete(id);
};

/**
 * Finds a single user by its username.
 * Used during the authentication flow to locate the account before password verification.
 * @param {string} username - The username to search for (case-insensitive handled at query level).
 * @returns {Promise<Document|null>} The user document with member populated, or null if not found.
 */
export const findUserByUsername = async (username) => {
    return await User.findOne({ username }).populate('memberId', 'fullName role');
};

/**
 * Compares a plain-text password against a stored bcrypt hash.
 * Used during login to verify user credentials.
 * @param {string} plainPassword - The plain-text password provided by the user.
 * @param {string} hashedPassword - The bcrypt hash stored in the database.
 * @returns {Promise<boolean>} True if the passwords match, false otherwise.
 */
export const comparePassword = async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
};
