import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductBySlug, getProductReviews, createReview } from '../services/apiService.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatPrice } from '../utils/formatters.js';
import { ShoppingCart, Minus, Plus, ArrowLeft, Package, Loader2, Star, X, RefreshCw } from 'lucide-react';
import SEO from '../components/SEO.jsx';

/**
 * Star rating display — renders filled/half/empty stars.
 */
function StarDisplay({ rating, max = 5, size = 'sm' }) {
    const sizeClass = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: max }).map((_, i) => (
                <Star
                    key={i}
                    className={`${sizeClass} ${i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                />
            ))}
        </div>
    );
}

/**
 * Interactive star picker for review form.
 */
function StarPicker({ value, onChange }) {
    const [hovered, setHovered] = useState(0);
    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => {
                const star = i + 1;
                const active = star <= (hovered || value);
                return (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(0)}
                        className="transition-transform hover:scale-110"
                        aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
                    >
                        <Star
                            className={`w-8 h-8 transition-colors ${active ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
                        />
                    </button>
                );
            })}
        </div>
    );
}

/**
 * ProductDetail Page — shows full product details with images, description,
 * flavor selector, add to cart, and customer reviews.
 */
export default function ProductDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { user, isAuthenticated, requireAuth } = useAuth();
    const { addToast } = useToast();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedFlavor, setSelectedFlavor] = useState('');

    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [reviewCount, setReviewCount] = useState(0);
    const [reviewAverage, setReviewAverage] = useState(null);
    const [reviewsLoading, setReviewsLoading] = useState(false);

    // Review modal state
    const [showModal, setShowModal] = useState(false);
    const [newRating, setNewRating] = useState(0);
    const [newContent, setNewContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Track if current user already reviewed
    const [userAlreadyReviewed, setUserAlreadyReviewed] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const data = await getProductBySlug(slug);
                setProduct(data);
                if (data.flavors?.length > 0) {
                    setSelectedFlavor(data.flavors[0]);
                }
            } catch (err) {
                setError(err.response?.data?.error?.message || 'Producto no encontrado');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [slug]);

    useEffect(() => {
        if (!slug) return;
        const fetchReviews = async () => {
            setReviewsLoading(true);
            try {
                const { reviews: r, count, average } = await getProductReviews(slug);
                setReviews(r);
                setReviewCount(count);
                setReviewAverage(average);
                if (isAuthenticated && user) {
                    setUserAlreadyReviewed(r.some((rev) => rev.userId === user.id));
                }
            } catch {
                // non-critical: silently ignore
            } finally {
                setReviewsLoading(false);
            }
        };
        fetchReviews();
    }, [slug, isAuthenticated, user]);

    const handleAddReviewClick = () => {
        if (!requireAuth()) return; // opens auth modal if not logged in
        setShowModal(true);
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (newRating === 0) {
            addToast('Por favor selecciona una calificación', 'error');
            return;
        }
        setSubmitting(true);
        try {
            const review = await createReview(slug, { rating: newRating, content: newContent });
            setReviews((prev) => [review, ...prev]);
            setReviewCount((c) => c + 1);
            setReviewAverage((avg) =>
                avg === null ? newRating : (avg * reviewCount + newRating) / (reviewCount + 1)
            );
            setUserAlreadyReviewed(true);
            setShowModal(false);
            setNewRating(0);
            setNewContent('');
            addToast('¡Gracias por tu reseña!', 'success');
        } catch (err) {
            const msg = err.response?.data?.error?.message || err.message || 'Error al enviar la reseña';
            addToast(msg, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="container-main py-20 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg text-gray-500">{error || 'Producto no encontrado'}</p>
                <Link to="/" className="mt-4 btn-secondary inline-block">
                    Volver al inicio
                </Link>
            </div>
        );
    }

    const hasDiscount = product.discountPrice && product.discountPrice < product.price;
    const hasFlavors = product.flavors?.length > 0;
    const allImages = [
        product.imageUrl,
        ...(product.images?.map((img) => img.url) || []),
    ].filter(Boolean);

    // JSON-LD Product schema for SEO
    const productJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description || `${product.name} — suplemento premium`,
        image: allImages,
        sku: product.slug,
        ...(product.brand && {
            brand: { '@type': 'Brand', name: product.brand.name },
        }),
        offers: {
            '@type': 'Offer',
            url: `${window.location.origin}/product/${product.slug}`,
            priceCurrency: 'USD',
            price: hasDiscount ? product.discountPrice : product.price,
            availability: product.stockQuantity > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
        },
    };

    const selectedFlavorName = hasFlavors ? selectedFlavor : null;

    return (
        <div className="container-main py-8">
            <SEO
                title={product.name}
                description={product.description?.slice(0, 160) || `Compra ${product.name} en SupplementsStore`}
                ogImage={product.imageUrl}
                canonical={`${window.location.origin}/product/${product.slug}`}
                jsonLd={productJsonLd}
            />

            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                <Link to="/" className="hover:text-kas-text transition-colors flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" /> Inicio
                </Link>
                <span>/</span>
                {product.category && (
                    <>
                        <span>{product.category.name}</span>
                        <span>/</span>
                    </>
                )}
                <span className="text-kas-text font-medium">{product.name}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Image Gallery */}
                <div>
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-4">
                        <img
                            src={allImages[selectedImage] || 'https://placehold.co/600x600?text=No+Image'}
                            alt={product.name}
                            className="w-full h-[400px] lg:h-[500px] object-cover"
                        />
                    </div>
                    {allImages.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {allImages.map((url, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedImage(i)}
                                    className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all
                    ${i === selectedImage ? 'border-brand-red shadow-md' : 'border-gray-200'}`}
                                >
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div>
                    {/* Brand */}
                    {product.brand && (
                        <div className="flex items-center gap-2 mb-2">
                            {product.brand.logoUrl && (
                                <img src={product.brand.logoUrl} alt={product.brand.name} className="h-6" />
                            )}
                            <span className="text-sm text-gray-400 uppercase tracking-wide">
                                {product.brand.name}
                            </span>
                        </div>
                    )}

                    {/* Name */}
                    <h1 className="text-2xl lg:text-3xl font-bold text-kas-text mb-4">
                        {product.name}
                    </h1>

                    {/* Price */}
                    <div className="flex items-baseline gap-3 mb-6">
                        <span className="text-3xl font-bold text-brand-red">
                            {formatPrice(hasDiscount ? product.discountPrice : product.price)}
                        </span>
                        {hasDiscount && (
                            <>
                                <span className="text-lg text-gray-400 line-through">
                                    {formatPrice(product.price)}
                                </span>
                                <span className="badge-sale">
                                    -{Math.round((1 - product.discountPrice / product.price) * 100)}%
                                </span>
                            </>
                        )}
                    </div>

                    {/* Stock */}
                    <div className="mb-6">
                        {product.stockQuantity > 0 ? (
                            <span className="text-sm text-brand-red font-medium">
                                En stock ({product.stockQuantity} disponibles)
                            </span>
                        ) : (
                            <span className="text-sm text-red-500 font-medium">❌ Agotado</span>
                        )}
                    </div>

                    {/* Servings per container */}
                    {product.servingsPerContainer > 0 && (
                        <div className="mb-6 flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-700">
                                Servicios por envase:
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                                {product.servingsPerContainer} servicios
                            </span>
                        </div>
                    )}

                    {/* Description */}
                    {product.description && (
                        <div className="mb-8">
                            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                                Descripción
                            </h2>
                            <p className="text-gray-600 leading-relaxed">{product.description}</p>
                        </div>
                    )}

                    {/* Flavor + Quantity selectors */}
                    {product.stockQuantity > 0 && (
                        <div className="space-y-3">
                            {/* Row: flavor selector (if any) + quantity picker */}
                            <div className="flex items-center gap-3 flex-wrap">
                                {/* Flavor selector */}
                                {hasFlavors && (
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            Sabor
                                        </span>
                                        <select
                                            id="flavor-select"
                                            value={selectedFlavor}
                                            onChange={(e) => setSelectedFlavor(e.target.value)}
                                            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium
                                                       bg-white focus:outline-none focus:ring-2 focus:ring-brand-red
                                                       focus:border-transparent transition-all cursor-pointer"
                                        >
                                            {product.flavors.map((flavor) => (
                                                <option key={flavor} value={flavor}>{flavor}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Quantity picker */}
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Cantidad
                                    </span>
                                    <div className="flex items-center border border-gray-200 rounded-lg">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="p-2.5 hover:bg-gray-100 transition-colors"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="px-4 py-2 font-medium min-w-[3rem] text-center">
                                            {quantity}
                                        </span>
                                        <button
                                            onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                                            className="p-2.5 hover:bg-gray-100 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Add to cart button — full width below */}
                            <button
                                onClick={() => addToCart(
                                    { ...product, selectedFlavor: selectedFlavorName },
                                    quantity
                                )}
                                className="btn-primary w-full flex items-center justify-center gap-2"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                Agregar al carrito — {formatPrice((hasDiscount ? product.discountPrice : product.price) * quantity)}
                            </button>
                        </div>
                    )}

                    {/* ─── Subscription CTA ─────────────────────────────── */}
                    {product.servingsPerContainer && (() => {
                        const billingDays = product.servingsPerContainer - 3;
                        const subscribePrice = hasDiscount ? product.discountPrice : product.price;
                        return (
                            <div className="mt-5 rounded-2xl border-2 border-dashed border-gray-200
                                           bg-gradient-to-br from-gray-50 to-white p-5">
                                {/* Badge */}
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                                               bg-gray-100 text-gray-700 text-xs font-semibold mb-3">
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Suscripción disponible
                                </span>

                                <p className="text-sm font-medium text-kas-text mb-1">
                                    Recibe tu <strong>{product.name}</strong> cada{' '}
                                    <strong className="text-brand-red">{billingDays} días</strong>{' '}
                                    automáticamente
                                </p>
                                <p className="text-xs text-gray-500 mb-4">
                                    Renovación anticipada para que nunca te quedes sin stock
                                </p>

                                <button
                                    id="subscribe-btn"
                                    onClick={() => {
                                        if (!requireAuth()) return;
                                        navigate(`/subscribe/${product.id}`);
                                    }}
                                    className="w-full flex items-center justify-center gap-2
                                               py-3 px-5 rounded-xl font-semibold text-sm
                                               bg-white border-2 border-brand-red text-brand-red
                                               hover:bg-brand-red hover:text-white
                                               transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Suscribirse —{' '}
                                    {formatPrice(Number(subscribePrice))} / envío
                                </button>

                                {/* Loyalty discount promo message */}
                                <p className="text-xs text-center text-gray-400 mt-2.5">
                                    🎁 A partir de tu segunda suscripción,{' '}
                                    <strong className="text-gray-500">obtén un 5% de descuento automático</strong>{' '}
                                    como beneficio de lealtad.
                                </p>
                            </div>
                        );
                    })()}

                    {/* Weight info */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-sm text-gray-400">
                            Peso: {product.weight} kg
                        </p>
                    </div>
                </div>
            </div>

            {/* ─── Reviews Section ───────────────────────────────────────────── */}
            <div className="mt-12 pt-10 border-t border-gray-100">
                <h2 className="text-xl font-bold text-brand-dark mb-6">Reseñas de clientes</h2>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left panel — summary + add button (1/4) */}
                    <div className="lg:w-1/4 flex flex-col gap-4">
                        {/* Rating summary */}
                        <div>
                            {reviewAverage !== null ? (
                                <>
                                    <p className="text-5xl font-extrabold text-kas-text leading-none mb-1">
                                        {reviewAverage.toFixed(1)}
                                    </p>
                                    <StarDisplay rating={reviewAverage} size="lg" />
                                    <p className="text-sm text-gray-500 mt-1">
                                        {reviewCount} {reviewCount === 1 ? 'reseña' : 'reseñas'}
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-gray-400 italic">
                                    Aún no hay reseñas para este producto.
                                </p>
                            )}
                        </div>

                        {/* Add review button */}
                        {userAlreadyReviewed ? (
                            <button
                                disabled
                                className="w-full border border-gray-200 text-gray-400 font-semibold
                                           px-4 py-2.5 rounded-lg cursor-not-allowed text-sm"
                            >
                                Ya dejaste una reseña
                            </button>
                        ) : (
                            <button
                                id="add-review-btn"
                                onClick={handleAddReviewClick}
                                className="w-full bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600
                                           text-black font-semibold px-4 py-2.5 rounded-lg
                                           transition-all duration-200 shadow-sm hover:shadow-md text-sm"
                            >
                                Añadir reseña
                            </button>
                        )}
                    </div>

                    {/* Right panel — review list (3/4) */}
                    <div className="lg:w-3/4 flex flex-col gap-4">
                        {reviewsLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                            </div>
                        ) : reviews.length === 0 ? (
                            <div className="border border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm italic">
                                Sé el primero en dejar una reseña.
                            </div>
                        ) : (
                            reviews.map((review) => (
                                <div
                                    key={review.id}
                                    className="border border-gray-200 rounded-xl p-5 bg-white"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex flex-col gap-1">
                                            <StarDisplay rating={review.rating} />
                                            <span className="text-sm font-medium text-gray-700">
                                                {review.user?.firstName} {review.user?.lastName}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-400 shrink-0 ml-4">
                                            {new Date(review.createdAt).toLocaleDateString('es-MX', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed mt-2">
                                        {review.content}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* ─── Review Modal ──────────────────────────────────────────────── */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                    onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
                >
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-modal-in">
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-kas-text">Añadir reseña</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label="Cerrar"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal body */}
                        <form onSubmit={handleSubmitReview} className="px-6 py-5 space-y-5">
                            {/* Star picker */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Calificación
                                </label>
                                <StarPicker value={newRating} onChange={setNewRating} />
                                {newRating > 0 && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][newRating]}
                                    </p>
                                )}
                            </div>

                            {/* Review text */}
                            <div>
                                <label
                                    htmlFor="review-content"
                                    className="block text-sm font-semibold text-gray-700 mb-2"
                                >
                                    Tu reseña
                                </label>
                                <textarea
                                    id="review-content"
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                    rows={4}
                                    placeholder="Cuéntanos tu experiencia con este producto..."
                                    required
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                                               resize-none focus:outline-none focus:ring-2 focus:ring-brand-red
                                               focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600
                                           text-black font-semibold py-3 rounded-xl transition-all
                                           duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {submitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : null}
                                {submitting ? 'Enviando...' : 'Publicar reseña'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
