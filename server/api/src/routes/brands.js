import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { brandController } from '../container.js';

/**
 * Brand Routes.
 * GET /api/v1/brands — List all brands
 */
const router = Router();

router.get('/', asyncHandler(brandController.getAll));

export default router;
