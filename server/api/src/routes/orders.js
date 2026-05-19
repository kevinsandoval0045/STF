import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate, optionalAuth } from '../middlewares/authMiddleware.js';
import { orderController } from '../container.js';

/**
 * Order Routes.
 * POST /api/v1/orders/checkout              — Create order from cart (guest or authenticated)
 * GET  /api/v1/orders/track/:token          — Track order by public token
 * GET  /api/v1/orders/receipt/:token        — Download PDF receipt by public token
 * GET  /api/v1/orders/my-orders             — Get order history for authenticated user
 * POST /api/v1/orders/:orderId/cancel       — Cancel a PENDING order (authenticated users only)
 * POST /api/v1/orders/cancel-by-token/:token — Cancel a PENDING guest order by tracking token
 */
const router = Router();

// optionalAuth captures userId from JWT if present (guest checkout still works)
router.post('/checkout', optionalAuth, asyncHandler(orderController.checkout));
router.get('/track/:token', asyncHandler(orderController.track));
router.get('/receipt/:token', asyncHandler(orderController.downloadReceipt));
router.get('/my-orders', authenticate, asyncHandler(orderController.getMyOrders));

// Security: cancel requires authentication — ownership is verified in the service layer.
// Only the user who placed the order can cancel it.
router.post('/:orderId/cancel', authenticate, asyncHandler(orderController.cancel));

// Guest cancellation: cancel a guest order using its public tracking token.
// No JWT required, but the tracking token acts as the secret credential.
router.post('/cancel-by-token/:token', asyncHandler(orderController.cancelByToken));

export default router;
