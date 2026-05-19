import { Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import SEO from '../components/SEO.jsx';

/**
 * PaymentFailurePage — shown when a payment fails.
 */
export default function PaymentFailurePage() {
    return (
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <SEO title="Pago fallido" noIndex />
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-brand-dark mb-2">Pago fallido</h1>
                <p className="text-gray-500 mb-6">
                    Algo salió mal con tu pago. Los artículos de tu carrito siguen guardados.
                </p>

                <div className="flex flex-col gap-3">
                    <Link to="/checkout" className="btn-primary">
                        Intentar de nuevo
                    </Link>
                    <Link to="/" className="btn-secondary">
                        Seguir comprando
                    </Link>
                </div>
            </div>
        </div>
    );
}
