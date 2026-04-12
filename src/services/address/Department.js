import { Department } from '../../models/index.js';
import { getPagination, getPagingData } from '../../utils/pagination.js';

/**
 * Creates a new department in the database.
 * @param {Object} data - Department fields (name, isoCode).
 * @returns {Promise<Document>} The created department document.
 */
export const createDepartment = async (data) => {
    return await Department.create(data);
};

/**
 * Retrieves a paginated list of departments with optional search filtering.
 * Uses a single aggregation pipeline with $facet to fetch data and total count efficiently.
 * @param {Object} query - Query parameters from the request.
 * @param {number} [query.page=1] - Current page number (1-based).
 * @param {number} [query.limit=10] - Number of items per page.
 * @param {string} [query.search] - Case-insensitive search term to match against department name.
 * @returns {Promise<{data: Document[], pagination: Object}>} Paginated result with metadata.
 */
export const findAllDepartments = async (query) => {
    const { page, limit, search } = query;
    const { skip, limit: pageSize } = getPagination(page, limit);

    const filter = search
        ? { name: { $regex: search, $options: 'i' } }
        : {};

    const { docs, totalDocs } = await Department.aggregate([
        { $match: filter },
        { $sort: { name: 1 } },
        { $facet: {
            metadata: [{ $count: 'total' }],
            data: [{ $skip: skip }, { $limit: pageSize }]
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
 * Finds a single department by its MongoDB ObjectId.
 * @param {string} id - The department's ObjectId.
 * @returns {Promise<Document|null>} The department document, or null if not found.
 */
export const findDepartmentById = async (id) => {
    return await Department.findById(id);
};

/**
 * Updates an existing department by its ObjectId.
 * @param {string} id - The department's ObjectId.
 * @param {Object} data - Fields to update (name, isoCode).
 * @returns {Promise<Document|null>} The updated department document, or null if not found.
 */
export const updateDepartment = async (id, data) => {
    return await Department.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

/**
 * Deletes a department by its ObjectId.
 * @param {string} id - The department's ObjectId.
 * @returns {Promise<Document|null>} The deleted department document, or null if not found.
 */
export const removeDepartment = async (id) => {
    return await Department.findByIdAndDelete(id);
};
