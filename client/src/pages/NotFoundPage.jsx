import { Link } from 'react-router-dom';
import SEO from '../components/SEO.jsx';

/**
 * NotFoundPage — shown for any URL that doesn't match a route (catch-all *).
 */
export default function NotFoundPage() {
    return (
        <>
            <SEO title="Página no encontrada" noIndex />
            <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
                {/* Big 404 */}
                <p className="text-[8rem] font-extrabold leading-none text-brand-red opacity-15 select-none">
                    404
                </p>

                <div className="-mt-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-kas-text mb-3">
                        Esta página no existe
                    </h1>
                    <p className="text-kas-muted max-w-md mb-8">
                        La dirección que escribiste no está disponible. Puede que haya cambiado
                        o que haya un error en el enlace.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            to="/"
                            className="px-6 py-3 bg-brand-red text-white font-semibold rounded-xl
                                       hover:bg-red-700 transition-colors shadow-sm"
                        >
                            Ir al inicio
                        </Link>
                        <Link
                            to="/order-tracking"
                            className="px-6 py-3 border border-gray-300 text-kas-text font-medium
                                       rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Rastrear pedido
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
