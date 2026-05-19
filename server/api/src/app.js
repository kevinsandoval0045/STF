import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config.js';
import prisma from './prisma.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { admin, adminRouter } from './admin.js';

// Route imports
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import brandRoutes from './routes/brands.js';
import settingsRoutes from './routes/settings.js';
import orderRoutes from './routes/orders.js';
import returnRoutes from './routes/returns.js';
import authRoutes from './routes/auth.js';
import subscriptionRoutes from './routes/subscriptions.js';
import webhookRoutes from './routes/webhooks.js';

const app = express();

// Trust proxy (needed for rate limiter behind reverse proxies)
app.set('trust proxy', 1);

/**
 * AdminJS Panel — mounted BEFORE other middleware so it handles /admin/* first.
 * In development, admin.watch() launches the frontend bundler in the background.
 */
if (config.nodeEnv === 'development') {
  await admin.watch();
}
app.use(admin.options.rootPath, adminRouter);

/**
 * Middleware Setup
 */
app.use(cors({ origin: config.corsOrigin }));
app.use(helmet());
app.use(compression());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/**
 * Webhook Routes — registered BEFORE rate limiter.
 * MP webhooks must not be rate-limited or they will miss events.
 */
app.use('/api/v1/webhooks', webhookRoutes);

/**
 * API Routes (v1)
 */
// Health Check
app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'UP', timestamp: new Date() });
});

/**
 * Subscription back_url redirect.
 * Mercado Pago redirects here after the user completes/cancels subscription setup.
 * We forward to the frontend (localhost in dev, FRONTEND_URL in prod).
 *
 * GET /subscription-success → http://localhost:5173/subscription-success
 */
app.get('/subscription-success', (req, res) => {
    const frontendUrl = config.corsOrigin || 'http://localhost:5173';
    const qs = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    res.redirect(302, `${frontendUrl}/subscription-success${qs}`);
});

// Rate Limiter
app.use('/api/v1', apiLimiter);

// Core Routes
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/brands', brandRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/returns', returnRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);

/**
 * Global Error Handler
 */
app.use(errorHandler);

/**
 * Start Server
 */
const startServer = async () => {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully');

        const server = app.listen(config.port, '0.0.0.0', () => {
            console.log(`🚀 API Server running on port ${config.port}`);
            console.log(`📡 Health check: http://localhost:${config.port}/api/v1/health`);
            console.log(`🔧 Admin panel: http://localhost:${config.port}${admin.options.rootPath}`);
        });

        // Handle port-in-use gracefully so nodemon can retry cleanly.
        // Without this, Node throws an unhandled error that corrupts the process
        // and leaves the port occupied longer.
        server.on('error', async (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`\n⚠️  Port ${config.port} is already in use. Waiting for nodemon to retry...\n`);
                await prisma.$disconnect();
                process.exit(1); // clean exit → nodemon will restart after delay
            } else {
                throw err;
            }
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
};

startServer();
