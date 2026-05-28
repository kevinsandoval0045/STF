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
            // 1. Decrement stock and increment salesCount for each item atomically.
            //    This prevents overselling: if stockQuantity would go negative,
            //    Prisma's check constraint raises an error and rolls back the entire transaction.
            for (const item of items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stockQuantity: { decrement: item.quantity },
                        salesCount:    { increment: item.quantity },
                    },
                });
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
