import dotenv from 'dotenv';
dotenv.config();

const readEnv = (name) => {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
};

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
  corsOrigin: readEnv('CORS_ORIGIN') || 'http://localhost:5173',

  // JWT
  jwtSecret: readEnv('JWT_SECRET') || 'dev-secret-change-in-production',

  // AdminJS Panel
  adminEmail: readEnv('ADMIN_EMAIL') || 'admin@supplements.com',
  adminPassword: readEnv('ADMIN_PASSWORD') || 'admin123',
  sessionSecret: readEnv('SESSION_SECRET') || 'dev-session-secret-change-in-production',

  // Mercado Pago — one-time payments (CheckoutBricks)
  mercadoPagoAccessToken: readEnv('MERCADOPAGO_ACCESS_TOKEN'),

  // Mercado Pago — subscriptions (preapproval).
  // Falls back to MERCADOPAGO_ACCESS_TOKEN if a separate subscription app is not configured.
  mercadoPagoSubscriptionToken: readEnv('MP_SUBSCRIPTION_TOKEN')
    || readEnv('MERCADOPAGO_ACCESS_TOKEN'),

  // Webhook — Mercado Pago (app de pagos únicos)
  mpWebhookSecret: readEnv('MP_WEBHOOK_SECRET'),
  // Webhook — Mercado Pago (app de suscripciones — puede ser diferente secret)
  mpSubscriptionWebhookSecret: readEnv('MP_SUBSCRIPTION_WEBHOOK_SECRET'),
  publicUrl: readEnv('PUBLIC_URL') || `http://localhost:${process.env.PORT || 8080}`,

  // Frontend URL — used to build back_urls in payment preferences.
  // In dev: the Vite dev server (port 5173).
  // In prod: set FRONTEND_URL to the public domain (e.g. https://kassupplements.com).
  frontendUrl: readEnv('FRONTEND_URL')
    || (process.env.NODE_ENV === 'production'
      ? '' // will fail loudly in prod if not set — intentional
      : 'http://localhost:5173'),

  // Resend (Email)
  resendApiKey: readEnv('RESEND_API_KEY'),
  resendFrom: readEnv('RESEND_FROM') || 'KAS Supplements <onboarding@resend.dev>',
  // In dev (no verified domain) all emails go to this address
  resendDevTo: readEnv('RESEND_DEV_TO'),
};

/**
 * Production startup guard.
 * Fails fast if any required variable is missing so the problem
 * is caught immediately during deploy — not silently at runtime.
 */
if (config.nodeEnv === 'production') {
  const required = {
    DATABASE_URL:                       config.databaseUrl,
    MERCADOPAGO_ACCESS_TOKEN:           config.mercadoPagoAccessToken,
    MP_WEBHOOK_SECRET:                  config.mpWebhookSecret,
    MP_SUBSCRIPTION_WEBHOOK_SECRET:     config.mpSubscriptionWebhookSecret,
    PUBLIC_URL:                         config.publicUrl,
    FRONTEND_URL:                       config.frontendUrl,
    JWT_SECRET:                         config.jwtSecret,
    SESSION_SECRET:                     config.sessionSecret,
    RESEND_API_KEY:                     config.resendApiKey,
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

