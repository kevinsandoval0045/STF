/**
 * Brand Controller — HTTP Layer.
 */
export class BrandController {
    constructor(brandService) {
        this.brandService = brandService;
    }

    /**
     * GET /brands
     */
    getAll = async (req, res) => {
        const brands = await this.brandService.getAllBrands();
        res.json({ data: brands });
    };
}
