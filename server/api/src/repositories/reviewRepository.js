/**
 * Review Repository — Data Access Layer.
 * Handles all database queries related to product reviews.
 */
export class ReviewRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }

    /**
     * Find all reviews for a given product (by productId), newest first.
     */
    async findByProductId(productId) {
        return this.prisma.review.findMany({
            where: { productId },
            include: {
                user: { select: { firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Create a new review.
     */
    async create({ productId, userId, rating, content }) {
        return this.prisma.review.create({
            data: { productId, userId, rating, content },
            include: {
                user: { select: { firstName: true, lastName: true } },
            },
        });
    }

    /**
     * Check whether a user has a DELIVERED or COMPLETED order
     * that contains the given product.
     */
    async hasUserPurchasedProduct(userId, productId) {
        const count = await this.prisma.order.count({
            where: {
                userId,
                status: { in: ['DELIVERED', 'COMPLETED'] },
                items: { some: { productId } },
            },
        });
        return count > 0;
    }

    /**
     * Check whether a user has already reviewed this product.
     */
    async hasUserReviewedProduct(userId, productId) {
        const review = await this.prisma.review.findUnique({
            where: { productId_userId: { productId, userId } },
            select: { id: true },
        });
        return !!review;
    }
}
