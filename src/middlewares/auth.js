import jwt from 'jsonwebtoken';
import User from '../models/members/User.js';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

export const auth = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            throw new AppError('No se proporcionó token de autenticación', 401);
        }

        const decoded = jwt.verify(token, env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('+password +isActive');

        if (!user) {
            throw new AppError('Token inválido - usuario no encontrado', 401);
        }

        if (!user.isActive) {
            throw new AppError('Tu cuenta ha sido desactivada', 401);
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return next(new AppError('Token inválido', 401));
        }

        if (err.name === 'TokenExpiredError') {
            return next(new AppError('Token expirado', 401));
        }

        next(err);
    }
};
