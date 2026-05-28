import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { productController, reviewController } from '../container.js';
import { authenticate } from '../middlewares/authMiddleware.js';

/**
 * Product Routes.
 * GET  /api/v1/products                   — List all products (with optional filters)
 * GET  /api/v1/products/:slug             — Get product detail by slug
 * GET  /api/v1/products/:slug/reviews     — Get reviews for a product (public)
 * POST /api/v1/products/:slug/reviews     — Create a review (auth + verified buyer)
 */
const router = Router();

router.get('/', asyncHandler(productController.getAll));
router.get('/id/:id', asyncHandler(productController.getById));  // must be before /:slug
router.get('/:slug', asyncHandler(productController.getBySlug));
router.get('/:slug/reviews', asyncHandler(reviewController.getByProduct));
router.post('/:slug/reviews', authenticate, asyncHandler(reviewController.create));

export default router;
