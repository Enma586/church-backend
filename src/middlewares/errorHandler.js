import { AppError } from '../utils/AppError.js';

export const errorHandler = (err, req, res, next) => {
    // Si los headers ya se enviaron (ej: stream en progreso), delega al manejador por defecto de Express
    if (res.headersSent) {
        return next(err);
    }

    if (err.name === 'CastError') {
        err.statusCode = 400;
        err.message = `ID inválido: ${err.value}`;
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const fieldLabels = {
            memberId: 'Miembro (ya tiene un usuario asignado)',
            username: 'Nombre de usuario',
            email: 'Correo electrónico',
            name: 'Nombre',
            fullName: 'Nombre completo',
        };
        const label = fieldLabels[field] || field;
        err.statusCode = 409;
        err.message = `Valor duplicado para: ${label}`;
    }

    if (err.name === 'ValidationError') {
        err.statusCode = 400;
        err.message = Object.values(err.errors).map(e => e.message).join(', ');
    }

    const statusCode = err.statusCode || 500;

    const response = {
        success: false,
        message: err.message || 'Error interno del servidor',
    };

    if (err.details) {
        response.errors = err.details;
    }

    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};