import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/authMiddleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { orderService, paymentService } from '../container.js';

// Validation schema
const processPaymentSchema = z.object({
    orderId: z.string().uuid('Invalid order ID'),
    formData: z.record(z.unknown()),   // Opaque brick payload — we forward it to MP
});

/**
 * Build Payment routes (card processing for Payment Brick no-redirect flow).
 *
 * POST /api/v1/payments/process
 */
export function createPaymentRouter({
    orderServiceClient = orderService,
    paymentServiceClient = paymentService,
    authenticateMiddleware = authenticate,
    asyncHandlerMiddleware = asyncHandler,
} = {}) {
    const router = Router();

    router.post(
        '/process',
        authenticateMiddleware,
        asyncHandlerMiddleware(async (req, res) => {
            const { orderId, formData } = processPaymentSchema.parse(req.body);

            // 1. Fetch the order to get the authoritative amount
            const order = await orderServiceClient.getOrderById(orderId);

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
            const result = await paymentServiceClient.processCardPayment({
                formData,
                amount: Number(order.totalAmount),
                orderId: order.id,
            });

            // Persist raw payment outcome for profile/admin filtering.
            try {
                await orderServiceClient.registerPaymentAttempt(order.id, {
                    status: result.status,
                    paymentId: result.paymentId,
                });
            } catch (err) {
                console.error(
                    `⚠️ [Payment/process] Could not persist payment attempt for order ${order.id}:`,
                    err.message
                );
            }

            // Fast-path for card approvals. Webhook still arrives as idempotent backup path.
            if (result.status === 'approved') {
                orderServiceClient.confirmPaidOrder(order.id, String(result.paymentId)).catch((err) => {
                    console.error(
                        `❌ [Payment/process] Could not confirm paid order ${order.id} after approved payment ${result.paymentId}:`,
                        err.message
                    );
                });
            }

            res.json({
                status: result.status,
                paymentId: result.paymentId,
                statusDetail: result.statusDetail,
            });
        })
    );

    return router;
}

const router = createPaymentRouter();

export default router;
