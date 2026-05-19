import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';

/**
 * Footer — dark background (#111111), logo KAS, links, contacto y legal.
 */
export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="bg-brand-dark text-gray-400 mt-auto border-t border-brand-border">
            <div className="container-main py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">

                    {/* Brand — logo + tagline */}
                    <div className="sm:col-span-2 md:col-span-1">
                        <Link to="/" className="inline-block mb-4" aria-label="KAS Supplements - Inicio">
                            <img
                                src="/images/logo.png"
                                alt="KAS Supplements"
                                className="h-8 w-auto object-contain"
                            />
                        </Link>
                        <p className="text-sm leading-relaxed text-gray-500">
                            Suplementos premium para tus metas de salud y fitness.
                            Productos de calidad de marcas confiables.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 text-sm tracking-wide uppercase">
                            Navegación
                        </h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link to="/" className="hover:text-brand-red transition-colors">
                                    Inicio
                                </Link>
                            </li>
                            <li>
                                <Link to="/order-tracking" className="hover:text-brand-red transition-colors">
                                    Rastrear pedido
                                </Link>
                            </li>
                            <li>
                                <Link to="/my-subscriptions" className="hover:text-brand-red transition-colors">
                                    Mis suscripciones
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 text-sm tracking-wide uppercase">
                            Legal
                        </h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link to="/privacidad" className="hover:text-brand-red transition-colors">
                                    Aviso de Privacidad
                                </Link>
                            </li>
                            <li>
                                <Link to="/terminos" className="hover:text-brand-red transition-colors">
                                    Términos y Condiciones
                                </Link>
                            </li>
                        </ul>
                    </div>


                </div>

                {/* Bottom bar */}
                <div className="border-t border-brand-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
                    <p>© {year} KAS Supplements. Todos los derechos reservados.</p>
                    <div className="flex gap-4">
                        <Link to="/privacidad" className="hover:text-gray-400 transition-colors">
                            Privacidad
                        </Link>
                        <Link to="/terminos" className="hover:text-gray-400 transition-colors">
                            Términos
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
