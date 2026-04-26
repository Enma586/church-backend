/**
 * @file src/utils/pagination.js
 * @description Utility functions for calculating database pagination offsets and metadata.
 * Uses strict parsing to ensure MongoDB aggregation stages always receive valid integers.
 */

export const getPagination = (page, limit) => {
    const safeLimit = parseInt(limit, 10) || 10;
    const safePage = parseInt(page, 10) || 1;
    
    const skip = safePage > 0 ? (safePage - 1) * safeLimit : 0;

    return { limit: safeLimit, skip };
};

export const getPagingData = (total, page, limit) => {
    const safeLimit = parseInt(limit, 10) || 10;
    const safePage = parseInt(page, 10) || 1;
    const totalPages = Math.ceil(total / safeLimit);

    return {
        total,
        totalPages,
        currentPage: safePage,
        perPage: safeLimit,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1
    };
};