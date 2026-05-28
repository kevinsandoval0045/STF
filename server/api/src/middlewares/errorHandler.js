import { config } from '../config.js';

/**
 * Global Error Handler Middleware.
 * Catches all errors forwarded by controllers/middlewares and
 * returns a consistent JSON error response to the client.
 */
export const errorHandler = (err, req, res, _next) => {
    // In development, log the full stack trace for easier debugging (B-2)
    if (config.nodeEnv !== 'production') {
        console.error(err.stack);
    } else {
        console.error('❌ Error:', err.message);
    }

    // Zod validation errors
    if (err.name === 'ZodError') {
        return res.status(400).json({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid input data',
                details: err.errors,
            },
        });
    }

    // Prisma known request errors (e.g. unique constraint, not found)
    if (err.code === 'P2002') {
        return res.status(409).json({
            error: {
                code: 'DUPLICATE_ENTRY',
                message: 'A record with that value already exists',
            },
        });
    }

    if (err.code === 'P2025') {
        return res.status(404).json({
            error: {
                code: 'NOT_FOUND',
                message: 'The requested resource was not found',
            },
        });
    }

    // Custom application errors (thrown with a statusCode property)
    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 ? 'Internal server error' : err.message;

    res.status(statusCode).json({
        error: {
            code: err.code || 'SERVER_ERROR',
            message,
        },
    });
};
