import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useCategories } from '../hooks/useCategories.js';
import { useCategoryProducts } from '../hooks/useCategoryProducts.js';
import ProductCard from '../components/ProductCard.jsx';
import SkeletonProductCard from '../components/SkeletonProductCard.jsx';
import SEO from '../components/SEO.jsx';
import { SlidersHorizontal, PackageSearch, ChevronRight, ArrowUpDown } from 'lucide-react';

/**
 * CategoryPage — shows all products in a given category.
 * Layout (desktop): 3/4 product grid | 1/4 filter sidebar
 */
export default function CategoryPage() {
    const { slug } = useParams();
    const { categories } = useCategories();

    // Find category from loaded list by slug
    const category = categories.find((c) => c.slug === slug);
    const categoryId = category?.id ?? null;

    const {
        products,
        totalCount,
        loading,
        error,
        filters,
        setFilters,
        availableBrands,
    } = useCategoryProducts(categoryId);

    // Local temp state for price inputs (apply on blur/submit)
    const [priceMin, setPriceMin] = useState('');
    const [priceMax, setPriceMax] = useState('');

    const applyPriceFilter = () => {
        setFilters((f) => ({ ...f, minPrice: priceMin, maxPrice: priceMax }));
    };

    const clearFilters = () => {
        setPriceMin('');
        setPriceMax('');
        setFilters({ minPrice: '', maxPrice: '', brandId: null, sortBy: 'default' });
    };

    const hasActiveFilters =
        filters.minPrice !== '' || filters.maxPrice !== '' || filters.brandId || filters.sortBy !== 'default';

    return (
        <div className="container-main py-8">
            <SEO
                title={category ? `${category.name} — SupplementsStore` : 'Categoría — SupplementsStore'}
                description={category ? `Compra los mejores ${category.name} al mejor precio. Gran variedad y envío rápido.` : ''}
            />

            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6" aria-label="Breadcrumb">
                <Link to="/" className="hover:text-brand-red transition-colors">Inicio</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-gray-700 font-medium">{category?.name ?? slug}</span>
            </nav>

            {/* Category Title */}
            <h1 className="text-4xl font-extrabold text-kas-text mb-2">
                {category?.name ?? slug}
            </h1>
            {!loading && (
                <p className="text-sm text-gray-400 mb-8">
                    {totalCount} {totalCount === 1 ? 'producto' : 'productos'} encontrados
                </p>
            )}

            {/* Main Layout: products + sidebar */}
            <div className="flex gap-8">

                {/* ── Product Grid (3/4) ── */}
                <section className="flex-1 min-w-0">
                    {/* Sort bar */}
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <ArrowUpDown className="w-4 h-4" />
                            <span>Ordenar por:</span>
                        </div>
                        <select
                            id="sort-select"
                            value={filters.sortBy}
                            onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))}
                            className="text-sm border border-surface-border rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/30"
                        >
                            <option value="default">Relevancia</option>
                            <option value="price-asc">Precio: menor a mayor</option>
                            <option value="price-desc">Precio: mayor a menor</option>
                            <option value="name-asc">Nombre A-Z</option>
                            <option value="best-seller">Más vendidos</option>
                        </select>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <SkeletonProductCard key={i} />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="text-center py-20">
                            <p className="text-red-500">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-4 btn-secondary text-sm"
                            >
                                Reintentar
                            </button>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-20">
                            <PackageSearch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-lg text-gray-500">No se encontraron productos</p>
                            {hasActiveFilters && (
                                <button onClick={clearFilters} className="mt-4 btn-secondary text-sm">
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </section>

                {/* ── Filter Sidebar (1/4) — desktop only ── */}
                <aside className="hidden lg:block w-64 shrink-0">
                    <div className="sticky top-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal className="w-4 h-4 text-brand-red" />
                                <span className="font-semibold text-kas-text text-sm">Filtros</span>
                            </div>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>

                        {/* Price Range */}
                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                Precio
                            </h3>
                            <div className="flex gap-2 items-center mb-3">
                                <input
                                    type="number"
                                    placeholder="Mín"
                                    value={priceMin}
                                    onChange={(e) => setPriceMin(e.target.value)}
                                    className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30"
                                />
                                <span className="text-gray-300 text-sm">—</span>
                                <input
                                    type="number"
                                    placeholder="Máx"
                                    value={priceMax}
                                    onChange={(e) => setPriceMax(e.target.value)}
                                    className="w-full border border-surface-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30"
                                />
                            </div>
                            <button
                                onClick={applyPriceFilter}
                                className="w-full btn-secondary text-xs py-2"
                            >
                                Aplicar
                            </button>
                        </div>

                        {/* Brand Filter */}
                        {availableBrands.length > 0 && (
                            <div>
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                    Marca
                                </h3>
                                <div className="space-y-2">
                                    {availableBrands.map((brand) => (
                                        <label
                                            key={brand.id}
                                            className="flex items-center gap-2.5 cursor-pointer group"
                                        >
                                            <input
                                                type="radio"
                                                name="brand-filter"
                                                checked={filters.brandId === brand.id}
                                                onChange={() =>
                                                    setFilters((f) => ({
                                                        ...f,
                                                        brandId: f.brandId === brand.id ? null : brand.id,
                                                    }))
                                                }
                                                className="accent-brand-red"
                                            />
                                            <span className="text-sm text-gray-600 group-hover:text-kas-text transition-colors">
                                                {brand.name}
                                            </span>
                                        </label>
                                    ))}
                                    {filters.brandId && (
                                        <button
                                            onClick={() => setFilters((f) => ({ ...f, brandId: null }))}
                                            className="text-xs text-gray-400 hover:text-red-500 transition-colors mt-1"
                                        >
                                            Quitar filtro de marca
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Stock filter */}
                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                Disponibilidad
                            </h3>
                            <label className="flex items-center gap-2.5 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={filters.inStock ?? false}
                                    onChange={(e) =>
                                        setFilters((f) => ({ ...f, inStock: e.target.checked }))
                                    }
                                    className="accent-brand-red"
                                />
                                <span className="text-sm text-gray-600 group-hover:text-brand-red transition-colors">
                                    Solo en stock
                                </span>
                            </label>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
