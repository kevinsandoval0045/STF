import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import CartSidebar from './components/CartSidebar.jsx';
import AuthModal from './components/AuthModal.jsx';
import { Loader2 } from 'lucide-react';

// ─── Lazy-loaded pages (code-splitting) ────────────────
const Home = lazy(() => import('./pages/Home.jsx'));
const ProductDetail = lazy(() => import('./pages/ProductDetail.jsx'));
const CategoryPage = lazy(() => import('./pages/CategoryPage.jsx'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.jsx'));
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage.jsx'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage.jsx'));
const PaymentFailurePage = lazy(() => import('./pages/PaymentFailurePage.jsx'));
const SubscriptionCheckoutPage = lazy(() => import('./pages/SubscriptionCheckoutPage.jsx'));
const SubscriptionSuccessPage = lazy(() => import('./pages/SubscriptionSuccessPage.jsx'));
const MySubscriptionsPage = lazy(() => import('./pages/MySubscriptionsPage.jsx'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage.jsx'));
const TermsPage = lazy(() => import('./pages/TermsPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage.jsx'));

/**
 * Full-page loading spinner shown while lazy chunks download.
 */
function PageLoader() {
    return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
            <span className="ml-3 text-gray-500">Cargando...</span>
        </div>
    );
}

/**
 * ProtectedRoute — redirects unauthenticated users to home.
 * Shows a loader while auth state is being determined.
 */
function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <PageLoader />;
    if (!isAuthenticated) return <Navigate to="/" replace />;
    return children;
}

/**
 * Main App — wraps everything in providers and sets up routing.
 * - ToastProvider  → global toast notifications
 * - AuthProvider   → JWT authentication state
 * - CartProvider   → shopping cart state
 * - Skip-nav link  → accessibility (jump to main content on Tab)
 * - Suspense       → fallback while lazy pages load
 * - AuthModal      → global login/register modal
 */
function App() {
    return (
        <ToastProvider>
            <AuthProvider>
                <CartProvider>
                    <div className="min-h-screen flex flex-col bg-gray-50">
                        {/* Accessibility: skip to main content link */}
                        <a href="#main-content" className="skip-nav">
                            Saltar al contenido principal
                        </a>

                        <Header />
                        <CartSidebar />
                        <AuthModal />

                        <main id="main-content" className="flex-1">
                            <Suspense fallback={<PageLoader />}>
                                <Routes>
                                    <Route path="/" element={<Home />} />
                                    <Route path="/buscar" element={<SearchResultsPage />} />
                                    <Route path="/categoria/:slug" element={<CategoryPage />} />
                                    <Route path="/product/:slug" element={<ProductDetail />} />
                                    <Route path="/checkout" element={<CheckoutPage />} />
                                    <Route path="/order-tracking" element={<OrderTrackingPage />} />
                                    <Route path="/payment-success" element={<PaymentSuccessPage />} />
                                    <Route path="/payment-failure" element={<PaymentFailurePage />} />
                                    {/* ─── Subscription routes ─────────────────── */}
                                    <Route path="/subscribe/:productId" element={<SubscriptionCheckoutPage />} />
                                    <Route path="/subscription-success" element={<SubscriptionSuccessPage />} />
                                    <Route path="/my-subscriptions" element={<ProtectedRoute><MySubscriptionsPage /></ProtectedRoute>} />
                                    {/* ─── Legal routes ──────────────────────── */}
                                    <Route path="/privacidad" element={<PrivacyPolicyPage />} />
                                    <Route path="/terminos" element={<TermsPage />} />
                                    {/* ─── Profile ────────────────────────────── */}
                                    <Route path="/perfil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                                    {/* ─── 404 catch-all ───────────────────── */}
                                    <Route path="*" element={<NotFoundPage />} />
                                </Routes>
                            </Suspense>
                        </main>

                        <Footer />
                    </div>
                </CartProvider>
            </AuthProvider>
        </ToastProvider>
    );
}

export default App;
