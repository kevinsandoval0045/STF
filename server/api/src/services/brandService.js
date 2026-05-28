/**
 * Brand Service — Business Logic Layer.
 */
export class BrandService {
    constructor(brandRepository) {
        this.brandRepository = brandRepository;
    }

    /**
     * Get all active brands.
     */
    async getAllBrands() {
        return this.brandRepository.findAll();
    }
}
