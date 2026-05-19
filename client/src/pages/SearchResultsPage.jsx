import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PackageSearch, ArrowLeft, Search } from 'lucide-react';
import SEO from '../components/SEO.jsx';
import ProductCard from '../components/ProductCard.jsx';
import SkeletonProductCard from '../components/SkeletonProductCard.jsx';
import { getProducts } from '../services/apiService.js';

/**
 * SearchResultsPage — muestra todos los productos que coinciden con la
 * búsqueda del usuario.
 *
 * URL: /buscar?q=proteina
 */
export default function SearchResultsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inputValue, setInputValue] = useState(query);

    // Fetch todos los productos una sola vez
    useEffect(() => {
        getProducts({})
            .then(setAllProducts)
            .catch(() => setAllProducts([]))
            .finally(() => setLoading(false));
    }, []);

    // Sincronizar input cuando cambia el query param
    useEffect(() => {
        setInputValue(query);
    }, [query]);

    // Filtrado client-side por nombre o descripción
    const results = query.trim()
        ? allProducts.filter(
            (p) =>
                p.name.toLowerCase().includes(query.toLowerCase()) ||
                p.description?.toLowerCase().includes(query.toLowerCase()) ||
                p.brand?.name?.toLowerCase().includes(query.toLowerCase())
        )
        : allProducts;

    // Nueva búsqueda desde el input de la página
    const handleSearch = (e) => {
        e.preventDefault();
        if (inputValue.trim()) {
            setSearchParams({ q: inputValue.trim() });
        }
    };

    return (
        <>
            <SEO
                title={query ? `Resultados para "${query}"` : 'Buscar productos'}
                description={`Encuentra suplementos relacionados con "${query}". Proteínas, creatinas, pre-entrenos y más.`}
            />

            <div className="container-main py-10">

                {/* ── Encabezado ─────────────────────────────── */}
                <div className="mb-8">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-1.5 text-sm text-kas-muted
                                   hover:text-kas-text transition-colors mb-5"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver al inicio
                    </Link>

                    <h1 className="text-2xl md:text-3xl font-extrabold text-kas-text mb-1">
                        {query
                            ? <>Resultados para{' '}<span className="text-brand-red">"{query}"</span></>
                            : 'Todos los productos'}
                    </h1>

                    {!loading && (
                        <p className="text-kas-muted text-sm">
                            {results.length === 0
                                ? 'Sin resultados'
                                : `${results.length} ${results.length === 1 ? 'producto encontrado' : 'productos encontrados'}`}
                        </p>
                    )}
                </div>



                {/* ── Grid de resultados ───────────────────────── */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <SkeletonProductCard key={i} />
                        ))}
                    </div>
                ) : results.length === 0 ? (
                    /* ── Estado vacío ─────────────────────────── */
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center
                                        justify-center mb-5">
                            <PackageSearch className="w-10 h-10 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-bold text-kas-text mb-2">
                            No encontramos resultados
                        </h2>
                        <p className="text-kas-muted text-sm max-w-sm mb-6">
                            No hay productos que coincidan con{' '}
                            <strong>"{query}"</strong>. Intenta con otro término.
                        </p>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-red
                                       text-white text-sm font-semibold rounded-xl
                                       hover:bg-brand-red-dark transition-colors shadow-md
                                       shadow-red-500/20"
                        >
                            Ver todos los productos
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {results.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
