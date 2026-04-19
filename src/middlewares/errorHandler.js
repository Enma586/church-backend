import { AppError } from '../utils/AppError.js';

export const errorHandler = (err, req, res, next) => {
    if (err.name === 'CastError') {
        err.statusCode = 400;
        err.message = `ID inválido: ${err.value}`;
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue).join(', ');
        err.statusCode = 409;
        err.message = `Valor duplicado para: ${field}`;
    }

    if (err.name === 'ValidationError') {
        err.statusCode = 400;
        err.message = Object.values(err.errors).map(e => e.message).join(', ');
    }

    const statusCode = err.statusCode || 500;

    const response = {
        success: false,
        message: err.message || 'Error interno del servidor'
    };

    if (err.details) {
        response.errors = err.details;
    }

    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};
