/**
 * @file src/middlewares/validate.js
 * @description Middleware de validación con Zod 4 + Express 5.
 */

import { AppError } from '../utils/AppError.js';

/**
 * @param {import('zod').ZodSchema} schema
 * @param {'body'|'query'|'params'} source
 * @returns {import('express').RequestHandler}
 */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    // Zod 4: usar result.error.message que ya viene formateado
    const message = result.error.message ?? 'Datos inválidos';
    const err = new AppError(message, 400);
    return next(err);
  }

  // Mutar en lugar de reasignar (req.query y req.params son read-only en Express)
  Object.keys(req[source]).forEach((key) => delete req[source][key]);
  Object.assign(req[source], result.data);

  next();
};