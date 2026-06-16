import { AppError } from '../utils/AppError.js'

export const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err)
    }

    // ── Sequelize validation errors ──────────────────────────────────
    if (err.name === 'SequelizeValidationError') {
        err.statusCode = 400
        err.message = err.errors.map(e => e.message).join(', ')
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
        err.statusCode = 409
        const field = err.errors?.[0]?.path || 'campo'
        const fieldLabels = {
            memberId: 'Miembro (ya tiene un usuario asignado)',
            username: 'Nombre de usuario',
            email: 'Correo electrónico',
            name: 'Nombre',
            fullName: 'Nombre completo',
            code: 'Código',
        }
        const label = fieldLabels[field] || field
        err.message = `Valor duplicado para: ${label}`
    }

    if (err.name === 'SequelizeForeignKeyConstraintError') {
        err.statusCode = 400
        err.message = 'Error de integridad referencial: el registro referenciado no existe'
    }

    if (err.name === 'SequelizeDatabaseError') {
        err.statusCode = 400
        err.message = `Error de base de datos: ${err.message}`
    }

    const statusCode = err.statusCode || 500

    const response = {
        success: false,
        message: err.message || 'Error interno del servidor',
    }

    if (err.details) {
        response.errors = err.details
    }

    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack
    }

    res.status(statusCode).json(response)
}
