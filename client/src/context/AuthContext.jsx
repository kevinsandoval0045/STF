import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { registerUser, loginUser, getUserProfile } from '../services/apiService.js';
import { useToast } from './ToastContext.jsx';

/**
 * Auth Context — manages user authentication state.
 *
 * Features:
 * - Register / Login / Logout
 * - Persist JWT in localStorage
 * - Auto-load profile on mount if token exists
 * - Global state: user, isAuthenticated, loading
 * - showAuthModal flag for opening the modal from anywhere
 */
const AuthContext = createContext(null);

const TOKEN_KEY = 'auth-token';
const CART_STORAGE_KEY = 'supplements-cart';
const AUTH_LOGOUT_EVENT = 'auth:logout';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authRedirect, setAuthRedirect] = useState(null); // path to redirect after login
    const { addToast } = useToast();

    const isAuthenticated = !!user;

    /**
     * On mount, check if a token exists and load the user profile.
     */
    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            getUserProfile()
                .then((profile) => setUser(profile))
                .catch(() => {
                    // Token expired or invalid
                    localStorage.removeItem(TOKEN_KEY);
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    /**
     * Register a new user.
     */
    const register = useCallback(async (userData) => {
        const { user: newUser, token } = await registerUser(userData);
        localStorage.setItem(TOKEN_KEY, token);
        setUser(newUser);
        addToast(`¡Bienvenido/a, ${newUser.firstName}!`, 'success');
        setShowAuthModal(false);
        return newUser;
    }, [addToast]);

    /**
     * Login with email and password.
     */
    const login = useCallback(async (credentials) => {
        const { user: loggedInUser, token } = await loginUser(credentials);
        localStorage.setItem(TOKEN_KEY, token);
        setUser(loggedInUser);
        addToast(`¡Hola de nuevo, ${loggedInUser.firstName}!`, 'success');
        setShowAuthModal(false);
        return loggedInUser;
    }, [addToast]);

    /**
     * Logout — clear token and user state.
     */
    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(CART_STORAGE_KEY);
        window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
        setUser(null);
        setAuthRedirect(null);
        addToast('Sesión cerrada correctamente.', 'info');
    }, [addToast]);

    /**
     * Open auth modal, optionally to redirect after login.
     */
    const requireAuth = useCallback((redirectPath = null) => {
        if (isAuthenticated) return true;
        setAuthRedirect(redirectPath);
        setShowAuthModal(true);
        return false;
    }, [isAuthenticated]);

    const value = {
        user,
        isAuthenticated,
        loading,
        showAuthModal,
        setShowAuthModal,
        authRedirect,
        setAuthRedirect,
        register,
        login,
        logout,
        requireAuth,
        setUser, // expose so components can update local user state (e.g. after profile update)
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to access auth context.
 * Usage: const { user, login, logout, isAuthenticated } = useAuth();
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
