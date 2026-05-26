import { Router } from 'express';
import crypto from 'crypto';
import { config } from '../config.js';
import { subscriptionService, orderService } from '../container.js';

/**
 * Webhook Routes — Mercado Pago notifications.
 *
 * POST /api/v1/webhooks/mp
 *   → App de pagos únicos (Checkout Bricks)
 *   → Valida con MP_WEBHOOK_SECRET
 *   → Solo maneja eventos type="payment"
 *
 * POST /api/v1/webhooks/mp-subscriptions
 *   → App de suscripciones (Preapproval)
 *   → Valida con MP_SUBSCRIPTION_WEBHOOK_SECRET
 *   → Solo maneja eventos subscription_preapproval y subscription_authorized_payment
 *
 * Ambos endpoints:
 * - Sin autenticación JWT (MP no puede enviarlos)
 * - Verificados vía HMAC-SHA256 en el header x-signature
 * - Responden 200 inmediatamente, procesan de forma asíncrona
 */
const router = Router();

/**
 * Verify the x-signature header from Mercado Pago.
 *
 * @param {import('express').Request} req
 * @returns {boolean}
 */
/**
 * Verify the x-signature header from Mercado Pago.
 *
 * @param {import('express').Request} req
 * @param {string} secret  - The Webhook Secret for the specific MP app
 * @param {string} label   - Label used in log messages (e.g. 'payments' | 'subscriptions')
 * @returns {boolean}
 */
function verifyMpSignature(req, secret, label = 'webhook') {
    // If no secret configured — skip in dev, reject in production
    if (!secret) {
        if (config.nodeEnv === 'production') {
            console.error(`❌ [Webhook/${label}] Secret not configured in production — rejecting request`);
            return false;
        }
        console.warn(`⚠️  [Webhook/${label}] Secret not configured — skipping signature verification (dev only)`);
        return true;
    }

    const xSignature = req.headers['x-signature'];
    const xRequestId = req.headers['x-request-id'];
    const dataId = req.query['data.id'];

    if (!xSignature) {
        console.warn(`⚠️  [Webhook/${label}] Missing x-signature header`);
        return false;
    }

    // Parse ts and v1 from x-signature header
    // Format: "ts=1704908010,v1=618c85345248dd820d5fd456117c2ab2ef8eda45a0282ff693eac24131a5e839"
    const parts = xSignature.split(',');
    let ts = '';
    let hash = '';

    parts.forEach((part) => {
        const [key, ...valueParts] = part.split('=');
        const value = valueParts.join('=');
        if (key?.trim() === 'ts') ts = value?.trim() || '';
        if (key?.trim() === 'v1') hash = value?.trim() || '';
    });

    if (!ts || !hash) {
        console.warn(`⚠️  [Webhook/${label}] Could not parse ts/v1 from x-signature`);
        return false;
    }

    // Build the manifest string per MP docs
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    // Compute HMAC-SHA256 with timing-safe comparison
    const computed = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
    const computedBuf = Buffer.from(computed, 'hex');
    const hashBuf = Buffer.from(hash, 'hex');
    const valid = computedBuf.length === hashBuf.length && crypto.timingSafeEqual(computedBuf, hashBuf);

    if (!valid) {
        console.warn(`⚠️  [Webhook/${label}] HMAC verification failed`);
        console.warn(`   Manifest: ${manifest}`);
    }

    return valid;
}

/**
 * Handle a one-time payment webhook from Mercado Pago.
 *
 * When a customer pays via Payment Brick (single purchase, not subscription),
 * MP sends a webhook with type="payment". We:
 * 1. Fetch the payment from MP to get its status and external_reference
 * 2. If status is "approved", find the order by external_reference (= orderId)
 * 3. Transition the order from PENDING → PROCESSING
 *
 * The orderService.updateOrderStatus call also creates an OrderHistory entry
 * so the customer can see the status change when tracking their order.
 *
 * @param {string} mpPaymentId  - The payment ID from data.id query param
 */
