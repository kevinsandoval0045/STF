import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
    getMySubscriptions, cancelSubscription,
    getMyOrders, updateProfile, cancelOrder,
} from '../services/apiService.js';
import { formatPrice, formatDate } from '../utils/formatters.js';
import {
    ChevronDown, ChevronUp, LogOut, MapPin,
    ShoppingBag, RefreshCw, Package, Loader2,
    Pencil, Check, X as XIcon,
} from 'lucide-react';
import SEO from '../components/SEO.jsx';

/** Animated accordion wrapper */
function Accordion({ id, title, icon: Icon, count, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between px-6 py-5
                           hover:bg-gray-50 transition-colors group"
                aria-expanded={open}
                aria-controls={`acc-${id}`}
            >
                <span className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-gray-100 text-gray-500">
                        <Icon className="w-5 h-5" />
                    </span>
                    <span className="text-base font-semibold text-kas-text">{title}</span>
                    {count !== undefined && count > 0 && (
                        <span className="text-xs font-bold bg-brand-red text-white
                                         px-2 py-0.5 rounded-full">
                            {count}
                        </span>
                    )}
                </span>
                {open
                    ? <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-kas-text transition-colors" />
                    : <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-kas-text transition-colors" />
                }
            </button>

            {open && (
                <div id={`acc-${id}`} className="border-t border-gray-100 px-6 py-5 space-y-4 animate-fade-in">
                    {children}
                </div>
            )}
        </div>
    );
}

/** Empty state helper */
function EmptyState({ message }) {
    return (
        <p className="text-center text-kas-muted text-sm py-4">{message}</p>
    );
}

const STATUS_LABELS = {
    PENDING: 'Pendiente', PROCESSING: 'En proceso',
    SHIPPED: 'Enviado', DELIVERED: 'Entregado',
    COMPLETED: 'Completado', CANCELLED: 'Cancelado',
    RETURN_REQUESTED: 'Devolución solicitada',
    RETURNED: 'Devuelto',
};
const STATUS_COLORS = {
    PENDING: 'bg-yellow-50 text-yellow-700',
    PROCESSING: 'bg-blue-50 text-blue-700',
    SHIPPED: 'bg-purple-50 text-purple-700',
    DELIVERED: 'bg-green-50 text-green-700',
    COMPLETED: 'bg-green-50 text-green-700',
    CANCELLED: 'bg-red-50 text-red-700',
    RETURN_REQUESTED: 'bg-orange-50 text-orange-700',
    RETURNED: 'bg-neutral-100 text-neutral-700',
};

const PAYMENT_STATUS_LABELS = {
    approved: 'Aprobado',
    rejected: 'Rechazado',
    failed: 'Fallido',
    cancelled: 'Cancelado',
    pending: 'Pendiente',
    in_process: 'En proceso',
};

const PAYMENT_STATUS_COLORS = {
    approved: 'bg-green-50 text-green-700',
    rejected: 'bg-red-50 text-red-700',
    failed: 'bg-red-50 text-red-700',
    cancelled: 'bg-red-50 text-red-700',
    pending: 'bg-yellow-50 text-yellow-700',
    in_process: 'bg-blue-50 text-blue-700',
};

const CONFIRMED_ORDER_STATUSES = new Set([
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'COMPLETED',
    'RETURN_REQUESTED',
    'RETURNED',
]);

const REJECTED_PAYMENT_STATUSES = new Set(['rejected', 'failed', 'cancelled']);

const SUB_STATUS_LABELS = {
    PENDING: 'Pendiente', AUTHORIZED: 'Activa',
    PAUSED: 'Pausada', CANCELLED: 'Cancelada',
};
const SUB_STATUS_COLORS = {
    PENDING: 'bg-yellow-50 text-yellow-700',
    AUTHORIZED: 'bg-green-50 text-green-700',
    PAUSED: 'bg-orange-50 text-orange-700',
    CANCELLED: 'bg-red-50 text-red-700',
};

