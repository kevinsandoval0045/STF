/**
 * Category Controller — HTTP Layer.
 */
export class CategoryController {
    constructor(categoryService) {
        this.categoryService = categoryService;
    }

    /**
     * GET /categories
     */
    getAll = async (req, res) => {
        const categories = await this.categoryService.getAllCategories();
        res.json({ data: categories });
    };
}
