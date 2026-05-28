/**
 * Review Controller — HTTP Layer.
 * Handles request/response for review endpoints.
 */
export class ReviewController {
    constructor(reviewService) {
        this.reviewService = reviewService;
        this.getByProduct = this.getByProduct.bind(this);
        this.create = this.create.bind(this);
    }

    /**
     * GET /api/v1/products/:slug/reviews
     * Public — anyone can read reviews.
     */
    async getByProduct(req, res) {
        const { slug } = req.params;
        const result = await this.reviewService.getByProductSlug(slug);
        res.json(result);
    }

    /**
     * POST /api/v1/products/:slug/reviews
     * Protected — requires authenticate middleware (sets req.user).
     * Only verified buyers can post a review.
     */
    async create(req, res) {
        const { slug } = req.params;
        const { userId } = req.user;
        const { rating, content } = req.body;

        const review = await this.reviewService.create(slug, userId, { rating, content });
        res.status(201).json(review);
    }
}