// ─── Address form (shared) ─────────────────────────────────────────────────
function AddressForm({ initial, onSave, onCancel, saving }) {
    const [form, setForm] = useState({
        address: initial.address || '',
        city:    initial.city    || '',
        state:   initial.state   || '',
        zipCode: initial.zipCode || '',
        phone:   initial.phone   || '',
    });
    const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    const inputClass = `w-full px-4 py-2.5 border border-surface-border rounded-lg
                        focus:ring-2 focus:ring-brand-red focus:border-transparent
                        transition-all text-sm`;
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-3">
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Calle y número *</label>
                <input name="address" required value={form.address} onChange={handle} className={inputClass} placeholder="Ej. Av. Reforma 123" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Ciudad *</label>
                    <input name="city" required value={form.city} onChange={handle} className={inputClass} placeholder="Guadalajara" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
                    <input name="state" value={form.state} onChange={handle} className={inputClass} placeholder="Jalisco" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Código postal *</label>
                    <input name="zipCode" required value={form.zipCode} onChange={handle} className={inputClass} placeholder="45000" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Teléfono</label>
                    <input name="phone" value={form.phone} onChange={handle} className={inputClass} placeholder="331234567" />
                </div>
            </div>
            <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-brand-red text-white text-sm font-medium
                               rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Guardar
                </button>
                <button type="button" onClick={onCancel}
                    className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600
                               text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                    <XIcon className="w-4 h-4" /> Cancelar
                </button>
            </div>
        </form>
    );
}

