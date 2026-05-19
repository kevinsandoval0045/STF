import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { categoryController } from '../container.js';

/**
 * Category Routes.
 * GET /api/v1/categories — List all categories (with subcategories)
 */
const router = Router();

router.get('/', asyncHandler(categoryController.getAll));

export default router;
