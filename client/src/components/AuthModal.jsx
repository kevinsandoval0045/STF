import { useState, useEffect, useRef } from 'react';
import { X, Mail, Lock, User, Phone, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

/**
 * AuthModal — overlay modal with Login / Register tabs.
 * Triggered from the header icon or when a guest tries to checkout.
 *
 * Accessibility:
 * - role="dialog" + aria-modal
 * - Focus trapped on close button
 * - Closes on Escape key or backdrop click
 */
export default function AuthModal() {
    const {
        showAuthModal,
        setShowAuthModal,
        login,
        register,
        authRedirect,
        setAuthRedirect,
    } = useAuth();

    const navigate = useNavigate();
    const [tab, setTab] = useState('login'); // 'login' | 'register'
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const closeRef = useRef(null);

    // Login form
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });

    // Register form
    const [registerForm, setRegisterForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });

    // Reset state when modal opens/closes
    useEffect(() => {
        if (showAuthModal) {
            setError(null);
            setLoading(false);
            closeRef.current?.focus();
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showAuthModal]);

    // Escape key
    useEffect(() => {
        if (!showAuthModal) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showAuthModal]);

    const handleClose = () => {
        setShowAuthModal(false);
        setAuthRedirect(null);
        setError(null);
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await login(loginForm);
            // If there's a redirect path (e.g. checkout), navigate there
            if (authRedirect) {
                navigate(authRedirect);
                setAuthRedirect(null);
            }
        } catch (err) {
            setError(
                err.response?.data?.error?.message ||
                'Error al iniciar sesión. Inténtalo de nuevo.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (registerForm.password !== registerForm.confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        if (registerForm.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setLoading(true);

        try {
            await register({
                firstName: registerForm.firstName,
                lastName: registerForm.lastName,
                email: registerForm.email,
                phone: registerForm.phone,
                password: registerForm.password,
            });
            if (authRedirect) {
                navigate(authRedirect);
                setAuthRedirect(null);
            }
        } catch (err) {
            setError(
                err.response?.data?.error?.message ||
                'Error al crear la cuenta. Inténtalo de nuevo.'
            );
        } finally {
            setLoading(false);
        }
    };

    if (!showAuthModal) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity"
                onClick={handleClose}
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Autenticación"
                className="fixed inset-0 z-[61] flex items-center justify-center p-4"
            >
                <div
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden
                               animate-modal-in"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="relative bg-brand-dark p-6 pb-4">
                        <button
                            ref={closeRef}
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white
                                       rounded-lg hover:bg-white/10 transition-colors"
                            aria-label="Cerrar"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-bold text-white mb-1">
                            {tab === 'login' ? '¡Bienvenido de vuelta!' : 'Crear cuenta'}
                        </h2>
                        <p className="text-sm text-gray-400">
                            {tab === 'login'
                                ? 'Inicia sesión para continuar tu compra'
                                : 'Regístrate para disfrutar de todas las funciones'}
                        </p>

                        {/* Tabs */}
                        <div className="flex gap-1 mt-4 bg-white/10 rounded-lg p-1">
                            <button
                                onClick={() => { setTab('login'); setError(null); }}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                                    tab === 'login'
                                        ? 'bg-brand-red text-white shadow-md'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Iniciar sesión
                            </button>
                            <button
                                onClick={() => { setTab('register'); setError(null); }}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                                    tab === 'register'
                                        ? 'bg-brand-red text-white shadow-md'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Crear cuenta
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                        {/* Error */}
                        {error && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Login Form */}
                        {tab === 'login' && (
                            <form onSubmit={handleLoginSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Correo electrónico
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                                        <input
                                            type="email"
                                            required
                                            value={loginForm.email}
                                            onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                            placeholder="tu@email.com"
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg
                                                       focus:ring-2 focus:ring-brand-red focus:border-transparent
                                                       transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contraseña
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={loginForm.password}
                                            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                            placeholder="••••••••"
                                            className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg
                                                       focus:ring-2 focus:ring-brand-red focus:border-transparent
                                                       transition-all text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                                                       hover:text-gray-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary w-full flex items-center justify-center gap-2 py-3
                                               disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Entrando...
                                        </>
                                    ) : (
                                        'Iniciar sesión'
                                    )}
                                </button>
                            </form>
                        )}

                        {/* Register Form */}
                        {tab === 'register' && (
                            <form onSubmit={handleRegisterSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nombre *
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                required
                                                value={registerForm.firstName}
                                                onChange={(e) =>
                                                    setRegisterForm({ ...registerForm, firstName: e.target.value })
                                                }
                                                placeholder="Juan"
                                                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg
                                                           focus:ring-2 focus:ring-brand-red focus:border-transparent
                                                           transition-all text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Apellido *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={registerForm.lastName}
                                            onChange={(e) =>
                                                setRegisterForm({ ...registerForm, lastName: e.target.value })
                                            }
                                            placeholder="Pérez"
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg
                                                       focus:ring-2 focus:ring-brand-red focus:border-transparent
                                                       transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Correo electrónico *
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="email"
                                            required
                                            value={registerForm.email}
                                            onChange={(e) =>
                                                setRegisterForm({ ...registerForm, email: e.target.value })
                                            }
                                            placeholder="tu@email.com"
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg
                                                       focus:ring-2 focus:ring-brand-red focus:border-transparent
                                                       transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Teléfono
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="tel"
                                            value={registerForm.phone}
                                            onChange={(e) =>
                                                setRegisterForm({ ...registerForm, phone: e.target.value })
                                            }
                                            placeholder="+52 (555) 123-4567"
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg
                                                       focus:ring-2 focus:ring-brand-red focus:border-transparent
                                                       transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contraseña *
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            minLength={6}
                                            value={registerForm.password}
                                            onChange={(e) =>
                                                setRegisterForm({ ...registerForm, password: e.target.value })
                                            }
                                            placeholder="Mín. 6 caracteres"
                                            className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg
                                                       focus:ring-2 focus:ring-brand-red focus:border-transparent
                                                       transition-all text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                                                       hover:text-gray-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirmar contraseña *
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            minLength={6}
                                            value={registerForm.confirmPassword}
                                            onChange={(e) =>
                                                setRegisterForm({ ...registerForm, confirmPassword: e.target.value })
                                            }
                                            placeholder="Repite tu contraseña"
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg
                                                       focus:ring-2 focus:ring-brand-red focus:border-transparent
                                                       transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary w-full flex items-center justify-center gap-2 py-3
                                               disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Creando cuenta...
                                        </>
                                    ) : (
                                        'Crear cuenta'
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
