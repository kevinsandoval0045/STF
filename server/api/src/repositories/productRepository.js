/**
 * Product Repository — Data Access Layer.
 * Handles all database queries related to products.
 * Receives a PrismaClient instance via constructor injection.
 */
export class ProductRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }

    /**
     * Find all active products, optionally filtered by categoryId or brandId.
     */
    async findAll({ categoryId, brandId } = {}) {
        const where = { active: true };

        if (categoryId) where.categoryId = categoryId;
        if (brandId) where.brandId = brandId;

        return this.prisma.product.findMany({
            where,
            include: {
                category: { select: { id: true, name: true, slug: true } },
                brand: { select: { id: true, name: true, slug: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Find a single product by its slug. Includes images, category, and brand.
     */
    async findBySlug(slug) {
        return this.prisma.product.findUnique({
            where: { slug },
            include: {
                images: { orderBy: { sortOrder: 'asc' } },
                category: { select: { id: true, name: true, slug: true } },
                brand: { select: { id: true, name: true, slug: true, logoUrl: true } },
            },
        });
    }

    /**
     * Find a product by its ID (used internally by order service).
     */
    async findById(id) {
        return this.prisma.product.findUnique({ where: { id } });
    }

    /**
     * Increment the view counter for a product.
     */
    async incrementViewCount(id) {
        return this.prisma.product.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        });
    }
}
