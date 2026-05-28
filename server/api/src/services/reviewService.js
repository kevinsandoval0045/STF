/**
 * Review Service — Business Logic Layer.
 * Handles validation, authorization checks, and average rating calculation.
 */
export class ReviewService {
    constructor(reviewRepository, productRepository) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
    }

    /**
     * Get all reviews for a product by its slug.
     * Also computes average rating and review count.
     */
    async getByProductSlug(slug) {
        const product = await this.productRepository.findBySlug(slug);
        if (!product) {
            const err = new Error('Producto no encontrado');
            err.statusCode = 404;
            throw err;
        }

        const reviews = await this.reviewRepository.findByProductId(product.id);

        const count = reviews.length;
        const average =
            count > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / count
                : null;

        return { reviews, count, average };
    }

    /**
     * Create a review for a product.
     * Requires the user to have a DELIVERED/COMPLETED order containing the product.
     * Only one review per user per product is allowed.
     */
    async create(slug, userId, { rating, content }) {
        // Validate input
        const parsedRating = Number(rating);
        if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
            const err = new Error('La calificación debe ser un número entre 1 y 5');
            err.statusCode = 400;
            throw err;
        }
        if (!content || content.trim().length === 0) {
            const err = new Error('El contenido de la reseña no puede estar vacío');
            err.statusCode = 400;
            throw err;
        }

        // Look up product
        const product = await this.productRepository.findBySlug(slug);
        if (!product) {
            const err = new Error('Producto no encontrado');
            err.statusCode = 404;
            throw err;
        }

        // Check purchase
        const hasPurchased = await this.reviewRepository.hasUserPurchasedProduct(userId, product.id);
        if (!hasPurchased) {
            const err = new Error('Solo los clientes que han comprado este producto pueden dejar una reseña');
            err.statusCode = 403;
            throw err;
        }

        // Check duplicate
        const alreadyReviewed = await this.reviewRepository.hasUserReviewedProduct(userId, product.id);
        if (alreadyReviewed) {
            const err = new Error('Ya dejaste una reseña para este producto');
            err.statusCode = 409;
            throw err;
        }

        return this.reviewRepository.create({
            productId: product.id,
            userId,
            rating: parsedRating,
            content: content.trim(),
        });
    }
}
