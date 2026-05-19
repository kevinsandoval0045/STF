import { useState, useEffect } from 'react';
import { getProducts } from '../services/apiService.js';

/**
 * Hook for fetching products filtered by category slug and
 * optionally by price range and brand.
 */
export function useCategoryProducts(categoryId) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        minPrice: '',
        maxPrice: '',
        brandId: null,
        sortBy: 'default',
    });

    useEffect(() => {
        if (!categoryId) return;

        const fetchProducts = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getProducts({ categoryId });
                setProducts(data);
            } catch (err) {
                setError(err.message || 'Error al cargar productos');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [categoryId]);

    // Apply client-side filters (price range, sort)
    const filteredProducts = products
        .filter((p) => {
            const price = parseFloat(p.discountPrice || p.price);
            const min = filters.minPrice !== '' ? parseFloat(filters.minPrice) : null;
            const max = filters.maxPrice !== '' ? parseFloat(filters.maxPrice) : null;
            if (min !== null && price < min) return false;
            if (max !== null && price > max) return false;
            if (filters.brandId && p.brandId !== filters.brandId) return false;
            return true;
        })
        .sort((a, b) => {
            const priceA = parseFloat(a.discountPrice || a.price);
            const priceB = parseFloat(b.discountPrice || b.price);
            if (filters.sortBy === 'price-asc') return priceA - priceB;
            if (filters.sortBy === 'price-desc') return priceB - priceA;
            if (filters.sortBy === 'name-asc') return a.name.localeCompare(b.name);
            if (filters.sortBy === 'best-seller') return (b.salesCount || 0) - (a.salesCount || 0);
            return 0;
        });

    // Derive available brands from fetched products
    const availableBrands = Array.from(
        new Map(
            products
                .filter((p) => p.brand)
                .map((p) => [p.brand.id, p.brand])
        ).values()
    );

    return {
        products: filteredProducts,
        totalCount: products.length,
        loading,
        error,
        filters,
        setFilters,
        availableBrands,
    };
}
