/**
 * Brand Repository — Data Access Layer.
 * Handles database queries for brands.
 */
export class BrandRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }

    /**
     * Find all active brands, sorted by sortOrder.
     */
    async findAll() {
        return this.prisma.brand.findMany({
            where: { active: true },
            orderBy: { sortOrder: 'asc' },
        });
    }

    /**
     * Find a single brand by slug.
     */
    async findBySlug(slug) {
        return this.prisma.brand.findUnique({ where: { slug } });
    }
}
