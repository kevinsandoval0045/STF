/**
 * Product Controller — HTTP Layer.
 * Handles parsing request params/query, calling the service,
 * and sending the JSON response. No business logic here.
 */
export class ProductController {
    constructor(productService) {
        this.productService = productService;
    }

    /**
     * GET /products?categoryId=...&brandId=...
     */
    getAll = async (req, res) => {
        const { categoryId, brandId } = req.query;
        const products = await this.productService.getAllProducts({ categoryId, brandId });
        res.json({ data: products });
    };

    /**
     * GET /products/:slug
     */
    getBySlug = async (req, res) => {
        const product = await this.productService.getProductBySlug(req.params.slug);
        res.json(product);
    };

    /**
     * GET /products/id/:id
     * Fetch a product by its UUID — used by the subscription checkout page.
     */
    getById = async (req, res) => {
        const product = await this.productService.getProductById(req.params.id);
        if (!product) {
            const err = new Error('Producto no encontrado');
            err.statusCode = 404;
            throw err;
        }
        // Format Decimal fields
        res.json({
            ...product,
            price: Number(product.price),
            discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
            weight: Number(product.weight),
        });
    };
}
