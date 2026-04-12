/**
 * @description Generic pagination helpers.
 * Works with any Mongoose model that uses countDocuments + find + skip + limit.
 */

/**
 * Calculates skip and limit from page/limit values.
 * @param {number} page - Current page number (1-based).
 * @param {number} limit - Items per page.
 * @returns {{ skip: number, limit: number }}
 */
export const getPagination = (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    return { skip, limit };
};

/**
 * Builds the pagination metadata object for API responses.
 * @param {number} total - Total document count.
 * @param {number} page - Current page number.
 * @param {number} limit - Items per page.
 * @returns {object} Pagination metadata.
 */
export const getPagingData = (total, page, limit) => {
    const totalPages = Math.ceil(total / limit);
    return {
        total,
        totalPages,
        currentPage: page,
        perPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
    };
};
