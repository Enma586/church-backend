import { Member } from '../../models/index.js';
import { getPagination, getPagingData } from '../../utils/pagination.js';

/**
 * Creates a new member with personal data, geographic location, and family information.
 * @param {Object} data - Member fields (fullName, dateOfBirth, gender, departmentId, municipalityId, family, etc.).
 * @returns {Promise<Document>} The created member document.
 */
export const createMember = async (data) => {
    return await Member.create(data);
};

/**
 * Retrieves a paginated list of members with optional filtering.
 * Joins with the departments and municipalities collections to resolve geographic references.
 * @param {Object} query - Query parameters from the request.
 * @param {number} [query.page=1] - Current page number (1-based).
 * @param {number} [query.limit=10] - Number of items per page.
 * @param {string} [query.status] - Filter by member status (Activo, Inactivo, Fallecido).
 * @param {string} [query.gender] - Filter by gender (Masculino, Femenino, Otro).
 * @param {string} [query.departmentId] - Filter by department ObjectId.
 * @param {string} [query.search] - Case-insensitive search term to match against full name.
 * @returns {Promise<{data: Document[], pagination: Object}>} Paginated result with department and municipality populated.
 */
export const findAllMembers = async (query) => {
    const { page, limit, status, gender, departmentId, search } = query;
    const { skip, limit: pageSize } = getPagination(page, limit);

    const filter = {};
    if (status) filter.status = status;
    if (gender) filter.gender = gender;
    if (departmentId) filter.departmentId = departmentId;
    if (search) filter.fullName = { $regex: search, $options: 'i' };

    const { docs } = await Member.aggregate([
        { $match: filter },
        { $sort: { fullName: 1 } },
        { $facet: {
            metadata: [{ $count: 'total' }],
            data: [
                { $skip: skip },
                { $limit: pageSize },
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
 * Finds a single member by its ObjectId and populates geographic references.
 * @param {string} id - The member's ObjectId.
 * @returns {Promise<Document|null>} The member document with department and municipality populated, or null if not found.
 */
export const findMemberById = async (id) => {
    return await Member.findById(id)
        .populate('departmentId', 'name isoCode')
        .populate('municipalityId', 'name code');
};

/**
 * Updates an existing member by its ObjectId.
 * @param {string} id - The member's ObjectId.
 * @param {Object} data - Fields to update (fullName, phone, email, family, status, etc.).
 * @returns {Promise<Document|null>} The updated member document, or null if not found.
 */
export const updateMember = async (id, data) => {
    return await Member.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

/**
 * Deletes a member by its ObjectId.
 * @param {string} id - The member's ObjectId.
 * @returns {Promise<Document|null>} The deleted member document, or null if not found.
 */
export const removeMember = async (id) => {
    return await Member.findByIdAndDelete(id);
};
