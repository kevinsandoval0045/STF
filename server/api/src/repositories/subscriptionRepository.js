/**
 * Subscription Repository — Data Access Layer.
 * All Prisma queries for Subscription and SubscriptionPayment models.
 */
export class SubscriptionRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }

    /**
     * Create a new subscription.
     */
    async create(data) {
        return this.prisma.subscription.create({
            data,
            include: { product: true },
        });
    }

    /**
     * Find subscription by ID with product and payments.
     */
    async findById(id) {
        return this.prisma.subscription.findUnique({
            where: { id },
            include: { product: true, payments: { orderBy: { createdAt: 'desc' } } },
        });
    }

    /**
     * Find subscription by Mercado Pago preapproval ID (for webhook processing).
     */
    async findByMpPreapprovalId(mpId) {
        return this.prisma.subscription.findUnique({
            where: { mpPreapprovalId: mpId },
            include: { product: true },
        });
    }

    /**
     * List all subscriptions for a user.
     */
    async findByUserId(userId) {
        return this.prisma.subscription.findMany({
            where: { userId },
            include: { product: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Update subscription status and optionally nextBillingDate.
     */
    async updateStatus(id, status, nextBillingDate = undefined) {
        const data = { status };
        if (nextBillingDate !== undefined) {
            data.nextBillingDate = nextBillingDate;
        }
        return this.prisma.subscription.update({
            where: { id },
            data,
        });
    }

    /**
     * Update mpPreapprovalId after MP preapproval is created.
     */
    async updateMpPreapprovalId(id, mpPreapprovalId) {
        return this.prisma.subscription.update({
            where: { id },
            data: { mpPreapprovalId },
        });
    }

    /**
     * Record a recurring payment event from MP webhook.
     */
    async createPayment(data) {
        return this.prisma.subscriptionPayment.create({ data });
    }

    /**
     * Find subscriptions due for reminder (nextBillingDate <= cutoffDate, status AUTHORIZED).
     */
    async findDueForReminder(cutoffDate) {
        return this.prisma.subscription.findMany({
            where: {
                status: 'AUTHORIZED',
                nextBillingDate: { lte: cutoffDate },
            },
            include: { product: true, user: true },
        });
    }

    /**
     * Count prior subscriptions a user has had for the same product.
     * Only counts AUTHORIZED or CANCELLED (i.e. previously active) subscriptions,
     * excluding PENDING ones that were never confirmed.
     * Used to determine if the 5% loyalty discount applies.
     *
     * @param {string} userId
     * @param {string} productId
     * @returns {number}
     */
    async countPriorSubscriptions(userId, productId) {
        return this.prisma.subscription.count({
            where: {
                userId,
                productId,
                status: { in: ['AUTHORIZED', 'CANCELLED'] },
            },
        });
    }
}
