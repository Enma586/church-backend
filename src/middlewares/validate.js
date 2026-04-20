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

    req[source] = result.data;
    next();
};
