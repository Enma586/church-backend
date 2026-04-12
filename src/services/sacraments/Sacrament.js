import { Sacrament } from '../../models/index.js';
import { getPagination, getPagingData } from '../../utils/pagination.js';

/**
 * Creates a new sacrament record linked to a member.
 * @param {Object} data - Sacrament fields (memberId, type, date, place, celebrant, godparents).
 * @returns {Promise<Document>} The created sacrament document.
 */
export const createSacrament = async (data) => {
    return await Sacrament.create(data);
};

/**
 * Retrieves a paginated list of sacraments with optional filtering.
 * Joins with the members collection to resolve the linked member profile.
 * Results are sorted by date in descending order (most recent first).
 * @param {Object} query - Query parameters from the request.
 * @param {number} [query.page=1] - Current page number (1-based).
 * @param {number} [query.limit=10] - Number of items per page.
 * @param {string} [query.type] - Filter by sacrament type (Bautismo, Primera Comuni\u00f3n, Confirmaci\u00f3n, Matrimonio, Unci\u00f3n de los Enfermos).
 * @param {string} [query.memberId] - Filter by linked member ObjectId.
 * @param {string} [query.dateFrom] - Start of date range filter (inclusive).
 * @param {string} [query.dateTo] - End of date range filter (inclusive).
 * @returns {Promise<{data: Document[], pagination: Object}>} Paginated result with member populated.
 */
export const findAllSacraments = async (query) => {
    const { page, limit, type, memberId, dateFrom, dateTo } = query;
    const { skip, limit: pageSize } = getPagination(page, limit);

    const filter = {};
    if (type) filter.type = type;
    if (memberId) filter.memberId = memberId;
    if (dateFrom || dateTo) {
        filter.date = {};
        if (dateFrom) filter.date.$gte = new Date(dateFrom);
        if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    const { docs } = await Sacrament.aggregate([
        { $match: filter },
        { $sort: { date: -1 } },
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
                { $unwind: { path: '$member', preserveNullAndEmptyArrays: true } }
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
 * Finds a single sacrament by its ObjectId and populates the member reference.
 * @param {string} id - The sacrament's ObjectId.
 * @returns {Promise<Document|null>} The sacrament document with member populated, or null if not found.
 */
export const findSacramentById = async (id) => {
    return await Sacrament.findById(id).populate('memberId', 'fullName phone email');
};

/**
 * Updates an existing sacrament by its ObjectId.
 * @param {string} id - The sacrament's ObjectId.
 * @param {Object} data - Fields to update (type, date, place, celebrant, godparents).
 * @returns {Promise<Document|null>} The updated sacrament document, or null if not found.
 */
export const updateSacrament = async (id, data) => {
    return await Sacrament.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

/**
 * Deletes a sacrament by its ObjectId.
 * @param {string} id - The sacrament's ObjectId.
 * @returns {Promise<Document|null>} The deleted sacrament document, or null if not found.
 */
export const removeSacrament = async (id) => {
    return await Sacrament.findByIdAndDelete(id);
};
