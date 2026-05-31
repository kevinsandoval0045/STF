/**
 * Order Repository — Data Access Layer.
 * Handles database queries for orders, order items, and order history.
 */
export class OrderRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }

    /**
     * Create a new order with its items and initial history entry.
     * Uses a Prisma transaction to ensure data consistency.
     */
    async create(orderData, items) {
        return this.prisma.$transaction(async (tx) => {
            // 1. Decrement stock and increment salesCount atomically with a conditional update.
            //    The condition stockQuantity >= item.quantity prevents overselling under concurrency.
            for (const item of items) {
                const updated = await tx.product.updateMany({
                    where: {
                        id: item.productId,
                        active: true,
                        stockQuantity: { gte: item.quantity },
                    },
                    data: {
                        stockQuantity: { decrement: item.quantity },
                        salesCount:    { increment: item.quantity },
                    },
                });

                if (updated.count === 0) {
                    const product = await tx.product.findUnique({
                        where: { id: item.productId },
                        select: { name: true, active: true, stockQuantity: true },
                    });

                    let error;
                    if (!product) {
                        error = new Error(`Product not found: ${item.productId}`);
                        error.code = 'INVALID_PRODUCT';
                    } else if (!product.active) {
                        error = new Error(`Product is not available: ${product.name}`);
                        error.code = 'PRODUCT_UNAVAILABLE';
                    } else {
                        error = new Error(`Insufficient stock for: ${product.name}`);
                        error.code = 'INSUFFICIENT_STOCK';
                    }

                    error.statusCode = 400;
                    throw error;
                }
            }

            // 2. Create the order with its items and initial history entry
            const order = await tx.order.create({
                data: {
                    ...orderData,
                    items: {
                        create: items,
                    },
                    history: {
                        create: {
                            newStatus: 'PENDING',
                            note: 'Order placed',
                        },
                    },
                },
                include: {
                    items: true,
                    history: true,
                },
            });

            return order;
        });
    }

    /**
     * Find an order by its tracking token (for public order tracking).
     */
    async findByTrackingToken(token) {
        return this.prisma.order.findUnique({
            where: { trackingToken: token },
            include: {
                items: true,
                history: { orderBy: { createdAt: 'asc' } },
            },
        });
    }

    /**
     * Find an order by its ID.
     */
    async findById(id) {
        return this.prisma.order.findUnique({
            where: { id },
            include: {
                items: true,
                history: { orderBy: { createdAt: 'asc' } },
            },
        });
    }

    /**
     * Update order status and add a history entry.
     */
    async updateStatus(id, oldStatus, newStatus, note = null) {
        return this.prisma.$transaction(async (tx) => {
            const order = await tx.order.update({
                where: { id },
                data: { status: newStatus },
            });

            await tx.orderHistory.create({
                data: {
                    orderId: id,
                    oldStatus,
                    newStatus,
                    note,
                },
            });

            return order;
        });
    }

    /**
     * Atomically transition status only if the current status matches expectedStatus.
     * Returns true if the status changed, false when already changed by another process.
     */
    async updateStatusIfCurrent(id, expectedStatus, newStatus, note = null) {
        return this.prisma.$transaction(async (tx) => {
            const result = await tx.order.updateMany({
                where: { id, status: expectedStatus },
                data: { status: newStatus },
            });

            if (result.count === 0) {
                return false;
            }

            await tx.orderHistory.create({
                data: {
                    orderId: id,
                    oldStatus: expectedStatus,
                    newStatus,
                    note,
                },
            });

            return true;
        });
    }

    /**
     * Update payment metadata for an order.
     * Used to persist payment attempt outcomes from Mercado Pago.
     *
     * @param {string} id
     * @param {Object} payload
     * @param {string|undefined} payload.paymentStatus
     * @param {string|number|undefined} payload.paymentId
     */
    async updatePaymentState(id, { paymentStatus = undefined, paymentId = undefined } = {}) {
        const data = {};

        if (paymentStatus !== undefined) {
            data.paymentStatus = paymentStatus;
        }

        if (paymentId !== undefined && paymentId !== null && paymentId !== '') {
            data.paymentId = String(paymentId);
        }

        if (Object.keys(data).length === 0) {
            return this.findById(id);
        }

        return this.prisma.order.update({
            where: { id },
            data,
            include: {
                items: true,
                history: { orderBy: { createdAt: 'asc' } },
            },
        });
    }

    /**
     * Find all orders for a registered user, most recent first.
     * Includes items with product slug for "Ver producto" links.
     */
    async findByUserId(userId) {
        return this.prisma.order.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    include: {
                        product: {
                            select: { slug: true, imageUrl: true },
                        },
                    },
                },
            },
        });
    }
}
