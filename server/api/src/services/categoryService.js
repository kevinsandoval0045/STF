/**
 * Category Service — Business Logic Layer.
 */
export class CategoryService {
    constructor(categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    /**
     * Get all categories as a nested tree (parent → children).
     */
    async getAllCategories() {
        return this.categoryRepository.findAllWithChildren();
    }

    /**
     * Get a category by slug.
     */
    async getCategoryBySlug(slug) {
        const category = await this.categoryRepository.findBySlug(slug);

        if (!category) {
            const error = new Error('Category not found');
            error.statusCode = 404;
            error.code = 'NOT_FOUND';
            throw error;
        }

        return category;
    }
}
