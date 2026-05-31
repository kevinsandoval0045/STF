import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { optionalAuth } from '../middlewares/authMiddleware.js';
import prisma from '../prisma.js';
import { emailService } from '../container.js';

const returnSchema = z.object({
    orderId: z.string().uuid('Invalid order ID'),
    trackingToken: z.string().uuid('Invalid tracking token').optional(),
    type: z.enum(['DEFECTIVE_PRODUCT', 'CHANGE_OF_MIND', 'WRONG_PRODUCT', 'OTHER']),
    description: z.string().min(10, 'Please provide a description (at least 10 characters)'),
    photoUrls: z.array(z.string().url()).optional().default([]),
});

/**
 * Build Return Request router.
 *
 * POST /api/v1/returns
 * - Registered order: JWT owner required.
 * - Guest order: matching trackingToken required.
 */
export function createReturnRouter({
    prismaClient = prisma,
    emailServiceClient = emailService,
    optionalAuthMiddleware = optionalAuth,
    asyncHandlerMiddleware = asyncHandler,
} = {}) {
    const router = Router();

    router.post('/', optionalAuthMiddleware, asyncHandlerMiddleware(async (req, res) => {
        const data = returnSchema.parse(req.body);

        const existingOrder = await prismaClient.order.findUnique({
            where: { id: data.orderId },
            select: {
                id: true,
                userId: true,
                trackingToken: true,
            },
        });

        if (!existingOrder) {
            const error = new Error('Order not found');
            error.statusCode = 404;
            throw error;
        }

        // Authorization model:
        // - Registered order (userId set): only the owner can request returns (JWT required).
        // - Guest order (userId null): request must include matching trackingToken.
        if (existingOrder.userId) {
            if (!req.user?.userId) {
                const error = new Error('Debes iniciar sesión para solicitar la devolución de este pedido');
                error.statusCode = 401;
                throw error;
            }
            if (req.user.userId !== existingOrder.userId) {
                const error = new Error('No tienes permiso para solicitar la devolución de este pedido');
                error.statusCode = 403;
                throw error;
            }
        } else {
            const providedToken = String(data.trackingToken || '').trim();
            if (!providedToken || providedToken !== existingOrder.trackingToken) {
                const error = new Error(
                    'Token de seguimiento inválido para solicitar la devolución de este pedido'
                );
                error.statusCode = 403;
                throw error;
            }
        }

        const { order, returnRequest } = await prismaClient.$transaction(async (tx) => {
            const orderInTx = await tx.order.findUnique({
                where: { id: data.orderId },
                include: { returnRequest: true },
            });

            if (!orderInTx) {
                const error = new Error('Order not found');
                error.statusCode = 404;
                throw error;
            }

            // Only DELIVERED or COMPLETED orders can be returned
            if (!['DELIVERED', 'COMPLETED'].includes(orderInTx.status)) {
                const error = new Error(
                    `Cannot request return for an order with status: ${orderInTx.status}. ` +
                    'Only DELIVERED or COMPLETED orders are eligible.'
                );
                error.statusCode = 400;
                throw error;
            }

            // Check if a return request already exists
            if (orderInTx.returnRequest) {
                const error = new Error('A return request already exists for this order');
                error.statusCode = 409;
                throw error;
            }

            const createdReturn = await tx.returnRequest.create({
                data: {
                    orderId: data.orderId,
                    type: data.type,
                    description: data.description,
                    photoUrls: data.photoUrls,
                },
            });

            // Guard against race conditions where another process changes order status.
            const updatedOrder = await tx.order.updateMany({
                where: {
                    id: data.orderId,
                    status: { in: ['DELIVERED', 'COMPLETED'] },
                },
                data: { status: 'RETURN_REQUESTED' },
            });

            if (updatedOrder.count === 0) {
                const error = new Error(
                    'No se pudo solicitar la devolución porque el estado del pedido cambió. Intenta nuevamente.'
                );
                error.statusCode = 409;
                throw error;
            }

            await tx.orderHistory.create({
                data: {
                    orderId: data.orderId,
                    oldStatus: orderInTx.status,
                    newStatus: 'RETURN_REQUESTED',
                    note: `Return requested: ${data.type}`,
                },
            });

            return { order: orderInTx, returnRequest: createdReturn };
        });

        res.status(201).json({
            message: 'Return request created successfully',
            returnRequest: {
                id: returnRequest.id,
                status: returnRequest.status,
                type: returnRequest.type,
            },
        });

        // Notify customer (fire-and-forget — after response is sent)
        emailServiceClient.sendReturnRequestReceived({
            email:       order.email,
            firstName:   order.firstName,
            orderNumber: order.orderNumber,
            returnType:  data.type,
            description: data.description,
        });
    }));

    return router;
}

const router = createReturnRouter();

export default router;
