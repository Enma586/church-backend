import Joi from 'joi';
import { AppError } from '../utils/AppError.js';

export const validate = (schema, source = 'body') => (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
        abortEarly: false,
        stripUnknown: true
    });

    if (error) {
        const messages = error.details.map(d => d.message);
        const err = new AppError(messages.join(', '), 400);
        err.details = messages;
        return next(err);
    }

    req[source] = value;
    next();
};
