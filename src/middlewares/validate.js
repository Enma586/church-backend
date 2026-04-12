import Joi from 'joi';

/**
 * @description Generic Joi validation middleware.
 * Validates req.body, req.params, or req.query and replaces
 * the target with sanitized values (applies defaults).
 *
 * Usage:
 *   router.get('/', validate(querySchema, 'query'), controller)
 *   router.post('/', validate(createSchema, 'body'), controller)
 *   router.put('/:id', validate(updateSchema, 'body'), controller)
 */
export const validate = (schema, source = 'body') => (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
        abortEarly: false,
        stripUnknown: true
    });

    if (error) {
        return res.status(400).json({
            errors: error.details.map(d => d.message)
        });
    }

    req[source] = value;
    next();
};
