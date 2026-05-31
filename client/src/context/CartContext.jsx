import { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * Cart Context — manages shopping cart state across the app.
 *
 * Features:
 * - Add/remove/update items
 * - Persist to localStorage
 * - Calculate totals
 * - Sidebar open/close state
 */
const CartContext = createContext(null);

// Key for localStorage persistence
const CART_STORAGE_KEY = 'supplements-cart';
const AUTH_LOGOUT_EVENT = 'auth:logout';

/**
 * Load cart from localStorage (or return empty array).
 */
function loadCart() {
    try {
        const saved = localStorage.getItem(CART_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

export function CartProvider({ children }) {
    const [cart, setCart] = useState(loadCart);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Persist cart to localStorage whenever it changes
    useEffect(() => {
        if (cart.length === 0) {
            localStorage.removeItem(CART_STORAGE_KEY);
            return;
        }
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }, [cart]);

    // When auth logs out, wipe in-memory cart and persisted cart.
    useEffect(() => {
        const handleAuthLogout = () => {
            setCart([]);
            setIsSidebarOpen(false);
            localStorage.removeItem(CART_STORAGE_KEY);
        };

        window.addEventListener(AUTH_LOGOUT_EVENT, handleAuthLogout);
        return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleAuthLogout);
    }, []);

    /**
     * Add a product to the cart. If already in cart, increase quantity.
     */
    const addToCart = useCallback((product, quantity = 1) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.id === product.id);

            if (existing) {
                return prev.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }

            return [
                ...prev,
                {
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: product.discountPrice || product.price,
                    originalPrice: product.price,
                    imageUrl: product.imageUrl,
                    quantity,
                },
            ];
        });

        // Open sidebar when adding
        setIsSidebarOpen(true);
    }, []);

    /**
     * Remove a product from the cart entirely.
     */
    const removeFromCart = useCallback((productId) => {
        setCart((prev) => prev.filter((item) => item.id !== productId));
    }, []);

    /**
     * Update the quantity of a specific item.
     */
    const updateQuantity = useCallback((productId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCart((prev) =>
            prev.map((item) =>
                item.id === productId ? { ...item, quantity } : item
            )
        );
    }, [removeFromCart]);

    /**
     * Clear all items from the cart.
     */
    const clearCart = useCallback(() => {
        setCart([]);
        setIsSidebarOpen(false);
    }, []);

    // Calculated values
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const value = {
        cart,
        itemCount,
        subtotal,
        isSidebarOpen,
        setIsSidebarOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/**
 * Custom hook to access cart context.
 * Usage: const { cart, addToCart, subtotal } = useCart();
 */
export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
