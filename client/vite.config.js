import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vite Configuration.
 * - React plugin for JSX/Fast Refresh
 * - Dev server proxy to avoid CORS issues during development
 * - resolve.alias + dedupe: force single React instance.
 *   @mercadopago/sdk-react bundles its own copy of React (CJS), which causes
 *   "Invalid hook call" at runtime. The alias forces every require('react')
 *   inside node_modules to resolve to the exact same file.
 */
export default defineConfig({
    plugins: [react()],

    server: {
        port: 5173,
        watch: { usePolling: true },
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
            },
        },
    },

    resolve: {
        dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
        alias: {
            react: path.resolve(__dirname, 'node_modules/react'),
            'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        },
    },

    optimizeDeps: {
        // Pre-bundle the CJS MP SDK against our aliased React so a single
        // ESM module is produced — no duplicate hook registries.
        include: ['@mercadopago/sdk-react'],
    },

    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    ui: ['lucide-react', 'clsx'],
                },
            },
        },
    },
});