// ─── Main ProfilePage ──────────────────────────────────────────────────────
export default function ProfilePage() {
    const { user, isAuthenticated, logout, setUser } = useAuth();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [subs, setSubs]         = useState([]);
    const [orders, setOrders]     = useState([]);
    const [subsLoading, setSubsLoading]     = useState(true);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [cancellingId, setCancellingId]   = useState(null);
    const [cancellingOrderId, setCancellingOrderId] = useState(null);
    const [editingAddress, setEditingAddress] = useState(false);
    const [savingAddress, setSavingAddress]   = useState(false);

    // Auth guard
    useEffect(() => {
        if (!isAuthenticated) navigate('/', { replace: true });
    }, [isAuthenticated, navigate]);

    const loadSubscriptions = useCallback(async () => {
        try {
            setSubsLoading(true);
            const data = await getMySubscriptions();
            setSubs(Array.isArray(data) ? data : data.subscriptions ?? []);
        } catch { /* silently fail */ }
        finally { setSubsLoading(false); }
    }, []);

    const loadOrders = useCallback(async () => {
        try {
            setOrdersLoading(true);
            const data = await getMyOrders();
            setOrders(Array.isArray(data) ? data : []);
        } catch { /* silently fail */ }
        finally { setOrdersLoading(false); }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            loadSubscriptions();
            loadOrders();
        }
    }, [isAuthenticated, loadSubscriptions, loadOrders]);

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('¿Deseas cancelar este pedido? Esta acción no se puede deshacer.')) return;
        try {
            setCancellingOrderId(orderId);
            await cancelOrder(orderId, 'Cancelado por el cliente');
            addToast('Pedido cancelado correctamente.', 'success');
            loadOrders();
        } catch (err) {
            const msg = err?.response?.data?.message || 'No se pudo cancelar el pedido. Intenta de nuevo.';
            addToast(msg, 'error');
        } finally {
            setCancellingOrderId(null);
        }
    };

    const handleCancelSub = async (id) => {
        if (!window.confirm('¿Deseas cancelar esta suscripción?')) return;
        try {
            setCancellingId(id);
            await cancelSubscription(id);
            addToast('Suscripción cancelada correctamente.', 'success');
            loadSubscriptions();
        } catch {
            addToast('No se pudo cancelar la suscripción. Intenta de nuevo.', 'error');
        } finally {
            setCancellingId(null);
        }
    };

    const handleSaveAddress = async (formData) => {
        try {
            setSavingAddress(true);
            const updated = await updateProfile(formData);
            // Update local user state so checkout reflects the new address immediately
            setUser((prev) => ({ ...prev, ...updated }));
            setEditingAddress(false);
            addToast('Dirección guardada correctamente.', 'success');
        } catch {
            addToast('No se pudo guardar la dirección. Intenta de nuevo.', 'error');
        } finally {
            setSavingAddress(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const normalizePaymentStatus = (value) => String(value || '').trim().toLowerCase();
    const isRejectedPaymentOrder = (order) => REJECTED_PAYMENT_STATUSES.has(normalizePaymentStatus(order.paymentStatus));
    const isConfirmedOrder = (order) => {
        const paymentStatus = normalizePaymentStatus(order.paymentStatus);
        return paymentStatus === 'approved' || CONFIRMED_ORDER_STATUSES.has(order.status);
    };

    const hasAddress = user?.address && user.address.trim() !== '';
    const activeSubs      = subs.filter((s) => s.status === 'AUTHORIZED' || s.status === 'PENDING');
    const rejectedOrders  = orders.filter((o) => isRejectedPaymentOrder(o));
    const rejectedDisplayOrders = rejectedOrders;
    const confirmedOrders = orders.filter((o) => !isRejectedPaymentOrder(o) && isConfirmedOrder(o));
    const visibleOrdersCount = confirmedOrders.length + rejectedOrders.length;

    if (!isAuthenticated || !user) return null;

    return (
        <>
            <SEO title="Mi perfil" noIndex />

            <div className="container-main py-10 max-w-3xl mx-auto">

                {/* ── User Header ─────────────────────────────────── */}
                <div className="flex items-center gap-5 mb-8">
                    <div className="w-16 h-16 rounded-full bg-brand-red flex items-center justify-center shrink-0 shadow-md">
                        <span className="text-2xl font-extrabold text-white">
                            {user.firstName?.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-kas-text">
                            {user.firstName} {user.lastName}
                        </h1>
                        <p className="text-kas-muted text-sm">{user.email}</p>
                    </div>
                </div>

                <div className="space-y-4">

                    {/* ── 1. Suscripciones ────────────────────────── */}
                    <Accordion id="subs" title="Mis suscripciones" icon={RefreshCw} count={activeSubs.length}>
                        {subsLoading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                            </div>
                        ) : subs.length === 0 ? (
                            <EmptyState message="Aún no tienes suscripciones activas. ¡Suscríbete y recibe tus suplementos sin interrupciones!" />
                        ) : (
                            subs.map((sub) => (
                                <div key={sub.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between
                                               gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-kas-text text-sm truncate">
                                            {sub.product?.name ?? 'Producto'}
                                        </p>
                                        <p className="text-xs text-kas-muted mt-0.5">
                                            Cada {sub.billingDays} días · {formatPrice(sub.amount)}/ciclo
                                        </p>
                                        {sub.nextBillingDate && (
                                            <p className="text-xs text-kas-muted">
                                                Próximo cobro: {formatDate(sub.nextBillingDate)}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${SUB_STATUS_COLORS[sub.status]}`}>
                                            {SUB_STATUS_LABELS[sub.status] ?? sub.status}
                                        </span>
                                        {(sub.status === 'AUTHORIZED' || sub.status === 'PENDING') && (
                                            <button
                                                onClick={() => handleCancelSub(sub.id)}
                                                disabled={cancellingId === sub.id}
                                                className="text-xs px-3 py-1.5 rounded-lg border border-red-200
                                                           text-red-600 hover:bg-red-50 transition-colors
                                                           disabled:opacity-50"
                                            >
                                                {cancellingId === sub.id
                                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                                    : 'Cancelar'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </Accordion>

                    {/* ── 2. Historial de compras ────────────── */}
                    <Accordion id="orders" title="Historial de compras" icon={ShoppingBag} count={visibleOrdersCount}>
                        {ordersLoading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                            </div>
                        ) : (
                            <>
                                {/* ── Pedidos con pago rechazado ─────────── */}
                                {rejectedDisplayOrders.length > 0 && (
                                    <div className="space-y-2 mb-4">
                                        <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                                            Pago rechazado
                                        </p>
                                        {rejectedDisplayOrders.map((order) => {
                                            const paymentStatus = normalizePaymentStatus(order.paymentStatus);
                                            const paymentLabel = PAYMENT_STATUS_LABELS[paymentStatus] ?? (order.paymentStatus || 'Rechazado');
                                            const paymentColor = PAYMENT_STATUS_COLORS[paymentStatus] ?? 'bg-red-50 text-red-700';

                                            return (
                                            <div key={order.id}
                                                className="p-4 rounded-xl border border-red-200 bg-red-50 space-y-2">
                                                <div className="flex items-center justify-between flex-wrap gap-2">
                                                    <div>
                                                        <p className="text-xs text-red-600">Pedido con pago no aprobado</p>
                                                        <p className="font-bold text-kas-text text-sm">{order.orderNumber}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-kas-muted">{formatDate(order.createdAt)}</p>
                                                        <p className="font-semibold text-brand-red text-sm">{formatPrice(order.totalAmount)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${paymentColor}`}>
                                                        {paymentLabel}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-red-700">
                                                    El pago fue rechazado. Puedes cancelar este pedido e intentarlo de nuevo.
                                                </p>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <button
                                                        onClick={() => handleCancelOrder(order.id)}
                                                        disabled={cancellingOrderId === order.id}
                                                        className="text-xs px-3 py-1 rounded-lg border border-red-200
                                                                   text-red-600 hover:bg-red-50 transition-colors
                                                                   disabled:opacity-50 flex items-center gap-1"
                                                    >
                                                        {cancellingOrderId === order.id
                                                            ? <Loader2 className="w-3 h-3 animate-spin" />
                                                            : 'Cancelar pedido'}
                                                    </button>
                                                </div>
                                            </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* ── Pedidos confirmados ─────────────── */}
                                {confirmedOrders.length === 0 && rejectedDisplayOrders.length === 0 ? (
                                    <EmptyState message="No tienes pedidos aprobados para mostrar." />
                                ) : (
                                    confirmedOrders.map((order) => (
                                        <div key={order.id}
                                            className="p-4 rounded-xl border border-gray-100 bg-gray-50 space-y-3">
                                            {/* Order header */}
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <div>
                                                    <p className="text-xs text-kas-muted">Pedido</p>
                                                    <p className="font-bold text-kas-text text-sm">{order.orderNumber}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-kas-muted">{formatDate(order.createdAt)}</p>
                                                    <p className="font-semibold text-brand-red text-sm">{formatPrice(order.totalAmount)}</p>
                                                </div>
                                            </div>
                                            {/* Status + Cancel button */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                                    {STATUS_LABELS[order.status] ?? order.status}
                                                </span>
                                            </div>
                                            {/* Items */}
                                            <div className="divide-y divide-gray-100">
                                                {order.items?.map((item) => (
                                                    <div key={item.id}
                                                        className="flex items-center justify-between py-2 gap-3">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <Package className="w-4 h-4 text-gray-400 shrink-0" />
                                                            <span className="text-sm text-kas-text truncate">
                                                                {item.productNameSnap}
                                                                <span className="text-kas-muted"> × {item.quantity}</span>
                                                            </span>
                                                        </div>
                                                        {item.product?.slug && (
                                                            <Link
                                                                to={`/product/${item.product.slug}`}
                                                                className="text-xs font-medium text-kas-text underline hover:text-kas-secondary shrink-0"
                                                            >
                                                                Ver producto
                                                            </Link>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Track link */}
                                            {order.trackingToken && (
                                                <Link
                                                    to={`/order-tracking?token=${order.trackingToken}`}
                                                    className="text-xs text-kas-muted hover:text-kas-text underline transition-colors"
                                                >
                                                    Rastrear pedido →
                                                </Link>
                                            )}
                                        </div>
                                    ))
                                )}
                            </>
                        )}
                    </Accordion>

                    {/* ── 3. Dirección de entrega ──────────────────── */}
                    <Accordion id="address" title="Dirección de entrega" icon={MapPin}>
                        {editingAddress ? (
                            <AddressForm
                                initial={user}
                                onSave={handleSaveAddress}
                                onCancel={() => setEditingAddress(false)}
                                saving={savingAddress}
                            />
                        ) : hasAddress ? (
                            <div className="space-y-3">
                                {/* Saved address display */}
                                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                                    <p className="text-xs font-medium text-kas-muted uppercase tracking-wide mb-1">
                                        Dirección guardada
                                    </p>
                                    <p className="text-sm font-medium text-kas-text">
                                        {user.address}
                                    </p>
                                    <p className="text-sm text-kas-muted">
                                        {[user.city, user.state, user.zipCode].filter(Boolean).join(', ')}
                                    </p>
                                    {user.phone && (
                                        <p className="text-sm text-kas-muted mt-0.5">Tel. {user.phone}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => setEditingAddress(true)}
                                    className="inline-flex items-center gap-1.5 text-sm text-kas-text hover:underline font-medium"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Cambiar dirección de entrega
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-kas-muted">
                                    Agrega una dirección para agilizar tus próximas compras.
                                </p>
                                <button
                                    onClick={() => setEditingAddress(true)}
                                    className="inline-flex items-center gap-1.5 text-sm text-kas-text hover:underline font-medium"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Agregar dirección
                                </button>
                            </div>
                        )}
                    </Accordion>

                </div>{/* end accordion list */}

                {/* ── Logout ──────────────────────────────────────── */}
                <div className="mt-8">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2
                                   py-3.5 rounded-xl border-2 border-gray-200
                                   text-kas-secondary font-semibold text-sm
                                   hover:bg-gray-50 hover:text-kas-text hover:border-gray-300 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                    </button>
                </div>

            </div>
        </>
    );
}
