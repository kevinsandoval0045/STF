import { Link } from 'react-router-dom';
import { CheckCircle, RefreshCw, ArrowRight, Clock } from 'lucide-react';
import SEO from '../components/SEO.jsx';

/**
 * SubscriptionSuccessPage — back_url de Mercado Pago después de que el usuario
 * completa la configuración de su suscripción.
 *
 * URL: /subscription-success
 */
export default function SubscriptionSuccessPage() {
    return (
        <>
            <SEO title="Suscripción creada | KAS Supplements" />
            <div className="min-h-screen bg-kas-bg flex items-center justify-center py-12 px-4">
                <div className="max-w-lg w-full text-center">

                    {/* Success icon */}
                    <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6
                                    animate-[scale-in_0.4s_ease-out]">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>

                    <h1 className="text-2xl md:text-3xl font-bold text-kas-text mb-3">
                        ¡Suscripción creada! 🎉
                    </h1>

                    <p className="text-kas-muted text-base mb-8 leading-relaxed">
                        Tu suscripción ha sido registrada exitosamente. Mercado Pago procesará
                        tu primer pago y comenzaremos a preparar tu envío.
                    </p>

                    {/* Info cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        <div className="bg-white rounded-xl border border-surface-border p-4 text-left">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-5 h-5 text-amber-500" />
                                <span className="text-sm font-semibold text-kas-text">Primer cobro</span>
                            </div>
                            <p className="text-xs text-kas-muted">
                                Mercado Pago procesará tu primer pago en las próximas horas.
                                Recibirás una notificación cuando se confirme.
                            </p>
                        </div>
                        <div className="bg-white rounded-xl border border-surface-border p-4 text-left">
                            <div className="flex items-center gap-2 mb-2">
                                <RefreshCw className="w-5 h-5 text-gray-500" />
                                <span className="text-sm font-semibold text-kas-text">Renovación</span>
                            </div>
                            <p className="text-xs text-kas-muted">
                                Los siguientes cobros se realizarán automáticamente según
                                la frecuencia del producto. Puedes cancelar en cualquier momento.
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            to="/my-subscriptions"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-red text-white
                                     font-semibold rounded-xl hover:bg-brand-red-dark transition-all duration-200
                                     shadow-lg shadow-red-500/20"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Ver mis suscripciones
                        </Link>
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-kas-text
                                     font-semibold rounded-xl border border-surface-border
                                     hover:bg-gray-50 transition-all duration-200"
                        >
                            Seguir comprando
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
