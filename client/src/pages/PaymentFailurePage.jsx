import { Link, useSearchParams } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import SEO from '../components/SEO.jsx';

/**
 * PaymentFailurePage - shown when a payment fails.
 */
export default function PaymentFailurePage() {
    const [searchParams] = useSearchParams();
    const reason = searchParams.get('reason');
    const orderNumber = searchParams.get('orderNumber');
    const trackingToken = searchParams.get('trackingToken');

    return (
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <SEO title="Pago fallido" noIndex />
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-brand-dark mb-2">Pago fallido</h1>
                <p className="text-gray-500 mb-6">
                    {reason || 'No pudimos completar tu pago. Verifica tus datos e intenta nuevamente.'}
                </p>

                {orderNumber && (
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-6 text-left">
                        <p className="text-xs text-gray-400 uppercase">Pedido</p>
                        <p className="font-semibold text-kas-text">{orderNumber}</p>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <Link to="/checkout" className="btn-primary">
                        Intentar de nuevo
                    </Link>
                    {trackingToken && (
                        <Link
                            to={`/order-tracking?token=${encodeURIComponent(trackingToken)}`}
                            className="btn-secondary"
                        >
                            Ver estado del pedido
                        </Link>
                    )}
                    <Link to="/" className="btn-secondary">
                        Seguir comprando
                    </Link>
                </div>
            </div>
        </div>
    );
}
