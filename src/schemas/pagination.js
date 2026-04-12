import Joi from 'joi';

/**
 * @description Reusable Joi pagination fields.
 * Compose into any query schema with spread: ...paginationFields.
 */
export const paginationFields = {
    page: Joi.number()
        .integer()
        .min(1)
        .default(1),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10)
};

/**
 * @description Standalone pagination schema for generic list endpoints.
 */
export const paginationSchema = Joi.object(paginationFields);
