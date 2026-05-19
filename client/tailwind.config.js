/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{js,jsx}',
    ],
    theme: {
        extend: {
            colors: {
                // ── Design System ───────────────────────────────────
                brand: {
                    red:        '#E02424',   // Primary CTA, precios, accents
                    'red-dark': '#B91C1C',   // Hover de botones rojos
                    'red-muted':'#7F1D1D',   // Fondos de badges / alertas
                    dark:       '#111111',   // Header, footer, surfaces oscuras
                    'dark-2':   '#1A1A1A',   // Variante ligeramente más clara
                    border:     '#2E2E2E',   // Bordes en zonas oscuras
                },
                surface: {
                    DEFAULT:  '#FFFFFF',     // Fondo principal (body)
                    subtle:   '#F5F5F5',     // Secciones alternadas
                    card:     '#FFFFFF',     // Cards de producto
                    border:   '#E5E5E5',     // Bordes en zonas claras
                },
                kas: {
                    text:      '#111111',    // Texto principal
                    secondary: '#555555',    // Texto secundario
                    muted:     '#9CA3AF',    // Placeholders / metadata
                    gold:      '#C9A84C',    // Badge "Más vendido" / premium
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
