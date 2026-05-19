import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts.js';
import { useCategories } from '../hooks/useCategories.js';
import ProductCard from '../components/ProductCard.jsx';
import CategoryCard from '../components/CategoryCard.jsx';
import SkeletonProductCard from '../components/SkeletonProductCard.jsx';
import SEO from '../components/SEO.jsx';
import { Link } from 'react-router-dom';
import { PackageSearch, Truck, ShieldCheck, RefreshCw, BadgeCheck, Search, CreditCard, Home as HomeIcon, Zap, Star, ChevronRight, Award } from 'lucide-react';

/**
 * Home Page
 * Layout: Hero → Categories → Featured products → Benefits → How it works
 */
export default function Home() {
    const [searchParams] = useSearchParams();
    const {
        products,
        loading,
        error,
        setSearchQuery,
    } = useProducts();

    const { categories } = useCategories();

    // Sync URL search param with hook state
    useEffect(() => {
        const urlSearch = searchParams.get('search') || '';
        setSearchQuery(urlSearch);
    }, [searchParams]);

    // Featured products: prefer bestSeller flag, otherwise first 7
    const featuredProducts = products.length > 0
        ? [...products]
            .sort((a, b) => (b.bestSeller ? 1 : 0) - (a.bestSeller ? 1 : 0) || (b.salesCount || 0) - (a.salesCount || 0))
            .slice(0, 7)
        : [];

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebSite',
                name: 'Tienda de Suplementos',
                url: window.location.origin,
                potentialAction: {
                    '@type': 'SearchAction',
                    target: `${window.location.origin}/?search={search_term_string}`,
                    'query-input': 'required name=search_term_string',
                },
            },
        ],
    };

    const benefits = [
        {
            icon: Truck,
            title: 'Envío a toda la República',
            desc: 'Llevamos tus suplementos a cualquier estado de México de forma rápida y segura.',
        },
        {
            icon: ShieldCheck,
            title: 'Pago 100% seguro',
            desc: 'Todas las transacciones están protegidas por Mercado Pago. Tus datos siempre seguros.',
        },
        {
            icon: RefreshCw,
            title: 'Suscripción sin compromiso',
            desc: 'Recibe tus productos automáticamente. Cancela cuando quieras, sin penalizaciones.',
        },
        {
            icon: BadgeCheck,
            title: 'Calidad garantizada',
            desc: 'Solo trabajamos con marcas verificadas y productos de la más alta calidad.',
        },
    ];

    const steps = [
        {
            number: '01',
            icon: Search,
            title: 'Elige tus suplementos',
            desc: 'Explora nuestras categorías y encuentra los productos que se adapten a tus objetivos y estilo de vida.',
        },
        {
            number: '02',
            icon: CreditCard,
            title: 'Decide cómo comprar',
            desc: 'Realiza una compra única o suscríbete para recibirlos automáticamente cada cierto tiempo con un 5% de descuento.',
        },
        {
            number: '03',
            icon: HomeIcon,
            title: 'Recíbelos en casa',
            desc: 'Nos encargamos del resto. Tu pedido llega a la puerta de tu hogar de forma puntual y en perfectas condiciones.',
        },
    ];

    return (
        <div>
            <SEO
                title="Suplementos Premium — Proteínas, Creatinas y Más"
                description="Compra suplementos premium: proteínas, creatina, pre-entrenos y más de marcas confiables. Envío rápido y excelentes precios."
                jsonLd={jsonLd}
            />

            {/* ─── Hero Section ───────────────────────────────────── */}
            <section
                aria-label="Sección de bienvenida"
                style={{
                    background: '#111111',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* ── Spotlight rojo focal (radial gradient) ── */}
                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        top: '-10%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '900px',
                        height: '600px',
                        background: 'radial-gradient(ellipse at center top, rgba(224,36,36,0.22) 0%, rgba(224,36,36,0.06) 45%, transparent 72%)',
                        pointerEvents: 'none',
                        zIndex: 0,
                    }}
                />

                {/* ── Ruido sutil de textura ── */}
                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'300\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'300\' height=\'300\' filter=\'url(%23n)\' opacity=\'0.03\'/%3E%3C/svg%3E")',
                        opacity: 0.4,
                        pointerEvents: 'none',
                        zIndex: 0,
                    }}
                />

                {/* ── Línea decorativa superior roja ── */}
                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: 'linear-gradient(90deg, transparent 0%, #E02424 30%, #E02424 70%, transparent 100%)',
                        zIndex: 1,
                    }}
                />

                {/* ── Contenido principal ── */}
                <div
                    className="container-main animate-fade-up"
                    style={{
                        position: 'relative',
                        zIndex: 2,
                        paddingTop: '5rem',
                        paddingBottom: '5rem',
                    }}
                >
                    {/* ── Badge animado ── */}
                    <div className="flex justify-center mb-6">
                        <span
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                background: 'rgba(224,36,36,0.12)',
                                border: '1px solid rgba(224,36,36,0.35)',
                                color: '#F87171',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                padding: '0.4rem 1rem',
                                borderRadius: '9999px',
                            }}
                        >
                            <span
                                style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: '#E02424',
                                    animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
                                    flexShrink: 0,
                                }}
                            />
                            Suplementación de élite · Envío a toda México
                        </span>
                    </div>

                    {/* ── Headline ── */}
                    <div className="text-center">
                        <h1
                            style={{
                                fontSize: 'clamp(2.4rem, 6vw, 5rem)',
                                fontWeight: 900,
                                lineHeight: 1.05,
                                letterSpacing: '-0.03em',
                                color: '#FFFFFF',
                                marginBottom: '1.25rem',
                            }}
                        >
                            Alcanza tu{' '}
                            <span
                                style={{
                                    background: 'linear-gradient(135deg, #E02424 0%, #F87171 60%, #E02424 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                }}
                            >
                                máximo potencial
                            </span>
                            <br />
                            <span style={{ color: '#FFFFFF' }}>con los mejores suplementos</span>
                        </h1>

                        {/* ── Subtítulo ── */}
                        <p
                            style={{
                                color: '#9CA3AF',
                                fontSize: 'clamp(0.95rem, 2.2vw, 1.15rem)',
                                maxWidth: '560px',
                                margin: '0 auto 2.5rem',
                                lineHeight: 1.7,
                            }}
                        >
                            Proteínas, creatinas y pre-entrenos de marcas verificadas.
                            Compra única o suscripción automática con descuento.
                        </p>

                        {/* ── CTAs ── */}
                        <div
                            style={{
                                display: 'flex',
                                gap: '1rem',
                                justifyContent: 'center',
                                flexWrap: 'wrap',
                                marginBottom: '3.5rem',
                            }}
                        >
                            {/* CTA primario */}
                            <a
                                href="#categorias"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    background: '#E02424',
                                    color: '#FFFFFF',
                                    fontWeight: 700,
                                    fontSize: '0.95rem',
                                    padding: '0.85rem 2rem',
                                    borderRadius: '0.625rem',
                                    textDecoration: 'none',
                                    transition: 'background 0.2s, transform 0.15s, box-shadow 0.2s',
                                    boxShadow: '0 4px 24px rgba(224,36,36,0.35)',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = '#B91C1C';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(224,36,36,0.45)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = '#E02424';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 24px rgba(224,36,36,0.35)';
                                }}
                            >
                                Ver categorías
                                <ChevronRight style={{ width: '16px', height: '16px' }} />
                            </a>

                            {/* CTA secundario outline */}
                            <a
                                href="#productosDestacados"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    background: 'transparent',
                                    color: '#FFFFFF',
                                    fontWeight: 600,
                                    fontSize: '0.95rem',
                                    padding: '0.85rem 2rem',
                                    borderRadius: '0.625rem',
                                    border: '1.5px solid rgba(255,255,255,0.2)',
                                    textDecoration: 'none',
                                    transition: 'border-color 0.2s, background 0.2s, transform 0.15s',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                Ver productos destacados
                            </a>
                        </div>

                        {/* ── Trust Badges ── */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '0.75rem',
                                flexWrap: 'wrap',
                            }}
                        >
                            {[
                                { icon: Truck, label: 'Envío a toda la República' },
                                { icon: ShieldCheck, label: 'Pago 100% seguro' },
                                { icon: Award, label: 'Calidad garantizada' },
                                { icon: Zap, label: 'Entrega rápida' },
                            ].map(({ icon: Icon, label }) => (
                                <span
                                    key={label}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#D1D5DB',
                                        fontSize: '0.72rem',
                                        fontWeight: 500,
                                        padding: '0.45rem 0.85rem',
                                        borderRadius: '9999px',
                                        backdropFilter: 'blur(6px)',
                                    }}
                                >
                                    <Icon style={{ width: '13px', height: '13px', color: '#E02424', flexShrink: 0 }} />
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* ── Imagen del producto (visible en md+) ── */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            marginTop: '3rem',
                        }}
                    >
                        <div
                            style={{
                                position: 'relative',
                                display: 'inline-block',
                            }}
                        >


                        </div>
                    </div>

                </div>

                {/* ── Separador ondulado ── */}
                <div
                    aria-hidden="true"
                    style={{ lineHeight: 0, display: 'block', position: 'relative', zIndex: 2 }}
                >
                    <svg
                        viewBox="0 0 1440 48"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ width: '100%', height: 'auto', display: 'block', fill: '#F5F5F5' }}
                        preserveAspectRatio="none"
                    >
                        <path d="M0,48 C360,0 1080,0 1440,48 L1440,48 L0,48 Z" />
                    </svg>
                </div>
            </section>

            {/* ─── Categories Section ─────────────────────────────── */}
            <section id="categorias" className="container-main py-14">
                <div className="flex items-end justify-between mb-8">
                    <div className="mx-auto">
                        <h2 className="pt-10 text-3xl font-extrabold text-kas-text">Categorías</h2>
                    </div>
                </div>

                {categories.length === 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="aspect-square rounded-2xl skeleton" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {categories.map((cat) => (
                            <CategoryCard key={cat.id} category={cat} />
                        ))}
                    </div>
                )}
            </section>

            {/* ─── Featured Products Section ───────────────────────── */}
            <section id="productosDestacados" className="bg-surface-subtle border-t border-surface-border">
                <div className="container-main py-14">
                    <div className="flex items-end justify-between mb-8">
                        <div className="mx-auto">
                            <h2 className="pt-10 text-3xl font-extrabold text-kas-text">
                                Productos Destacados
                            </h2>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {Array.from({ length: 7 }).map((_, i) => (
                                <SkeletonProductCard key={i} />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="text-center py-20">
                            <p className="text-red-500">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-4 btn-secondary text-sm"
                            >
                                Reintentar
                            </button>
                        </div>
                    ) : featuredProducts.length === 0 ? (
                        <div className="text-center py-20">
                            <PackageSearch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-lg text-gray-500">
                                No hay productos disponibles todavía
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {featuredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ─── Benefits Strip ──────────────────────────────────── */}
            <section className="border-t border-surface-border">
                <div className="container-main py-14">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {benefits.map(({ icon: Icon, title, desc }) => (
                            <div
                                key={title}
                                className="flex flex-col items-center text-center p-6 rounded-2xl
                                           bg-white border border-gray-100 shadow-sm
                                           hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                            >
                                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
                                    <Icon className="w-6 h-6 text-brand-red" />
                                </div>
                                <h3 className="font-bold text-kas-text text-sm mb-2">{title}</h3>
                                <p className="text-xs text-kas-muted leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── How It Works ────────────────────────────────────── */}
            <section className="border-t border-surface-border bg-surface-subtle">
                <div className="container-main py-14">

                    <div className="text-center mb-10">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-kas-text mb-3">
                            ¿Cómo funciona comprar con nosotros?
                        </h2>
                        <p className="text-kas-muted max-w-xl mx-auto text-sm">
                            Tres pasos simples para recibir tus suplementos favoritos sin complicaciones.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {steps.map(({ number, icon: Icon, title, desc }) => (
                            <div
                                key={number}
                                className="flex flex-col items-center text-center p-6 rounded-2xl
                                           bg-white border border-gray-100 shadow-sm
                                           hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                            >
                                {/* Step circle */}
                                <div className="relative w-14 h-14 mb-5">
                                    <div className="w-14 h-14 rounded-full bg-brand-red flex items-center justify-center shadow-md">
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-100
                                                     text-brand-red text-xs font-black flex items-center justify-center">
                                        {number.replace('0', '')}
                                    </span>
                                </div>
                                <h3 className="font-bold text-kas-text text-sm mb-2">{title}</h3>
                                <p className="text-xs text-kas-muted leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>

                </div>
            </section>

        </div>
    );
}
