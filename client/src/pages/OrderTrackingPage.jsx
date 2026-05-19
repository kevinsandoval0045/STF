import { useState } from 'react';
import { trackOrder } from '../services/apiService.js';
import { formatPrice, formatDate } from '../utils/formatters.js';
import { Search, Package, Loader2, MapPin, Clock, FileDown } from 'lucide-react';
import SEO from '../components/SEO.jsx';

/**
 * OrderTrackingPage — allows customers to track their order
 * by entering the tracking token.
 */

const STATUS_LABELS = {
    PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
    PROCESSING: { label: 'En proceso', color: 'bg-blue-100 text-blue-800' },
    SHIPPED: { label: 'Enviado', color: 'bg-indigo-100 text-indigo-800' },
    DELIVERED: { label: 'Entregado', color: 'bg-green-100 text-green-800' },
    COMPLETED: { label: 'Completado', color: 'bg-emerald-100 text-emerald-800' },
    CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
    RETURN_REQUESTED: { label: 'Devolución solicitada', color: 'bg-orange-100 text-orange-800' },
    RETURNED: { label: 'Devuelto', color: 'bg-gray-100 text-gray-800' },
};

export default function OrderTrackingPage() {
    const [token, setToken] = useState('');
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleTrack = async (e) => {
        e.preventDefault();
        if (!token.trim()) return;

        setLoading(true);
        setError(null);
        setOrder(null);

        try {
            const data = await trackOrder(token.trim());
            setOrder(data);
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Pedido no encontrado. Por favor verifica tu código de seguimiento.');
        } finally {
            setLoading(false);
        }
    };

    const statusInfo = order ? STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-800' } : null;

    return (
        <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="text-center mb-8">
                <SEO title="Rastrear tu pedido" noIndex />
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h1 className="text-2xl font-bold text-brand-dark">Rastrear tu pedido</h1>
                <p className="text-gray-500 mt-1">Ingresa tu código de seguimiento para ver el estado de tu pedido</p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleTrack} className="flex gap-2 mb-8">
                <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Ingresa tu código de seguimiento..."
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg
                     focus:ring-2 focus:ring-brand-red focus:border-transparent
                     transition-all"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex items-center gap-2 px-6"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    Rastrear
                </button>
            </form>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
                    {error}
                </div>
            )}

            {/* Order Details */}
            {order && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b bg-gray-50">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                                <p className="text-sm text-gray-500">Número de pedido</p>
                                <p className="text-lg font-bold text-brand-dark">{order.orderNumber}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusInfo.color}`}>
                                    {statusInfo.label}
                                </span>
                                {/* Download PDF receipt button */}
                                <a
                                    href={`/api/v1/orders/receipt/${token}`}
                                    download={`comprobante-${order.orderNumber}.pdf`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                                               text-sm font-medium border border-gray-300 text-gray-600
                                               hover:bg-gray-100 hover:border-gray-400 transition-colors"
                                    title="Descargar comprobante de pago en PDF"
                                >
                                    <FileDown className="w-4 h-4" />
                                    Comprobante PDF
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="p-6 border-b">
                        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Productos</h3>
                        <div className="space-y-2">
                            {order.items.map((item, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                    <span className="text-gray-700">{item.productName} × {item.quantity}</span>
                                    <span className="font-medium">{formatPrice(item.unitPrice * item.quantity)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t mt-3 pt-3 space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Envío</span>
                                <span>{order.shippingCost === 0 ? 'Gratis' : formatPrice(order.shippingCost)}</span>
                            </div>
                            <div className="flex justify-between font-semibold">
                                <span>Total</span>
                                <span className="text-brand-red font-bold">{formatPrice(order.totalAmount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Info */}
                    {order.shippingCarrier && (
                        <div className="p-6 border-b">
                            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" /> Envío
                            </h3>
                            <p className="text-sm text-gray-700">
                                {order.shippingCarrier} — Seguimiento: {order.shippingTrackNo || 'Aún no disponible'}
                            </p>
                        </div>
                    )}

                    {/* Timeline */}
                    {order.history && order.history.length > 0 && (
                        <div className="p-6">
                            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                <Clock className="w-4 h-4" /> Historial
                            </h3>
                            <div className="space-y-3">
                                {order.history.map((event, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${i === order.history.length - 1 ? 'bg-brand-red' : 'bg-gray-300'
                                            }`} />
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">
                                                {STATUS_LABELS[event.status]?.label || event.status}
                                            </p>
                                            <p className="text-xs text-gray-400">{formatDate(event.date)}</p>
                                            {event.note && <p className="text-xs text-gray-500 mt-0.5">{event.note}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
