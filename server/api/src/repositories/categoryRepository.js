/**
 * Category Repository — Data Access Layer.
 * Handles database queries for categories.
 */
export class CategoryRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }

    /**
     * Find all top-level categories (no parent) with their subcategories.
     * Returns a nested tree structure.
     */
    async findAllWithChildren() {
        return this.prisma.category.findMany({
            where: { active: true, parentId: null },
            include: {
                children: {
                    where: { active: true },
                    orderBy: { sortOrder: 'asc' },
                },
            },
            orderBy: { sortOrder: 'asc' },
        });
    }

    /**
     * Find a single category by slug.
     */
    async findBySlug(slug) {
        return this.prisma.category.findUnique({
            where: { slug },
            include: {
                children: { where: { active: true }, orderBy: { sortOrder: 'asc' } },
            },
        });
    }
}
