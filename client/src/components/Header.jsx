import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Menu, X, User } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Header — top navigation bar.
 * Dark background (#111111) con logo KAS, búsqueda, nav y carrito.
 */
export default function Header() {
    const { itemCount, setIsSidebarOpen } = useCart();
    const { user, isAuthenticated, setShowAuthModal } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
            setMobileMenuOpen(false);
        }
    };


    return (
        <header className="sticky top-0 z-50 bg-brand-dark shadow-xl border-b border-brand-border">
            <div className="container-main">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <Link to="/" className="flex items-center shrink-0" aria-label="Inicio">
                        <img
                            src="/images/logo.png"
                            alt="Logo"
                            className="h-9 w-auto object-contain"
                        />
                    </Link>

                    {/* Search Bar — desktop */}
                    <form
                        onSubmit={handleSearch}
                        role="search"
                        className="hidden md:flex flex-1 max-w-md mx-8"
                    >
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder="Buscar suplementos..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                aria-label="Buscar suplementos"
                                className="w-full pl-4 pr-10 py-2 rounded-lg
                                           bg-brand-dark-2 text-white placeholder-gray-500
                                           border border-brand-border
                                           focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red
                                           transition-all duration-200 text-sm"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                aria-label="Buscar"
                            >
                                <Search className="w-4 h-4" />
                            </button>
                        </div>
                    </form>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-5" aria-label="Navegación principal">
                        <Link
                            to="/"
                            className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
                        >
                            Inicio
                        </Link>
                        <Link
                            to="/order-tracking"
                            className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
                        >
                            Rastrear pedido
                        </Link>

                        {/* User Auth Button */}
                        <div className="relative">
                            {isAuthenticated ? (
                                <button
                                    onClick={() => navigate('/perfil')}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                               bg-brand-dark-2 text-gray-300 hover:bg-brand-border
                                               border border-brand-border
                                               transition-all duration-200 text-sm font-medium"
                                    aria-label="Ir a mi perfil"
                                >
                                    <div className="w-6 h-6 rounded-full bg-brand-red flex items-center justify-center">
                                        <span className="text-xs font-bold text-white">
                                            {user.firstName?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="max-w-[100px] truncate">{user.firstName}</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowAuthModal(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                               bg-brand-red text-white hover:bg-brand-red-dark
                                               transition-all duration-200 text-sm font-semibold shadow-sm"
                                    aria-label="Iniciar sesión"
                                >
                                    <User className="w-4 h-4" />
                                    <span>Ingresar</span>
                                </button>
                            )}
                        </div>

                        {/* Cart Button */}
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="relative p-2 text-gray-400 hover:text-white transition-colors"
                            aria-label="Abrir carrito"
                        >
                            <ShoppingCart className="w-6 h-6" />
                            {itemCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-brand-red text-white
                               text-xs font-bold w-5 h-5 rounded-full
                               flex items-center justify-center">
                                    {itemCount}
                                </span>
                            )}
                        </button>
                    </nav>

                    {/* Mobile: user + cart + hamburger */}
                    <div className="flex items-center gap-2 md:hidden">
                        {isAuthenticated ? (
                            <button
                                onClick={() => navigate('/perfil')}
                                className="p-2"
                                aria-label="Ir a mi perfil"
                            >
                                <div className="w-7 h-7 rounded-full bg-brand-red flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">
                                        {user.firstName?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowAuthModal(true)}
                                className="p-2 text-gray-400 hover:text-white transition-colors"
                                aria-label="Iniciar sesión"
                            >
                                <User className="w-6 h-6" />
                            </button>
                        )}

                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="relative p-2 text-gray-400 hover:text-white transition-colors"
                            aria-label="Abrir carrito"
                        >
                            <ShoppingCart className="w-6 h-6" />
                            {itemCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-brand-red text-white
                               text-xs font-bold w-5 h-5 rounded-full
                               flex items-center justify-center">
                                    {itemCount}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                            aria-label="Abrir/cerrar menú"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden pb-4 border-t border-brand-border mt-2 pt-4 space-y-3">
                        <form onSubmit={handleSearch} role="search">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar suplementos..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    aria-label="Buscar suplementos"
                                    className="w-full pl-4 pr-10 py-2 rounded-lg
                                               bg-brand-dark-2 text-white placeholder-gray-500
                                               border border-brand-border
                                               focus:outline-none focus:ring-2 focus:ring-brand-red text-sm"
                                />
                                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
                                    <Search className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                        <Link
                            to="/"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block text-gray-400 hover:text-white py-1 text-sm font-medium transition-colors"
                        >
                            Inicio
                        </Link>
                        <Link
                            to="/order-tracking"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block text-gray-400 hover:text-white py-1 text-sm font-medium transition-colors"
                        >
                            Rastrear pedido
                        </Link>

                        {isAuthenticated ? (
                            <div className="border-t border-brand-border pt-3 mt-3">
                                <p className="text-xs text-gray-500 mb-2">
                                    Sesión: {user.firstName} {user.lastName}
                                </p>
                                <Link
                                    to="/perfil"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white py-1 transition-colors"
                                >
                                    <User className="w-4 h-4" />
                                    Mi perfil
                                </Link>
                            </div>
                        ) : (
                            <button
                                onClick={() => { setShowAuthModal(true); setMobileMenuOpen(false); }}
                                className="flex items-center gap-2 text-sm text-brand-red font-medium py-1"
                            >
                                <User className="w-4 h-4" />
                                Iniciar sesión / Registrarse
                            </button>
                        )}
                    </div>
                )}

            </div>
        </header>
    );
}
