/**
 * Product Service — Business Logic Layer.
 * Contains the business rules for products.
 * Receives repositories via constructor injection (no HTTP knowledge).
 */
export class ProductService {
    constructor(productRepository, categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    /**
     * Get all products, optionally filtered by category or brand.
     */
    async getAllProducts(filters = {}) {
        const products = await this.productRepository.findAll(filters);

        // Transform Decimal fields to numbers for JSON response
        return products.map(this.#formatProduct);
    }

    /**
     * Get a single product by slug. Increments the view counter.
     * Throws a 404 error if the product is not found.
     */
    async getProductBySlug(slug) {
        const product = await this.productRepository.findBySlug(slug);

        if (!product) {
            const error = new Error('Product not found');
            error.statusCode = 404;
            error.code = 'NOT_FOUND';
            throw error;
        }

        // Increment view count (fire-and-forget, don't await)
        this.productRepository.incrementViewCount(product.id).catch(() => { });

        return this.#formatProduct(product);
    }

    /**
     * Get a product by ID (internal use, e.g. for order validation).
     */
    async getProductById(id) {
        return this.productRepository.findById(id);
    }

    /**
     * Format Prisma Decimal fields to plain numbers for JSON serialization.
     */
    #formatProduct(product) {
        return {
            ...product,
            price: Number(product.price),
            discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
            weight: Number(product.weight),
        };
    }
}
