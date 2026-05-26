import dotenv from 'dotenv';
dotenv.config();

/**
 * Centralized configuration.
 * All environment variables are read here and exported as a single object.
 * This makes the app easier to configure and test.
 */
export const config = {
  // Server
  port: parseInt(process.env.PORT, 10) || 8080,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database — Prisma reads DATABASE_URL directly from .env,
  // but we keep it here for reference
  databaseUrl: process.env.DATABASE_URL,

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',

  // AdminJS Panel
  adminEmail: process.env.ADMIN_EMAIL || 'admin@supplements.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret-change-in-production',

  // Mercado Pago — one-time payments (CheckoutBricks)
  mercadoPagoAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',

  // Mercado Pago — subscriptions (preapproval).
  // Falls back to MERCADOPAGO_ACCESS_TOKEN if a separate subscription app is not configured.
  mercadoPagoSubscriptionToken: process.env.MP_SUBSCRIPTION_TOKEN
    || process.env.MERCADOPAGO_ACCESS_TOKEN
    || '',

  // Webhook — Mercado Pago (app de pagos únicos)
  mpWebhookSecret: process.env.MP_WEBHOOK_SECRET || '',
  // Webhook — Mercado Pago (app de suscripciones — puede ser diferente secret)
  mpSubscriptionWebhookSecret: process.env.MP_SUBSCRIPTION_WEBHOOK_SECRET || '',
  publicUrl: process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 8080}`,

  // Frontend URL — used to build back_urls in payment preferences.
  // In dev: the Vite dev server (port 5173).
  // In prod: set FRONTEND_URL to the public domain (e.g. https://kassupplements.com).
  frontendUrl: process.env.FRONTEND_URL
    || (process.env.NODE_ENV === 'production'
      ? '' // will fail loudly in prod if not set — intentional
      : 'http://localhost:5173'),

  // Resend (Email)
  resendApiKey: process.env.RESEND_API_KEY || '',
  resendFrom: process.env.RESEND_FROM || 'KAS Supplements <onboarding@resend.dev>',
  // In dev (no verified domain) all emails go to this address
  resendDevTo: process.env.RESEND_DEV_TO || '',
};

/**
 * Production startup guard.
 * Fails fast if any required variable is missing so the problem
 * is caught immediately during deploy — not silently at runtime.
 */
if (config.nodeEnv === 'production') {
  const required = {
    DATABASE_URL:               config.databaseUrl,
    MERCADOPAGO_ACCESS_TOKEN:   config.mercadoPagoAccessToken,
    MP_WEBHOOK_SECRET:          config.mpWebhookSecret,
    PUBLIC_URL:                 config.publicUrl,
    FRONTEND_URL:               config.frontendUrl,
    JWT_SECRET:                 config.jwtSecret,
    SESSION_SECRET:             config.sessionSecret,
    RESEND_API_KEY:             config.resendApiKey,
  };

  const missing = Object.entries(required)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    console.error('❌ [Config] Missing required environment variables in production:');
    missing.forEach((k) => console.error(`   • ${k}`));
    process.exit(1);
  }
}

