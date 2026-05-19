import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { CheckCircle, Clock, Copy, ExternalLink } from 'lucide-react';
import SEO from '../components/SEO.jsx';
import { formatPrice } from '../utils/formatters.js';
import { useState } from 'react';

/**
 * PaymentSuccessPage — shown after a successful (or pending) payment.
 *
 * Can receive data two ways:
 * 1. React Router state (navigate from old flow, kept for compatibility)
 * 2. Query params from Mercado Pago back_url redirect:
 *    /payment-success?orderNumber=...&trackingToken=...&pending=true
 */
export default function PaymentSuccessPage() {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [copied, setCopied] = useState(false);

    // Prefer query params (MP redirect) over router state
    const orderNumber  = searchParams.get('orderNumber')  || location.state?.orderNumber;
    const trackingToken = searchParams.get('trackingToken') || location.state?.trackingToken;
    const totalAmount  = location.state?.totalAmount ?? null;
    const isPending    = searchParams.get('pending') === 'true';

    const copyToken = () => {
        if (trackingToken) {
            navigator.clipboard.writeText(trackingToken);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!orderNumber) {
        return (
            <div className="max-w-lg mx-auto px-4 py-20 text-center">
                <p className="text-gray-500">No hay información del pedido disponible.</p>
                <Link to="/" className="mt-4 btn-secondary inline-block">Ir al inicio</Link>
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <SEO title={isPending ? 'Pago pendiente' : 'Pedido realizado con éxito'} noIndex />

                {isPending ? (
                    <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                ) : (
                    <CheckCircle className="w-16 h-16 text-brand-red mx-auto mb-4" />
                )}

                <h1 className="text-2xl font-bold text-brand-dark mb-2">
                    {isPending ? 'Pago pendiente' : '¡Pedido realizado!'}
                </h1>
                <p className="text-gray-500 mb-6">
                    {isPending
                        ? 'Tu pago está siendo procesado. Te notificaremos cuando se confirme.'
                        : 'Gracias por tu compra. Tu pedido está siendo preparado.'}
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3 text-left">
                    <div>
                        <p className="text-xs text-gray-400 uppercase">Número de pedido</p>
                        <p className="text-lg font-bold text-brand-dark">{orderNumber}</p>
                    </div>
                    {totalAmount && (
                        <div>
                            <p className="text-xs text-gray-400 uppercase">Total</p>
                            <p className="text-lg font-bold text-kas-text">{formatPrice(totalAmount)}</p>
                        </div>
                    )}
                    {trackingToken && (
                        <div>
                            <p className="text-xs text-gray-400 uppercase mb-1">Código de seguimiento</p>
                            <div className="flex items-center gap-2">
                                <code className="text-xs bg-white px-3 py-1.5 rounded border text-gray-700 break-all flex-1">
                                    {trackingToken}
                                </code>
                                <button
                                    onClick={copyToken}
                                    className="p-1.5 hover:bg-gray-200 rounded transition-colors shrink-0"
                                    title="Copiar código"
                                >
                                    <Copy className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                            {copied && <p className="text-xs text-brand-red mt-1">¡Copiado!</p>}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3">
                    <Link
                        to="/order-tracking"
                        className="btn-primary flex items-center justify-center gap-2"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Rastrear tu pedido
                    </Link>
                    <Link to="/" className="btn-secondary">
                        Seguir comprando
                    </Link>
                </div>
            </div>
        </div>
    );
}