async function handleSinglePayment(mpPaymentId) {
    try {
        // 1. Fetch payment details from Mercado Pago REST API
        const res = await fetch(`https://api.mercadopago.com/v1/payments/${mpPaymentId}`, {
            headers: { Authorization: `Bearer ${config.mercadoPagoAccessToken}` },
        });

        if (!res.ok) {
            console.error(`❌ [Webhook/payment] Failed to fetch MP payment ${mpPaymentId}: HTTP ${res.status}`);
            return;
        }

        const payment = await res.json();

        console.log(`🔔 [Webhook/payment] id=${mpPaymentId} status=${payment.status} external_ref=${payment.external_reference}`);

        // 2. Only process approved payments — ignore pending/rejected
        if (payment.status !== 'approved') {
            console.log(`ℹ️  [Webhook/payment] Payment ${mpPaymentId} is "${payment.status}" — ignoring`);
            return;
        }

        // 3. Resolve order — external_reference was set to String(order.id) in createPreference
        const orderId = payment.external_reference;

        if (!orderId) {
            console.warn(`⚠️  [Webhook/payment] Payment ${mpPaymentId} has no external_reference — cannot link to order`);
            return;
        }

        // 4. IDEMPOTENCY — fetch current order status before updating.
        //    MP may retry the webhook on timeout or 5xx; the payment/process endpoint
        //    may also have already updated the order. Avoid double-processing.
        const order = await orderService.getOrderById(orderId);

        if (!order) {
            console.warn(`⚠️  [Webhook/payment] Order ${orderId} not found for payment ${mpPaymentId}`);
            return;
        }

        if (order.status !== 'PENDING') {
            console.log(`ℹ️  [Webhook/payment] Order ${orderId} already in status "${order.status}" — skipping (duplicate webhook)`);
            return;
        }

        // 5. Transition order PENDING → PROCESSING
        //    updateOrderStatus handles history entry creation internally.
        await orderService.updateOrderStatus(
            orderId,
            'PROCESSING',
            `Pago aprobado por Mercado Pago — payment_id: ${mpPaymentId}`,
        );

        console.log(`✅ [Webhook/payment] Order ${orderId} → PROCESSING (payment ${mpPaymentId})`);
    } catch (err) {
        console.error(`❌ [Webhook/payment] Error processing payment ${mpPaymentId}:`, err.message);
    }
}

// ── /mp — App de pagos únicos (Checkout Bricks) ──────────────────────────────
router.post('/mp', (req, res) => {
    res.status(200).send('OK');

    if (!verifyMpSignature(req, config.mpWebhookSecret, 'payments')) {
        console.error('❌ [Webhook/payments] Signature verification failed — ignoring event');
        return;
    }

    const { type, action } = req.body;
    const dataId = req.query['data.id'] || req.body?.data?.id;

    console.log(`🔔 [Webhook/payments] type=${type}, action=${action}, dataId=${dataId}`);

    if (!type || !dataId) {
        console.warn('⚠️  [Webhook/payments] Missing type or data.id — ignoring');
        return;
    }

    if (type === 'payment') {
        handleSinglePayment(String(dataId)).catch((err) => {
            console.error('❌ [Webhook/payments] Error in handleSinglePayment:', err.message);
        });
    } else {
        console.warn(`⚠️  [Webhook/payments] Unexpected event type "${type}" on payments endpoint — ignoring`);
    }
});

// ── /mp-subscriptions — App de suscripciones (Preapproval) ───────────────────
router.post('/mp-subscriptions', (req, res) => {
    res.status(200).send('OK');

    if (!verifyMpSignature(req, config.mpSubscriptionWebhookSecret, 'subscriptions')) {
        console.error('❌ [Webhook/subscriptions] Signature verification failed — ignoring event');
        return;
    }

    const { type, action } = req.body;
    const dataId = req.query['data.id'] || req.body?.data?.id;

    console.log(`🔔 [Webhook/subscriptions] type=${type}, action=${action}, dataId=${dataId}`);

    if (!type || !dataId) {
        console.warn('⚠️  [Webhook/subscriptions] Missing type or data.id — ignoring');
        return;
    }

    if (type === 'subscription_preapproval' || type === 'subscription_authorized_payment') {
        subscriptionService.handleWebhookEvent(type, String(dataId)).catch((err) => {
            console.error('❌ [Webhook/subscriptions] Error processing subscription event:', err.message);
        });
    } else {
        console.warn(`⚠️  [Webhook/subscriptions] Unexpected event type "${type}" on subscriptions endpoint — ignoring`);
    }
});

export default router;
