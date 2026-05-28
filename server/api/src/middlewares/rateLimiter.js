import rateLimit from 'express-rate-limit';

/**
 * API Rate Limiter.
 * Limits each IP to 100 requests per 15-minute window.
 * Protects the API from abuse and brute-force attacks.
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,                  // limit each IP to 100 requests per window
    standardHeaders: true,     // return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,      // disable the `X-RateLimit-*` headers
    message: {
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later.',
        },
    },
});

/**
 * Auth Rate Limiter — stricter limit for login/register endpoints.
 * Limits each IP to 10 attempts per 15-minute window.
 * Prevents brute-force password attacks.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,                   // only 10 login/register attempts per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: {
            code: 'TOO_MANY_AUTH_ATTEMPTS',
            message: 'Demasiados intentos. Por favor espera 15 minutos antes de intentar nuevamente.',
        },
    },
});
