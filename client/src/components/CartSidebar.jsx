import { useEffect, useRef } from 'react';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatPrice } from '../utils/formatters.js';

/**
 * CartSidebar — slide-out panel showing cart contents.
 * Opens from the right side when triggered.
 *
 * Accessibility:
 * - role="dialog" + aria-modal for screen readers
 * - Focus trapped: auto-focuses close button on open
 * - Closes on Escape key
 */
export default function CartSidebar() {
    const {
        cart,
        itemCount,
        subtotal,
        isSidebarOpen,
        setIsSidebarOpen,
        removeFromCart,
        updateQuantity,
        clearCart,
    } = useCart();

    const { isAuthenticated, requireAuth } = useAuth();
    const navigate = useNavigate();
    const closeRef = useRef(null);

    /**
     * Handle checkout click — if user is not authenticated,
     * open auth modal with redirect to /checkout.
     */
    const handleCheckout = () => {
        setIsSidebarOpen(false);
        if (!isAuthenticated) {
            requireAuth('/checkout');
            return;
        }
        navigate('/checkout');
    };

    // Focus management + Escape key
    useEffect(() => {
        if (!isSidebarOpen) return;

        // Auto-focus close button
        closeRef.current?.focus();

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsSidebarOpen(false);
        };

        document.addEventListener('keydown', handleKeyDown);
        // Prevent body scroll while sidebar is open
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isSidebarOpen, setIsSidebarOpen]);

    if (!isSidebarOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                onClick={() => setIsSidebarOpen(false)}
                aria-hidden="true"
            />

            {/* Sidebar Panel */}
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Carrito de compras"
                className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl
                      flex flex-col animate-slide-in"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-gray-500" />
                        <h2 className="text-lg font-bold text-kas-text">
                            Carrito ({itemCount})
                        </h2>
                    </div>
                    <button
                        ref={closeRef}
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Cerrar carrito"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <ShoppingBag className="w-16 h-16 mb-4 opacity-30" />
                            <p className="text-lg font-medium">Tu carrito está vacío</p>
                            <p className="text-sm mt-1">¡Agrega algunos suplementos!</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div
                                key={item.id}
                                className="flex gap-3 bg-gray-50 rounded-lg p-3"
                            >
                                {/* Product Image */}
                                <img
                                    src={item.imageUrl || 'https://placehold.co/80x80?text=No+Image'}
                                    alt={item.name}
                                    className="w-20 h-20 object-cover rounded-lg"
                                />

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-medium text-brand-dark truncate">
                                        {item.name}
                                    </h3>
                                    <p className="text-sm font-bold text-brand-red mt-1">
                                        {formatPrice(item.price)}
                                    </p>

                                    {/* Quantity Controls */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            aria-label={`Disminuir cantidad de ${item.name}`}
                                            className="w-7 h-7 flex items-center justify-center rounded
                                 bg-gray-200 hover:bg-gray-300 transition-colors"
                                        >
                                            <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="text-sm font-medium w-6 text-center" aria-label={`Cantidad: ${item.quantity}`}>
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            aria-label={`Aumentar cantidad de ${item.name}`}
                                            className="w-7 h-7 flex items-center justify-center rounded
                                 bg-gray-200 hover:bg-gray-300 transition-colors"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Remove */}
                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="self-start p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                    aria-label={`Eliminar ${item.name} del carrito`}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer — Subtotal + Checkout */}
                {cart.length > 0 && (
                    <div className="border-t p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="text-xl font-bold text-kas-text">
                                {formatPrice(subtotal)}
                            </span>
                        </div>
                        <button
                            onClick={handleCheckout}
                            className="btn-primary block text-center w-full"
                        >
                            Ir a pagar
                        </button>
                        <button
                            onClick={clearCart}
                            className="w-full text-sm text-gray-500 hover:text-red-500 transition-colors py-1"
                        >
                            Vaciar carrito
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
