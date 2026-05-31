import { Router } from 'express';
import { config } from '../config.js';
import { subscriptionService, orderService } from '../container.js';
import { verifyMpSignature } from '../utils/mercadoPagoWebhookSignature.js';

/**
 * Build Mercado Pago webhook routes.
 *
 * POST /api/v1/webhooks/mp               (single payments app)
 * POST /api/v1/webhooks/mp-subscriptions (subscriptions app)
 */
export function createWebhookRouter({
    configValues = config,
    orderServiceClient = orderService,
    subscriptionServiceClient = subscriptionService,
    fetchImpl = fetch,
    verifySignatureFn = verifyMpSignature,
    logger = console,
} = {}) {
    const router = Router();

    async function handleSinglePayment(mpPaymentId) {
        try {
            const res = await fetchImpl(`https://api.mercadopago.com/v1/payments/${mpPaymentId}`, {
                headers: { Authorization: `Bearer ${configValues.mercadoPagoAccessToken}` },
            });

            if (!res.ok) {
                logger.error?.(`[Webhook/payment] Failed to fetch MP payment ${mpPaymentId}: HTTP ${res.status}`);
                return;
            }

            const payment = await res.json();

            logger.log?.(`[Webhook/payment] id=${mpPaymentId} status=${payment.status} external_ref=${payment.external_reference}`);

            if (payment.status !== 'approved') {
                logger.log?.(`[Webhook/payment] Payment ${mpPaymentId} is "${payment.status}" - ignoring`);
                return;
            }

            const orderId = payment.external_reference;
            if (!orderId) {
                logger.warn?.(`[Webhook/payment] Payment ${mpPaymentId} has no external_reference - cannot link to order`);
                return;
            }

            try {
                await orderServiceClient.registerPaymentAttempt(orderId, {
                    status: payment.status,
                    paymentId: mpPaymentId,
                });
            } catch (err) {
                logger.error?.(`[Webhook/payment] Could not persist payment state for order ${orderId}:`, err.message);
            }

            const result = await orderServiceClient.confirmPaidOrder(orderId, String(mpPaymentId));
            if (!result.updated) {
                logger.log?.(`[Webhook/payment] Order ${orderId} already in status "${result.previousStatus}" - skipping (duplicate webhook)`);
                return;
            }

            logger.log?.(`[Webhook/payment] Order ${orderId} -> ${result.newStatus} (payment ${mpPaymentId})`);
        } catch (err) {
            logger.error?.(`[Webhook/payment] Error processing payment ${mpPaymentId}:`, err.message);
        }
    }

    router.post('/mp', (req, res) => {
        res.status(200).send('OK');

        if (!verifySignatureFn(req, configValues.mpWebhookSecret, {
            label: 'payments',
            nodeEnv: configValues.nodeEnv,
            logger,
        })) {
            logger.error?.('❌ [Webhook/payments] Signature verification failed — ignoring event');
            return;
        }

        const { type, action } = req.body;
        const dataId = req.query['data.id'] || req.body?.data?.id;

        logger.log?.(`🔔 [Webhook/payments] type=${type}, action=${action}, dataId=${dataId}`);

        if (!type || !dataId) {
            logger.warn?.('⚠️  [Webhook/payments] Missing type or data.id — ignoring');
            return;
        }

        if (type === 'payment') {
            handleSinglePayment(String(dataId)).catch((err) => {
                logger.error?.('❌ [Webhook/payments] Error in handleSinglePayment:', err.message);
            });
        } else {
            logger.warn?.(`⚠️  [Webhook/payments] Unexpected event type "${type}" on payments endpoint — ignoring`);
        }
    });

    router.post('/mp-subscriptions', (req, res) => {
        if (!verifySignatureFn(req, configValues.mpSubscriptionWebhookSecret, {
            label: 'subscriptions',
            nodeEnv: configValues.nodeEnv,
            logger,
        })) {
            logger.error?.('❌ [Webhook/subscriptions] Signature verification failed — event discarded');
            return res.status(200).send('OK');
        }

        res.status(200).send('OK');

        const { type, action } = req.body;
        const dataId = req.query['data.id'] || req.body?.data?.id;

        if (!type || !dataId) {
            logger.warn?.(`⚠️  [Webhook/subscriptions] Missing type or data.id — ignoring (type=${type}, dataId=${dataId})`);
            return;
        }

        logger.log?.(`🔔 [Webhook/subscriptions] type=${type}, action=${action}, dataId=${dataId}`);

        const SUBSCRIPTION_TYPES = new Set([
            'subscription_preapproval',
            'subscription_authorized_payment',
        ]);

        if (SUBSCRIPTION_TYPES.has(type)) {
            subscriptionServiceClient.handleWebhookEvent(type, String(dataId)).catch((err) => {
                logger.error?.(`❌ [Webhook/subscriptions] Error handling ${type} (dataId=${dataId}):`, err.message);
            });
        } else {
            logger.warn?.(`⚠️  [Webhook/subscriptions] Unhandled event type "${type}" — ignoring`);
        }
    });

    return router;
}

const router = createWebhookRouter();

export default router;
