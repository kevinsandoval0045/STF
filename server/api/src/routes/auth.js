import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { authController } from '../container.js';

/**
 * Auth Routes.
 * POST /api/v1/auth/register   — Create new user account
 * POST /api/v1/auth/login      — Login with email/password
 * GET  /api/v1/auth/profile    — Get current user profile (requires JWT)
 * PUT  /api/v1/auth/profile    — Update address / phone (requires JWT)
 */
const router = Router();

// authLimiter: max 10 attempts per IP per 15 min — brute-force protection
router.post('/register', authLimiter, asyncHandler(authController.register));
router.post('/login',    authLimiter, asyncHandler(authController.login));
router.get('/profile',  authenticate, asyncHandler(authController.getProfile));
router.put('/profile',  authenticate, asyncHandler(authController.updateProfile));

export default router;
