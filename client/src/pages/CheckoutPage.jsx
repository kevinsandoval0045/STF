import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { createOrder, updateProfile } from '../services/apiService.js';
import api from '../services/apiService.js';
import { formatPrice } from '../utils/formatters.js';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import { Loader2, ShieldCheck, Truck, CreditCard, CheckCircle2, MapPin, Pencil } from 'lucide-react';
import SEO from '../components/SEO.jsx';

const MP_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;

/**
 * CheckoutPage — two-step checkout.
 *
 * Step 1: Shipping information form (sends order to backend, receives preferenceId)
 * Step 2: Mercado Pago Payment Brick (uses preferenceId to mount the payment UI)
 */
export default function CheckoutPage() {
    const { cart, subtotal, clearCart } = useCart();
    const { user, isAuthenticated, requireAuth, setUser } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [preferenceId, setPreferenceId] = useState(null);
    const [orderSummary, setOrderSummary] = useState(null);
    const [mpReady, setMpReady] = useState(false);

    // Whether user is editing address (false = show saved address card)
    const hasAddress = user?.address && user.address.trim() !== '';
    const [editingAddress, setEditingAddress] = useState(!hasAddress);

    // Initialize MP SDK lazily when this component mounts
    useEffect(() => {
        try {
            initMercadoPago(MP_PUBLIC_KEY, { locale: 'es-MX' });
            setMpReady(true);
        } catch (e) {
            console.error('MP init error:', e);
            setMpReady(true);
        }
    }, []);

    // Only address fields — name/email/phone come from the user's account
    const [addressForm, setAddressForm] = useState({
        address: user?.address || '',
        city:    user?.city    || '',
        state:   user?.state   || '',
        zipCode: user?.zipCode || '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Auth guard
    useEffect(() => {
        if (!isAuthenticated) {
            requireAuth('/checkout');
            navigate('/', { replace: true });
        }
    }, [isAuthenticated]);

    // Sync addressForm when user data loads
    useEffect(() => {
        if (user) {
            setAddressForm({
                address: user.address || '',
                city:    user.city    || '',
                state:   user.state   || '',
                zipCode: user.zipCode || '',
            });
            // If user already has address, show the card (not the form)
            if (user.address?.trim()) setEditingAddress(false);
        }
    }, [user]);

    /**
     * Step 1 submit: create order in backend, receive preferenceId, advance to step 2.
     * Uses saved address + user account data — no need to re-enter personal info.
     */
    const handleShippingSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Resolve address: use form values if editing, otherwise use saved profile
        const resolvedAddress = editingAddress ? addressForm : {
            address: user.address,
            city:    user.city,
            state:   user.state,
            zipCode: user.zipCode,
        };

        // If user changed address, save it to their profile silently
        if (editingAddress) {
            try {
                const updated = await updateProfile(resolvedAddress);
                setUser((prev) => ({ ...prev, ...updated }));
            } catch { /* non-blocking */ }
        }

        try {
            const orderData = {
                items: cart.map((item) => ({ id: item.id, quantity: item.quantity })),
                customerInfo: {
                    firstName: user.firstName,
                    lastName:  user.lastName,
                    email:     user.email,
                    phone:     user.phone || '',
                    ...resolvedAddress,
                },
            };

            const result = await createOrder(orderData);

            setPreferenceId(result.preferenceId);
            setOrderSummary({
                orderId:       result.orderId,
                orderNumber:   result.orderNumber,
                trackingToken: result.trackingToken,
                totalAmount:   result.totalAmount,
            });
            setStep(2);
            clearCart();
        } catch (err) {
            const msg =
                err.response?.data?.error?.message ||
                err.response?.data?.error?.details?.[0]?.message ||
                'Algo salió mal. Por favor, inténtalo de nuevo.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    /**
     * MP Payment Brick onSubmit — fired when the user clicks "Pagar".
     *
     * Two payment paths:
     * 1. CARD (credit/debit): brick calls onSubmit with tokenized formData.
     *    We POST to /api/v1/payments/process → MP creates the charge → we navigate.
     *    The webhook ALSO fires and updates order status (with idempotency guard).
     *
     * 2. REDIRECT methods (Oxxo, bank transfer, MP wallet): the brick redirects
     *    the user to MP's hosted page. back_urls in the preference handle the return.
     *    onSubmit is NOT called for these — so the code below only runs for cards.
     */
    const onPaymentSubmit = useCallback(async ({ selectedPaymentMethod, formData }) => {
        // Guard: if there's no orderId we can't process (shouldn't happen in practice)
        if (!orderSummary?.orderId) {
            console.error('[Checkout] onPaymentSubmit called but orderId is missing');
            return;
        }

        // POST to our backend, which calls MP's API with the authoritative amount from DB
        const { data } = await api.post('/payments/process', {
            orderId: orderSummary.orderId,
            formData,
        });

        const { status } = data;
        console.log(`[Checkout] Payment result: ${status} (method: ${selectedPaymentMethod})`);

        if (status === 'approved') {
            navigate(
                `/payment-success?orderNumber=${encodeURIComponent(orderSummary.orderNumber)}&trackingToken=${encodeURIComponent(orderSummary.trackingToken)}`
            );
        } else if (status === 'pending' || status === 'in_process') {
            // Common for some bank transfers / 3DS flows that settle asynchronously
            navigate(
                `/payment-success?orderNumber=${encodeURIComponent(orderSummary.orderNumber)}&trackingToken=${encodeURIComponent(orderSummary.trackingToken)}&pending=true`
            );
        }
        // For 'rejected': we do NOT navigate — the brick shows its own rejection UI
        // so the user can retry with a different card.
    }, [orderSummary, navigate]);

    const onPaymentError = useCallback((error) => {
        console.error('MP Payment error:', error);
        navigate('/payment-failure');
    }, [navigate]);

    if (!isAuthenticated) return null;

    if (cart.length === 0 && step === 1) {
        return (
            <div className="container-main py-20 text-center">
                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg text-gray-500">Tu carrito está vacío</p>
                <Link to="/" className="mt-4 btn-secondary inline-block">
                    Seguir comprando
                </Link>
            </div>
        );
    }

    return (
        <div className="container-main py-8">
            <SEO title="Finalizar compra" noIndex />

            {/* ─── Stepper ─────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 mb-8">
                <div className={`flex items-center gap-2 text-sm font-semibold ${step >= 1 ? 'text-brand-red' : 'text-gray-400'}`}>
                    {step > 1 ? (
                        <CheckCircle2 className="w-5 h-5" />
                    ) : (
                        <span className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center text-xs">1</span>
                    )}
                    Datos de envío
                </div>
                <div className={`flex-1 h-px ${step >= 2 ? 'bg-brand-red' : 'bg-gray-200'}`} />
                <div className={`flex items-center gap-2 text-sm font-semibold ${step >= 2 ? 'text-brand-red' : 'text-gray-400'}`}>
                    <span className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center text-xs">2</span>
                    Pago
                </div>
            </div>

            <h1 className="text-2xl font-bold text-kas-text mb-8">Finalizar compra</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* ─── Main content (left) ─────────────────────────────── */}
                <div className="lg:col-span-2">

                    {/* STEP 1 — Shipping */}
                    {step === 1 && (
                        <form onSubmit={handleShippingSubmit} className="space-y-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h2 className="text-lg font-semibold text-kas-text mb-4 flex items-center gap-2">
                                    <Truck className="w-5 h-5 text-brand-red" />
                                    Dirección de envío
                                </h2>

                                {/* Saved address card */}
                                {!editingAddress && hasAddress ? (
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                                            <MapPin className="w-4 h-4 text-brand-red mt-0.5 shrink-0" />
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
                                            className="inline-flex items-center gap-1.5 text-sm text-brand-red hover:underline font-medium"
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
                                                           focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all"
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
                                                               focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                                <input
                                                    type="text" name="state"
                                                    value={addressForm.state}
                                                    onChange={(e) => setAddressForm((f) => ({ ...f, state: e.target.value }))}
                                                    className="w-full px-4 py-2.5 border border-surface-border rounded-lg
                                                               focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all"
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
                                                           focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all"
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
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="w-5 h-5" />
                                        Continuar al pago — {formatPrice(subtotal)}
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* STEP 2 — Mercado Pago Payment Brick */}
                    {step === 2 && preferenceId && mpReady && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Back to step 1 — disabled once order created */}
                            <div className="flex items-center gap-2 px-6 pt-5 pb-2 border-b border-gray-100">
                                <CreditCard className="w-5 h-5 text-brand-red" />
                                <h2 className="text-lg font-semibold text-kas-text">Método de pago</h2>
                            </div>

                            <div className="p-4">
                                <Payment
                                    initialization={{
                                        amount: orderSummary?.totalAmount || subtotal,
                                        preferenceId,
                                    }}
                                    customization={{
                                        paymentMethods: {
                                            ticket: 'all',
                                            bankTransfer: 'all',
                                            creditCard: 'all',
                                            debitCard: 'all',
                                            mercadoPago: 'all',
                                        },
                                        visual: {
                                            style: {
                                                theme: 'default',
                                                customVariables: {
                                                    baseColor: '#E02424',
                                                    baseColorFirstVariant: '#B91C1C',
                                                    baseColorSecondVariant: '#7F1D1D',
                                                    fontSizeBase: '14px',
                                                    borderRadiusLarge: '0.75rem',
                                                },
                                            },
                                        },
                                    }}
                                    onSubmit={onPaymentSubmit}
                                    onError={onPaymentError}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── Order Summary Sidebar (right) ───────────────────── */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
                        <h2 className="text-lg font-semibold text-kas-text mb-4">Resumen del pedido</h2>

                        {step === 2 && orderSummary ? (
                            /* Step 2 summary — from actual order */
                            <>
                                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                    <p className="text-xs text-gray-400 uppercase">Número de pedido</p>
                                    <p className="font-bold text-kas-text">{orderSummary.orderNumber}</p>
                                </div>
                                <div className="border-t pt-3">
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Total a pagar</span>
                                        <span className="text-xl font-bold text-brand-red">
                                            {formatPrice(orderSummary.totalAmount)}
                                        </span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Step 1 summary — from cart */
                            <>
                                <div className="space-y-3 mb-4">
                                    {cart.map((item) => (
                                        <div key={item.id} className="flex justify-between text-sm">
                                            <span className="text-gray-600 truncate mr-2">
                                                {item.name} × {item.quantity}
                                            </span>
                                            <span className="font-medium shrink-0">
                                                {formatPrice(item.price * item.quantity)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t pt-3 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Subtotal</span>
                                        <span className="font-medium">{formatPrice(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Envío</span>
                                        <span className="text-brand-red font-medium">
                                            {subtotal >= 500 ? 'Gratis' : 'Calculado en el pago'}
                                        </span>
                                    </div>
                                    <div className="border-t pt-2 flex justify-between">
                                        <span className="font-semibold">Total</span>
                                        <span className="text-xl font-bold text-brand-red">
                                            {formatPrice(subtotal)}
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Trust badges */}
                        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
                            <ShieldCheck className="w-4 h-4 text-brand-red shrink-0" />
                            Pago 100% seguro con Mercado Pago
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
