import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getMySubscriptions, cancelSubscription } from '../services/apiService.js';
import { formatPrice } from '../utils/formatters.js';
import { Loader2, RefreshCw, XCircle, Calendar, Package, ArrowRight, AlertTriangle } from 'lucide-react';
import SEO from '../components/SEO.jsx';

const STATUS_CONFIG = {
    PENDING:    { label: 'Pendiente',   color: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
    AUTHORIZED: { label: 'Activa',      color: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
    PAUSED:     { label: 'Pausada',     color: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500' },
    CANCELLED:  { label: 'Cancelada',   color: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
};

/**
 * MySubscriptionsPage — lists all subscriptions for the authenticated user.
 *
 * URL: /my-subscriptions
 */
export default function MySubscriptionsPage() {
    const { isAuthenticated, requireAuth } = useAuth();
    const navigate = useNavigate();

    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState(null);
    const [confirmCancel, setConfirmCancel] = useState(null);
    const [error, setError] = useState(null);

    // Auth guard
    useEffect(() => {
        if (!isAuthenticated) {
            requireAuth('/my-subscriptions');
            navigate('/', { replace: true });
        }
    }, [isAuthenticated]);

    // Fetch subscriptions
    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await getMySubscriptions();
                setSubscriptions(data);
            } catch {
                setError('Error al cargar tus suscripciones');
            } finally {
                setLoading(false);
            }
        };
        if (isAuthenticated) fetch();
    }, [isAuthenticated]);

    const handleCancel = async (id) => {
        setCancellingId(id);
        setError(null);
        try {
            await cancelSubscription(id);
            setSubscriptions(prev =>
                prev.map(s => s.id === id ? { ...s, status: 'CANCELLED' } : s)
            );
            setConfirmCancel(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cancelar la suscripción');
        } finally {
            setCancellingId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-kas-bg">
                <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
            </div>
        );
    }

    return (
        <>
            <SEO title="Mis Suscripciones | KAS Supplements" />
            <div className="min-h-screen bg-kas-bg py-8">
                <div className="container-main max-w-4xl">

                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-kas-text">
                                Mis Suscripciones
                            </h1>
                            <p className="text-kas-muted text-sm mt-1">
                                Gestiona tus entregas recurrentes
                            </p>
                        </div>
                        <Link
                            to="/"
                            className="text-sm text-brand-red hover:text-brand-red-dark font-medium transition-colors"
                        >
                            Ver productos
                        </Link>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    {subscriptions.length === 0 ? (
                        /* ── Empty state ──────────────────────────── */
                        <div className="bg-white rounded-2xl border border-surface-border p-12 text-center">
                            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                <RefreshCw className="w-8 h-8 text-gray-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-kas-text mb-2">
                                No tienes suscripciones
                            </h2>
                            <p className="text-kas-muted text-sm mb-6">
                                Suscríbete a tus productos favoritos para recibirlos automáticamente
                            </p>
                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-red text-white
                                         font-semibold rounded-xl hover:bg-brand-red-dark transition-all
                                         shadow-lg shadow-red-500/20"
                            >
                                Explorar productos
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    ) : (
                        /* ── Subscription list ───────────────────── */
                        <div className="space-y-4">
                            {subscriptions.map((sub) => {
                                const status = STATUS_CONFIG[sub.status] || STATUS_CONFIG.PENDING;
                                const mainImage = sub.product?.images?.[0]?.url || sub.product?.imageUrl || '/images/placeholder.png';
                                const canCancel = sub.status === 'PENDING' || sub.status === 'AUTHORIZED';

                                return (
                                    <div
                                        key={sub.id}
                                        className="bg-white rounded-2xl border border-surface-border p-5 md:p-6
                                                   hover:shadow-md transition-shadow duration-200"
                                    >
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            {/* Product image */}
                                            <img
                                                src={mainImage}
                                                alt={sub.product?.name}
                                                className="w-20 h-20 rounded-xl object-cover bg-gray-100 shrink-0"
                                            />

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div>
                                                        <h3 className="font-semibold text-kas-text truncate">
                                                            {sub.product?.name}
                                                        </h3>
                                                        <p className="text-xs text-kas-muted mt-0.5">
                                                            {sub.quantity} {sub.quantity === 1 ? 'unidad' : 'unidades'} por envío
                                                        </p>
                                                    </div>
                                                    {/* Status badge */}
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${status.color}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                                                        {status.label}
                                                    </span>
                                                </div>

                                                {/* Details row */}
                                                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-kas-secondary mt-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5 text-brand-red" />
                                                        <span>Cada <strong>{sub.billingDays} días</strong></span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Package className="w-3.5 h-3.5 text-brand-red" />
                                                        <span><strong>{formatPrice(Number(sub.amount))}</strong> / envío</span>
                                                    </div>
                                                    {sub.nextBillingDate && (
                                                        <div className="flex items-center gap-1.5">
                                                            <RefreshCw className="w-3.5 h-3.5 text-brand-red" />
                                                            <span>Próximo: <strong>{new Date(sub.nextBillingDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Cancel button */}
                                        {canCancel && (
                                            <div className="mt-4 pt-4 border-t border-surface-border flex justify-end">
                                                {confirmCancel === sub.id ? (
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm text-kas-muted flex items-center gap-1.5">
                                                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                                                            ¿Estás seguro?
                                                        </span>
                                                        <button
                                                            onClick={() => handleCancel(sub.id)}
                                                            disabled={cancellingId === sub.id}
                                                            className="px-4 py-1.5 text-sm font-medium text-white bg-red-600
                                                                     rounded-lg hover:bg-red-700 transition-colors
                                                                     disabled:opacity-50 flex items-center gap-1.5"
                                                        >
                                                            {cancellingId === sub.id ? (
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <XCircle className="w-3.5 h-3.5" />
                                                            )}
                                                            Sí, cancelar
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmCancel(null)}
                                                            className="px-4 py-1.5 text-sm text-kas-muted hover:text-kas-text transition-colors"
                                                        >
                                                            No
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setConfirmCancel(sub.id)}
                                                        className="text-sm text-kas-muted hover:text-red-600 transition-colors
                                                                 flex items-center gap-1.5"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                        Cancelar suscripción
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
