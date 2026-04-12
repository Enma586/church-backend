import { Municipality } from '../../models/index.js';
import { getPagination, getPagingData } from '../../utils/pagination.js';

/**
 * Creates a new municipality linked to a department.
 * @param {Object} data - Municipality fields (name, departmentId, code).
 * @returns {Promise<Document>} The created municipality document.
 */
export const createMunicipality = async (data) => {
    return await Municipality.create(data);
};

/**
 * Retrieves a paginated list of municipalities with optional filtering by name and department.
 * Uses a single aggregation pipeline with $facet to fetch data and total count efficiently.
 * @param {Object} query - Query parameters from the request.
 * @param {number} [query.page=1] - Current page number (1-based).
 * @param {number} [query.limit=10] - Number of items per page.
 * @param {string} [query.search] - Case-insensitive search term to match against municipality name.
 * @param {string} [query.departmentId] - Filter municipalities belonging to a specific department.
 * @returns {Promise<{data: Document[], pagination: Object}>} Paginated result with metadata.
 */
export const findAllMunicipalities = async (query) => {
    const { page, limit, search, departmentId } = query;
    const { skip, limit: pageSize } = getPagination(page, limit);

    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (departmentId) filter.departmentId = departmentId;

    const { docs, totalDocs } = await Municipality.aggregate([
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
 * Finds a single municipality by its ObjectId and populates the parent department.
 * @param {string} id - The municipality's ObjectId.
 * @returns {Promise<Document|null>} The municipality document with department populated (name, isoCode), or null if not found.
 */
export const findMunicipalityById = async (id) => {
    return await Municipality.findById(id).populate('departmentId', 'name isoCode');
};

/**
 * Updates an existing municipality by its ObjectId.
 * @param {string} id - The municipality's ObjectId.
 * @param {Object} data - Fields to update (name, departmentId, code).
 * @returns {Promise<Document|null>} The updated municipality document, or null if not found.
 */
export const updateMunicipality = async (id, data) => {
    return await Municipality.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

/**
 * Deletes a municipality by its ObjectId.
 * @param {string} id - The municipality's ObjectId.
 * @returns {Promise<Document|null>} The deleted municipality document, or null if not found.
 */
export const removeMunicipality = async (id) => {
    return await Municipality.findByIdAndDelete(id);
};
