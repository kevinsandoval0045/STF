import { Router } from 'express';
import crypto from 'crypto';
import { config } from '../config.js';
import { subscriptionService, orderService } from '../container.js';

/**
 * Webhook Routes — Mercado Pago notifications.
 *
 * POST /api/v1/webhooks/mp
 *
 * - No authentication middleware (MP can't send JWTs)
 * - Verified via HMAC-SHA256 signature in x-signature header
 * - Always responds 200 immediately, processes asynchronously
 *
 * MP webhook signature verification:
 * Template: id:[data.id];request-id:[x-request-id];ts:[ts];
 * data.id comes as a QUERY PARAMETER (not in the body)
 *
 * Event types handled:
 * - "payment"                      → Single purchase via Payment Brick
 * - "subscription_preapproval"     → Subscription lifecycle changes
 * - "subscription_authorized_payment" → Recurring charge processed
 */
const router = Router();

/**
 * Verify the x-signature header from Mercado Pago.
 *
 * @param {import('express').Request} req
 * @returns {boolean}
 */
function verifyMpSignature(req) {
    const secret = config.mpWebhookSecret;

    // If no secret configured — skip in dev, reject in production
    if (!secret) {
        if (config.nodeEnv === 'production') {
            console.error('❌ [Webhook] MP_WEBHOOK_SECRET not configured in production — rejecting request');
            return false;
        }
        console.warn('⚠️  [Webhook] MP_WEBHOOK_SECRET not configured — skipping signature verification (dev only)');
        return true;
    }

    const xSignature = req.headers['x-signature'];
    const xRequestId = req.headers['x-request-id'];
    const dataId = req.query['data.id'];

    if (!xSignature) {
        console.warn('⚠️  [Webhook] Missing x-signature header');
        return false;
    }

    // Parse ts and v1 from x-signature header
    // Format: "ts=1704908010,v1=618c85345248dd820d5fd456117c2ab2ef8eda45a0282ff693eac24131a5e839"
    const parts = xSignature.split(',');
    let ts = '';
    let hash = '';

    parts.forEach((part) => {
        const [key, ...valueParts] = part.split('=');
        const value = valueParts.join('='); // handle '=' in value
        if (key?.trim() === 'ts') ts = value?.trim() || '';
        if (key?.trim() === 'v1') hash = value?.trim() || '';
    });

    if (!ts || !hash) {
        console.warn('⚠️  [Webhook] Could not parse ts/v1 from x-signature');
        return false;
    }

    // Build the manifest string per MP docs
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    // Compute HMAC-SHA256
    const computed = crypto
        .createHmac('sha256', secret)
        .update(manifest)
        .digest('hex');

    const valid = computed === hash;

    if (!valid) {
        console.warn('⚠️  [Webhook] HMAC verification failed');
        console.warn(`   Expected: ${hash}`);
        console.warn(`   Computed: ${computed}`);
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

        // 4. Transition order PENDING → PROCESSING
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

router.post('/mp', (req, res) => {
    // Always respond 200 immediately — MP expects a fast response (<5 s)
    res.status(200).send('OK');

    // Verify HMAC signature
    if (!verifyMpSignature(req)) {
        console.error('❌ [Webhook] Signature verification failed — ignoring event');
        return;
    }

    // Extract event info
    const { type, action } = req.body;
    const dataId = req.query['data.id'] || req.body?.data?.id;

    console.log(`🔔 [Webhook] Received: type=${type}, action=${action}, dataId=${dataId}`);

    if (!type || !dataId) {
        console.warn('⚠️  [Webhook] Missing type or data.id — ignoring');
        return;
    }

    // ── Route to the correct handler ──────────────────────────────────────────
    if (type === 'payment') {
        // One-time purchase (Payment Brick / Checkout Bricks)
        handleSinglePayment(String(dataId)).catch((err) => {
            console.error(`❌ [Webhook] Error in handleSinglePayment:`, err.message);
        });
    } else {
        // Subscription events: preapproval lifecycle + recurring charges
        subscriptionService.handleWebhookEvent(type, String(dataId)).catch((err) => {
            console.error(`❌ [Webhook] Error processing subscription event:`, err.message);
        });
    }
});

export default router;
