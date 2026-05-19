import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { createSubscription, updateProfile } from '../services/apiService.js';
import { formatPrice } from '../utils/formatters.js';
import {
    Loader2, RefreshCw, Truck, ShieldCheck, Calendar,
    Package, ArrowLeft, MapPin, Pencil,
} from 'lucide-react';
import SEO from '../components/SEO.jsx';

/**
 * SubscriptionCheckoutPage — checkout flow for recurring product subscriptions.
 *
 * URL: /subscribe/:productId
 *
 * 1. Loads the product and calculates the billing frequency
 * 2. Shows saved address card (or form if no address / user clicks "Cambiar")
 * 3. Creates subscription → redirects to Mercado Pago init_point
 */
export default function SubscriptionCheckoutPage() {
    const { productId } = useParams();
    const { user, isAuthenticated, requireAuth, setUser } = useAuth();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [discountInfo, setDiscountInfo] = useState(null); // { originalPrice, finalPrice }

    // ── Address state (mirrors CheckoutPage pattern) ──────────────────────────
    const hasAddress = user?.address && user.address.trim() !== '';
    const [editingAddress, setEditingAddress] = useState(!hasAddress);

    // Only address fields — name / email / phone come from the user account
    const [addressForm, setAddressForm] = useState({
        address: user?.address || '',
        city:    user?.city    || '',
        state:   user?.state   || '',
        zipCode: user?.zipCode || '',
    });

    // Auth guard
    useEffect(() => {
        if (!isAuthenticated) {
            requireAuth(`/subscribe/${productId}`);
            navigate('/', { replace: true });
        }
    }, [isAuthenticated]);

    // Sync address form when user data loads
    useEffect(() => {
        if (user) {
            setAddressForm({
                address: user.address || '',
                city:    user.city    || '',
                state:   user.state   || '',
                zipCode: user.zipCode || '',
            });
            // If user already has an address, show the card (not the form)
            if (user.address?.trim()) setEditingAddress(false);
        }
    }, [user]);

    // Load product directly by ID
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/v1/products/id/${productId}`);
                if (!res.ok) {
                    setError(res.status === 404 ? 'Producto no encontrado' : 'Error al cargar el producto');
                    return;
                }
                const data = await res.json();
                setProduct(data);
            } catch {
                setError('Error al cargar el producto');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [productId]);

    // ── Derived values ────────────────────────────────────────────────────────
    const billingDays  = product?.servingsPerContainer ? product.servingsPerContainer - 3 : 0;
    const unitPrice    = product?.discountPrice ? Number(product.discountPrice) : Number(product?.price || 0);
    const effectivePrice = discountInfo ? discountInfo.finalPrice : unitPrice;
    const totalAmount  = effectivePrice * quantity;

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        // Resolve address: form values if editing, otherwise saved profile
        const resolvedAddress = editingAddress ? addressForm : {
            address: user.address,
            city:    user.city,
            state:   user.state,
            zipCode: user.zipCode,
        };

        // If user changed address, persist it to their profile silently
        if (editingAddress) {
            try {
                const updated = await updateProfile(resolvedAddress);
                setUser((prev) => ({ ...prev, ...updated }));
            } catch { /* non-blocking */ }
        }

        try {
            const result = await createSubscription({
                productId,
                quantity,
                customerInfo: {
                    firstName: user.firstName,
                    lastName:  user.lastName,
                    email:     user.email,
                    phone:     user.phone || '',
                    ...resolvedAddress,
                },
            });

            // Store discount info if the backend applied a loyalty discount
            if (result.discountApplied) {
                setDiscountInfo({
                    originalPrice: result.originalPrice,
                    finalPrice:    result.finalPrice,
                });
            }

            // Redirect to Mercado Pago
            if (result.initPoint) {
                window.location.href = result.initPoint;
            } else {
                setError('No se pudo crear la suscripción. Intenta de nuevo.');
            }
        } catch (err) {
            setError(err.response?.data?.error?.message || err.response?.data?.error || 'Error al crear la suscripción');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Loading / error states ────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-kas-bg">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (error && !product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-kas-bg gap-4">
                <p className="text-red-600 text-lg">{error}</p>
                <Link to="/" className="text-kas-text underline hover:text-kas-secondary">Volver al inicio</Link>
            </div>
        );
    }

    const mainImage = product?.images?.[0]?.url || product?.imageUrl || '/images/placeholder.png';

    return (
        <>
            <SEO title={`Suscripción — ${product?.name} | KAS Supplements`} />
            <div className="min-h-screen bg-kas-bg py-8">
                <div className="container-main max-w-5xl">

                    {/* Back link */}
                    <Link
                        to={`/product/${product?.slug}`}
                        className="inline-flex items-center gap-2 text-sm text-kas-muted hover:text-kas-text transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver al producto
                    </Link>

                    <h1 className="text-2xl md:text-3xl font-bold text-kas-text mb-2">
                        Suscripción recurrente
                    </h1>
                    <p className="text-kas-muted mb-8">
                        Recibe <strong>{product?.name}</strong> automáticamente cada <strong>{billingDays} días</strong>
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* ── Left: Shipping form ────────────────────────── */}
                        <div className="lg:col-span-2">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="bg-white rounded-2xl shadow-sm border border-surface-border p-6">
                                    <h2 className="text-lg font-semibold text-kas-text mb-4 flex items-center gap-2">
                                        <Truck className="w-5 h-5 text-gray-500" />
                                        Dirección de envío
                                    </h2>

                                    {/* Saved address card */}
                                    {!editingAddress && hasAddress ? (
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                                                <MapPin className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-xs font-medium text-kas-muted uppercase tracking-wide mb-0.5">
                                                        Dirección de envío
                                                    </p>
                                                    <p className="text-sm font-medium text-kas-text">{user.address}</p>
                                                    <p className="text-sm text-kas-muted">
                                                        {[user.city, user.state, user.zipCode].filter(Boolean).join(', ')}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setEditingAddress(true)}
                                                className="inline-flex items-center gap-1.5 text-sm text-kas-text underline hover:text-kas-secondary font-medium"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                                Cambiar dirección de entrega
                                            </button>
                                        </div>
                                    ) : (
                                        /* Address-only form */
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Calle y número *</label>
                                                <input
                                                    type="text" name="address" required
                                                    value={addressForm.address}
                                                    onChange={(e) => setAddressForm((f) => ({ ...f, address: e.target.value }))}
                                                    placeholder="Ej. Av. Reforma 123, Col. Centro"
                                                    className="w-full px-4 py-2.5 border border-surface-border rounded-lg
                                                               focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all text-sm"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad *</label>
                                                    <input
                                                        type="text" name="city" required
                                                        value={addressForm.city}
                                                        onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))}
                                                        className="w-full px-4 py-2.5 border border-surface-border rounded-lg
                                                                   focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                                    <input
                                                        type="text" name="state"
                                                        value={addressForm.state}
                                                        onChange={(e) => setAddressForm((f) => ({ ...f, state: e.target.value }))}
                                                        className="w-full px-4 py-2.5 border border-surface-border rounded-lg
                                                                   focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="sm:w-1/2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Código postal *</label>
                                                <input
                                                    type="text" name="zipCode" required
                                                    value={addressForm.zipCode}
                                                    onChange={(e) => setAddressForm((f) => ({ ...f, zipCode: e.target.value }))}
                                                    className="w-full px-4 py-2.5 border border-surface-border rounded-lg
                                                               focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all text-sm"
                                                />
                                            </div>
                                            {hasAddress && (
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingAddress(false)}
                                                    className="text-sm text-kas-muted hover:text-kas-text transition-colors"
                                                >
                                                    ← Usar mi dirección guardada
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Quantity selector */}
                                    <div className="mt-6 pt-4 border-t border-surface-border">
                                        <label htmlFor="quantity" className="block text-sm font-medium text-kas-secondary mb-1">
                                            Cantidad por envío
                                        </label>
                                        <select
                                            id="quantity"
                                            value={quantity}
                                            onChange={(e) => setQuantity(Number(e.target.value))}
                                            className="w-32 px-4 py-2.5 rounded-lg border border-surface-border bg-white text-kas-text
                                                     focus:outline-none focus:ring-2 focus:ring-brand-red text-sm"
                                        >
                                            {[1, 2, 3, 4, 5].map(n => (
                                                <option key={n} value={n}>{n} {n === 1 ? 'unidad' : 'unidades'}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                        <p className="text-red-600 text-sm">{error}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-3.5 px-6 bg-brand-red text-white font-bold rounded-xl
                                             hover:bg-brand-red-dark transition-all duration-200 text-base
                                             disabled:opacity-50 disabled:cursor-not-allowed
                                             flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-5 h-5" />
                                            Suscribirme — {formatPrice(totalAmount)} / envío
                                        </>
                                    )}
                                </button>

                                <p className="text-xs text-center text-kas-muted">
                                    Serás redirigido a Mercado Pago para configurar tu método de pago
                                </p>
                            </form>
                        </div>

                        {/* ── Right: Order summary ───────────────────────── */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-sm border border-surface-border p-6 sticky top-24">
                                <h2 className="text-lg font-semibold text-kas-text mb-4">Resumen</h2>

                                {/* Product card */}
                                <div className="flex gap-4 pb-4 border-b border-surface-border">
                                    <img
                                        src={mainImage}
                                        alt={product?.name}
                                        className="w-20 h-20 rounded-lg object-cover bg-gray-100"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-kas-text text-sm truncate">{product?.name}</p>
                                        <p className="text-xs text-kas-muted mt-0.5">{product?.brand?.name}</p>
                                        <p className="text-brand-red font-bold text-sm mt-1">
                                            {formatPrice(unitPrice)}
                                        </p>
                                    </div>
                                </div>

                                {/* Subscription details */}
                                <div className="py-4 space-y-3 border-b border-surface-border">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                                        <div>
                                            <p className="font-medium text-kas-text">Cada {billingDays} días</p>
                                            <p className="text-xs text-kas-muted">Frecuencia de envío</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Package className="w-4 h-4 text-gray-500 shrink-0" />
                                        <div>
                                            <p className="font-medium text-kas-text">{quantity} {quantity === 1 ? 'unidad' : 'unidades'}</p>
                                            <p className="text-xs text-kas-muted">Por envío</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <RefreshCw className="w-4 h-4 text-gray-500 shrink-0" />
                                        <div>
                                            <p className="font-medium text-kas-text">Renovación automática</p>
                                            <p className="text-xs text-kas-muted">Cancela cuando quieras</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Discount badge */}
                                {discountInfo && (
                                    <div className="my-4 flex items-center gap-2 bg-green-50 border border-green-200
                                                    text-green-700 text-xs font-semibold rounded-xl px-3 py-2">
                                        <span className="text-base">🎁</span>
                                        <span>¡Descuento de lealtad del 5% aplicado!</span>
                                    </div>
                                )}

                                {/* Total */}
                                <div className="pt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-kas-text">Total por envío</span>
                                        <div className="text-right">
                                            {discountInfo && (
                                                <p className="text-xs text-gray-400 line-through">
                                                    {formatPrice(discountInfo.originalPrice * quantity)}
                                                </p>
                                            )}
                                            <span className="text-xl font-bold text-brand-red">
                                                {formatPrice(totalAmount)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Trust badges */}
                                <div className="mt-6 pt-4 border-t border-surface-border space-y-2">
                                    <div className="flex items-center gap-2 text-xs text-kas-muted">
                                        <ShieldCheck className="w-4 h-4 text-green-600" />
                                        Pago seguro con Mercado Pago
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-kas-muted">
                                        <Truck className="w-4 h-4 text-blue-600" />
                                        Envío anticipado (3 días antes)
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
