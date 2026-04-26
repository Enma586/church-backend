/**
 * @file src/middlewares/validate.js
 * @description Middleware to validate incoming request data using Zod schemas.
 * Safely mutates request objects to prevent TypeError with Express getters.
 */

import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

export const validate = (schema, source = 'body') => (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
        const messages = result.error.issues.map(i => i.message);
        const err = new AppError(messages.join(', '), 400);
        err.details = messages;
        return next(err);
    }

    // Fix for TypeError: Mutate the existing object instead of reassigning it.
    // This is required because req.query and req.params have read-only getters in Express.
    Object.keys(req[source]).forEach(key => delete req[source][key]);
    Object.assign(req[source], result.data);

    next();
};