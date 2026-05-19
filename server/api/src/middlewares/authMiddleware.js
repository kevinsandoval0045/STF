import jwt from 'jsonwebtoken';
import { config } from '../config.js';

/**
 * Authentication middleware — verifies JWT from Authorization header.
 * Sets req.user = { userId, email } on success.
 * Returns 401 if token is missing or invalid.
 */
export function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: { message: 'Acceso no autorizado. Por favor inicia sesión.' },
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded; // { userId, email, iat, exp }
        next();
    } catch (err) {
        return res.status(401).json({
            error: { message: 'Token inválido o expirado. Por favor inicia sesión nuevamente.' },
        });
    }
}

/**
 * Optional authentication — same as authenticate but does NOT fail
 * if no token is provided. Useful for routes that work for both
 * guests and authenticated users.
 */
export function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.user = null;
        return next();
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded;
    } catch {
        req.user = null;
    }

    next();
}
