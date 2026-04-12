import jwt from 'jsonwebtoken';
import User from '../models/members/User.js';

export const auth = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            const error = new Error('No se proporcionó token de autenticación');
            error.statusCode = 401;
            throw error;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            const error = new Error('Token inválido - usuario no encontrado');
            error.statusCode = 401;
            throw error;
        }

        if (!user.isActive) {
            const error = new Error('Tu cuenta ha sido desactivada');
            error.statusCode = 401;
            throw error;
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }

        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        }

        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: err.message
        });
    }
};
