import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import prisma from '../prisma.js';
import { emailService } from '../container.js';

/**
 * Return Request Routes.
 * POST /api/v1/returns — Create a return request for an order.
 *
 * This is a simpler endpoint so we keep it as a direct route
 * without a full repository/service/controller stack.
 */
const router = Router();

const returnSchema = z.object({
    orderId: z.string().uuid('Invalid order ID'),
    type: z.enum(['DEFECTIVE_PRODUCT', 'CHANGE_OF_MIND', 'WRONG_PRODUCT', 'OTHER']),
    description: z.string().min(10, 'Please provide a description (at least 10 characters)'),
    photoUrls: z.array(z.string().url()).optional().default([]),
});

router.post('/', asyncHandler(async (req, res) => {
    const data = returnSchema.parse(req.body);

    // Verify the order exists and is eligible for return
    const order = await prisma.order.findUnique({
        where: { id: data.orderId },
        include: { returnRequest: true },
    });

    if (!order) {
        const error = new Error('Order not found');
        error.statusCode = 404;
        throw error;
    }

    // Only DELIVERED or COMPLETED orders can be returned
    if (!['DELIVERED', 'COMPLETED'].includes(order.status)) {
        const error = new Error(
            `Cannot request return for an order with status: ${order.status}. ` +
            'Only DELIVERED or COMPLETED orders are eligible.'
        );
        error.statusCode = 400;
        throw error;
    }

    // Check if a return request already exists
    if (order.returnRequest) {
        const error = new Error('A return request already exists for this order');
        error.statusCode = 409;
        throw error;
    }

    // Create the return request
    const returnRequest = await prisma.returnRequest.create({
        data: {
            orderId: data.orderId,
            type: data.type,
            description: data.description,
            photoUrls: data.photoUrls,
        },
    });

    // Update order status
    await prisma.order.update({
        where: { id: data.orderId },
        data: { status: 'RETURN_REQUESTED' },
    });

    // Add history entry
    await prisma.orderHistory.create({
        data: {
            orderId: data.orderId,
            oldStatus: order.status,
            newStatus: 'RETURN_REQUESTED',
            note: `Return requested: ${data.type}`,
        },
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
    emailService.sendReturnRequestReceived({
        email:       order.email,
        firstName:   order.firstName,
        orderNumber: order.orderNumber,
        returnType:  data.type,
        description: data.description,
    });
}));

export default router;
