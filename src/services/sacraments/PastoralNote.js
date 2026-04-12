import { PastoralNote } from '../../models/index.js';
import { getPagination, getPagingData } from '../../utils/pagination.js';

/**
 * Creates a new pastoral note linked to a member and authored by a user.
 * @param {Object} data - Pastoral note fields (memberId, authorId, content, isSensitive).
 * @returns {Promise<Document>} The created pastoral note document.
 */
export const createPastoralNote = async (data) => {
    return await PastoralNote.create(data);
};

/**
 * Retrieves a paginated list of pastoral notes with optional filtering.
 * Joins with the members and users collections to resolve references.
 * The author's password field is excluded from the response.
 * Results are sorted by creation date in descending order (newest first).
 * @param {Object} query - Query parameters from the request.
 * @param {number} [query.page=1] - Current page number (1-based).
 * @param {number} [query.limit=10] - Number of items per page.
 * @param {string} [query.memberId] - Filter by linked member ObjectId.
 * @param {boolean} [query.isSensitive] - Filter by sensitivity flag.
 * @returns {Promise<{data: Document[], pagination: Object}>} Paginated result with member and author populated.
 */
export const findAllPastoralNotes = async (query) => {
    const { page, limit, memberId, isSensitive } = query;
    const { skip, limit: pageSize } = getPagination(page, limit);

    const filter = {};
    if (memberId) filter.memberId = memberId;
    if (isSensitive !== undefined) filter.isSensitive = isSensitive;

    const { docs } = await PastoralNote.aggregate([
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
                    $lookup: {
                        from: 'users',
                        localField: 'authorId',
                        foreignField: '_id',
                        as: 'author'
                    }
                },
                { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        'author.password': 0
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
 * Finds a single pastoral note by its ObjectId and populates member and author references.
 * @param {string} id - The pastoral note's ObjectId.
 * @returns {Promise<Document|null>} The pastoral note document with member and author populated, or null if not found.
 */
export const findPastoralNoteById = async (id) => {
    return await PastoralNote.findById(id)
        .populate('memberId', 'fullName phone email')
        .populate('authorId', 'username role');
};

/**
 * Updates an existing pastoral note by its ObjectId.
 * @param {string} id - The pastoral note's ObjectId.
 * @param {Object} data - Fields to update (content, isSensitive).
 * @returns {Promise<Document|null>} The updated pastoral note document, or null if not found.
 */
export const updatePastoralNote = async (id, data) => {
    return await PastoralNote.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

/**
 * Deletes a pastoral note by its ObjectId.
 * @param {string} id - The pastoral note's ObjectId.
 * @returns {Promise<Document|null>} The deleted pastoral note document, or null if not found.
 */
export const removePastoralNote = async (id) => {
    return await PastoralNote.findByIdAndDelete(id);
};
