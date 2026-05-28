import { Link } from 'react-router-dom';
import { ShoppingCart, Eye } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { formatPrice } from '../utils/formatters.js';

/**
 * ProductCard — card de producto sobre fondo blanco, precio en rojo KAS.
 */
export default function ProductCard({ product }) {
    const { addToCart } = useCart();
    const hasDiscount = product.discountPrice && product.discountPrice < product.price;

    const discountPercent = hasDiscount
        ? Math.round((1 - product.discountPrice / product.price) * 100)
        : 0;

    return (
        <div className="card group overflow-hidden flex flex-col">
            {/* Image Container */}
            <Link to={`/product/${product.slug}`} className="relative block overflow-hidden bg-surface-subtle">
                <img
                    src={product.imageUrl || 'https://placehold.co/400x400?text=No+Image'}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {hasDiscount && (
                        <span className="badge-sale">-{discountPercent}%</span>
                    )}
                    {product.isNew && (
                        <span className="badge-new">Nuevo</span>
                    )}
                    {product.bestSeller && (
                        <span className="badge-bestseller">Más vendido</span>
                    )}
                </div>

                {/* Quick view overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10
                        flex items-center justify-center opacity-0 group-hover:opacity-100
                        transition-all duration-300">
                    <span className="bg-white text-kas-text px-3 py-1.5 rounded-full text-sm font-semibold
                          flex items-center gap-1.5 shadow-md">
                        <Eye className="w-4 h-4" /> Ver detalles
                    </span>
                </div>
            </Link>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
                {/* Brand */}
                {product.brand && (
                    <p className="text-xs text-kas-muted uppercase tracking-wide mb-1">
                        {product.brand.name}
                    </p>
                )}

                {/* Name */}
                <Link
                    to={`/product/${product.slug}`}
                    className="text-sm font-semibold text-kas-text hover:text-kas-secondary
                     transition-colors line-clamp-2 mb-2"
                >
                    {product.name}
                </Link>

                <div className="mt-auto" />

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-lg font-bold text-brand-red">
                        {formatPrice(hasDiscount ? product.discountPrice : product.price)}
                    </span>
                    {hasDiscount && (
                        <span className="text-sm text-kas-muted line-through">
                            {formatPrice(product.price)}
                        </span>
                    )}
                </div>

                {/* Add to Cart */}
                <button
                    onClick={() => addToCart(product)}
                    aria-label={`Agregar ${product.name} al carrito`}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm"
                >
                    <ShoppingCart className="w-4 h-4" />
                    Agregar al carrito
                </button>
            </div>
        </div>
    );
}
