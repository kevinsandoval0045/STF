import axios from 'axios';

/**
 * API Service — centralized Axios instance.
 * All API calls go through this module so we have a single
 * place to configure base URL, headers, and error handling.
 *
 * In development, Vite's proxy forwards /api to localhost:8080.
 * In production, set VITE_API_URL to the real API base.
 */
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api/v1',
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
});

// ─── Auth Interceptor — Request ────────────────────────
// Automatically attach JWT token to every request if available.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth-token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ─── Auth Interceptor — Response ───────────────────────
// If the server returns 401 (token expired / invalid), clear the stored
// token and reload the page so the user is returned to a clean state.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const hadToken = !!localStorage.getItem('auth-token');
            localStorage.removeItem('auth-token');
            // Only hard-reload if the user was previously "logged in"
            // to avoid an infinite loop on the login form itself.
            if (hadToken) {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

// ─── Auth ──────────────────────────────────────────────

export const registerUser = async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    return data;
};

export const loginUser = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    return data;
};

export const getUserProfile = async () => {
    const { data } = await api.get('/auth/profile');
    return data;
};

// ─── Products ──────────────────────────────────────────

export const getProducts = async (filters = {}) => {
    const params = {};
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.brandId) params.brandId = filters.brandId;
    const { data } = await api.get('/products', { params });
    return data.data;
};

export const getProductBySlug = async (slug) => {
    const { data } = await api.get(`/products/${slug}`);
    return data;
};

export const getProductById = async (id) => {
    const { data } = await api.get(`/products/id/${id}`);
    return data;
};

// ─── Categories ────────────────────────────────────────

export const getCategories = async () => {
    const { data } = await api.get('/categories');
    return data.data;
};

// ─── Brands ────────────────────────────────────────────

export const getBrands = async () => {
    const { data } = await api.get('/brands');
    return data.data;
};

// ─── Orders ────────────────────────────────────────────

export const createOrder = async (orderData) => {
    const { data } = await api.post('/orders/checkout', orderData);
    return data;
};

export const trackOrder = async (token) => {
    const { data } = await api.get(`/orders/track/${token}`);
    return data;
};

export const cancelOrder = async (orderId, reason) => {
    const { data } = await api.post(`/orders/${orderId}/cancel`, { reason });
    return data;
};

/**
 * Get order history for the authenticated user.
 */
export const getMyOrders = async () => {
    const { data } = await api.get('/orders/my-orders');
    return data;
};

/**
 * Update the authenticated user's profile (address, phone, etc.).
 */
export const updateProfile = async (profileData) => {
    const { data } = await api.put('/auth/profile', profileData);
    return data;
};


// ─── Reviews ───────────────────────────────────────────

/**
 * Get all reviews for a product by its slug.
 * Returns { reviews, count, average }
 */
export const getProductReviews = async (slug) => {
    const { data } = await api.get(`/products/${slug}/reviews`);
    return data;
};

/**
 * Create a review for a product.
 * Requires authentication (JWT) and a verified purchase.
 */
export const createReview = async (slug, { rating, content }) => {
    const { data } = await api.post(`/products/${slug}/reviews`, { rating, content });
    return data;
};

// ─── Subscriptions ─────────────────────────────────────

/**
 * Create a new subscription for a product.
 * Requires authentication.
 * Returns { initPoint, subscriptionId }
 */
export const createSubscription = async (subscriptionData) => {
    const { data } = await api.post('/subscriptions', subscriptionData);
    return data;
};

/**
 * Get all subscriptions for the authenticated user.
 */
export const getMySubscriptions = async () => {
    const { data } = await api.get('/subscriptions/my');
    return data;
};

/**
 * Cancel a subscription by ID.
 * Requires authentication.
 */
export const cancelSubscription = async (id) => {
    const { data } = await api.post(`/subscriptions/${id}/cancel`);
    return data;
};

// ─── Settings ──────────────────────────────────────────

export const getSettings = async () => {
    const { data } = await api.get('/settings');
    return data;
};

export default api;
