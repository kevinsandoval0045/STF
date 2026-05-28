import { useState, useEffect } from 'react';
import { getProducts } from '../services/apiService.js';

/**
 * Custom hook for fetching and filtering products.
 * Manages loading, error, and search/filter state.
 */
export function useProducts() {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({ categoryId: null, brandId: null });
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch products whenever filters change
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getProducts(filters);
                setProducts(data);
            } catch (err) {
                setError(err.message || 'Failed to load products');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [filters.categoryId, filters.brandId]);

    // Client-side search filtering
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredProducts(products);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = products.filter(
            (p) =>
                p.name.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query)
        );
        setFilteredProducts(filtered);
    }, [products, searchQuery]);

    return {
        products: filteredProducts,
        allProducts: products,
        loading,
        error,
        filters,
        setFilters,
        searchQuery,
        setSearchQuery,
    };
}
