import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/authMiddleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { orderService, paymentService } from '../container.js';

/**
 * Payment Routes — card processing for the Payment Brick (no-redirect flow).
 *
 * POST /api/v1/payments/process
 *
 * Called by CheckoutPage's onSubmit callback when the user clicks "Pagar"
 * with a credit/debit card. The Payment Brick never sends raw card numbers —
 * it sends a short-lived tokenized representation that we forward to MP.
 *
 * Flow:
 *   Browser → POST /api/v1/payments/process (formData + orderId)
 *   Backend  → fetches Order from DB (authoritative amount)
 *   Backend  → calls paymentService.processCardPayment()
 *   MP API   → creates payment, returns status
 *   Backend  → returns { status, paymentId } to the Brick
 *   Brick    → shows success UI or error UI
 *   MP       → also fires a webhook → handleSinglePayment → PENDING → PROCESSING
 */
const router = Router();

// Validation schema
const processPaymentSchema = z.object({
    orderId: z.string().uuid('Invalid order ID'),
    formData: z.record(z.unknown()),   // Opaque brick payload — we forward it to MP
});

/**
 * POST /api/v1/payments/process
 *
 * Requires the user to be authenticated (same user who placed the order).
 * Amount is taken from the Order record in DB — never trusted from the client.
 */
router.post(
    '/process',
    authenticate,
    asyncHandler(async (req, res) => {
        const { orderId, formData } = processPaymentSchema.parse(req.body);

        // 1. Fetch the order to get the authoritative amount
        //    This also validates that the order exists.
        const order = await orderService.getOrderById(orderId);

        if (!order) {
            return res.status(404).json({ error: { message: 'Pedido no encontrado' } });
        }

        // 2. Security: only the order's owner can pay for it
        if (order.userId && order.userId !== req.user.userId) {
            return res.status(403).json({ error: { message: 'No tienes permiso para pagar este pedido' } });
        }

        // 3. Prevent re-payment: only PENDING orders can be paid
        if (order.status !== 'PENDING') {
            return res.status(400).json({
                error: { message: `Este pedido ya fue procesado (estado: ${order.status})` },
            });
        }

        // 4. Process payment via SDK (amount comes from DB, not from client)
        const result = await paymentService.processCardPayment({
            formData,
            amount: Number(order.totalAmount),
            orderId: order.id,
        });

        // 5. Return the payment status to the Payment Brick.
        //    The brick uses this to show success/error UI.
        //    The actual order status update happens via webhook (handleSinglePayment).
        res.json({
            status: result.status,
            paymentId: result.paymentId,
            statusDetail: result.statusDetail,
        });
    })
);

export default router;
