import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { subscriptionController } from '../container.js';

/**
 * Subscription Routes — all require authentication.
 *
 * POST /api/v1/subscriptions              → Create subscription
 * GET  /api/v1/subscriptions/my           → List user's subscriptions
 * POST /api/v1/subscriptions/:id/cancel   → Cancel a subscription
 */
const router = Router();

router.post('/', authenticate, asyncHandler(subscriptionController.create));
router.get('/my', authenticate, asyncHandler(subscriptionController.getMySubscriptions));
router.post('/:id/cancel', authenticate, asyncHandler(subscriptionController.cancel));

export default router;
