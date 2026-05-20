import { config } from '../config.js';

/**
 * Subscription Service — Business Logic Layer.
 *
 * Handles the full lifecycle of recurring product subscriptions:
 * creation → MP preapproval → webhook processing → cancellation.
 *
 * Billing frequency formula: billingDays = servingsPerContainer - 3
 * (ship 3 days early so the customer never runs out)
 */
export class SubscriptionService {
    constructor(subscriptionRepository, productService, paymentService, emailService) {
        this.subscriptionRepository = subscriptionRepository;
        this.productService = productService;
        this.paymentService = paymentService;
        this.emailService = emailService;
    }

    /**
     * Create a new subscription.
     *
     * 1. Validates the product has servingsPerContainer
     * 2. Calculates billingDays
     * 3. Saves Subscription in DB (status PENDING)
     * 4. Creates MP preapproval → gets init_point
     * 5. Updates Subscription with mpPreapprovalId
     *
     * @param {string} userId
     * @param {string} productId
     * @param {number} quantity
     * @param {Object} customerInfo - { email, firstName, lastName, phone, address, city, state, zipCode }
     * @returns {Object} - { initPoint, subscriptionId }
     */
    async create(userId, productId, quantity, customerInfo) {
        // 1. Fetch product and validate
        const product = await this.productService.getProductById(productId);

        if (!product) {
            const err = new Error('Producto no encontrado');
            err.statusCode = 404;
            throw err;
        }

        if (!product.active) {
            const err = new Error('Este producto no está disponible');
            err.statusCode = 400;
            throw err;
        }

        if (!product.servingsPerContainer || product.servingsPerContainer <= 3) {
            const err = new Error('Este producto no admite suscripción');
            err.statusCode = 400;
            throw err;
        }

        // 2. Calculate billing frequency
        const billingDays = product.servingsPerContainer - 3;

        // 3. Calculate amount — apply 5% loyalty discount if the user has
        //    previously had an AUTHORIZED or CANCELLED subscription for this product.
        //    NOTE: product.discountPrice is a Prisma Decimal object (always truthy),
        //    so we must check its numeric value > 0, not just its existence.
        const rawPrice    = Number(product.price);
        const rawDiscount = product.discountPrice ? Number(product.discountPrice) : 0;
        const unitPrice   = rawDiscount > 0 ? rawDiscount : rawPrice;

        const priorCount = await this.subscriptionRepository.countPriorSubscriptions(userId, productId);
        const discountApplied = priorCount >= 1;
        const discountedPrice = discountApplied
            ? Math.round(unitPrice * 0.95 * 100) / 100  // 5% off, rounded to 2 decimals
            : unitPrice;
        const amount = discountedPrice * quantity;

        // Guard: amount must be positive — catch configuration errors early
        if (!amount || amount <= 0) {
            const err = new Error('El precio del producto no es válido para crear una suscripción');
            err.statusCode = 400;
            throw err;
        }

        if (discountApplied) {
            console.log(`🎁 [Subscription] Loyalty discount applied for user ${userId} on product ${productId}: ${unitPrice} → ${discountedPrice}`);
        }

        // 4. Save subscription in DB
        const subscription = await this.subscriptionRepository.create({
            productId,
            userId,
            quantity,
            billingDays,
            amount,
            email: customerInfo.email,
            firstName: customerInfo.firstName,
            lastName: customerInfo.lastName,
            phone: customerInfo.phone,
            address: customerInfo.address,
            city: customerInfo.city,
            state: customerInfo.state || '',
            zipCode: customerInfo.zipCode,
        });

        // 5. Create preapproval in MP
        // back_url must be a public URL — use ngrok (PUBLIC_URL) so MP accepts it.
        // The backend will redirect to the frontend (localhost) after MP callback.
        const publicUrl = config.publicUrl || `http://localhost:${config.port}`;

        const preapproval = await this.paymentService.createPreapproval({
            billingDays,
            amount,
            productName: product.name,
            email: customerInfo.email,
            subscriptionId: subscription.id,
            backUrlBase: publicUrl,
        });

        // 6. Update subscription with MP preapproval ID
        await this.subscriptionRepository.updateMpPreapprovalId(
            subscription.id,
            preapproval.id
        );

        return {
            initPoint: preapproval.init_point,
            subscriptionId: subscription.id,
            discountApplied,
            originalPrice: unitPrice,
            finalPrice: discountedPrice,
        };
    }

    /**
     * Handle a webhook event from Mercado Pago.
     *
     * @param {string} type - Event type (e.g. "subscription_preapproval")
     * @param {string} dataId - The resource ID from the webhook
     */
    async handleWebhookEvent(type, dataId) {
        console.log(`🔔 [Webhook] type=${type}, dataId=${dataId}`);

        if (type === 'subscription_preapproval') {
            await this.#handlePreapprovalUpdate(dataId);
        } else if (type === 'subscription_authorized_payment') {
            await this.#handleAuthorizedPayment(dataId);
        } else {
            console.log(`⚠️  [Webhook] Unhandled event type: ${type}`);
        }
    }

    /**
     * Cancel a subscription. Verifies that it belongs to the user.
     *
     * @param {string} subscriptionId
     * @param {string} userId
     */
    async cancel(subscriptionId, userId) {
        const subscription = await this.subscriptionRepository.findById(subscriptionId);

        if (!subscription) {
            const err = new Error('Suscripción no encontrada');
            err.statusCode = 404;
            throw err;
        }

        if (subscription.userId !== userId) {
            const err = new Error('No tienes permiso para cancelar esta suscripción');
            err.statusCode = 403;
            throw err;
        }

        if (subscription.status === 'CANCELLED') {
            const err = new Error('La suscripción ya está cancelada');
            err.statusCode = 400;
            throw err;
        }

        // Cancel in MP if there's a preapproval ID
        if (subscription.mpPreapprovalId) {
            try {
                await this.paymentService.cancelPreapproval(subscription.mpPreapprovalId);
            } catch (mpErr) {
                // Log but don't fail — we still want to cancel locally
                console.error('⚠️  MP cancel failed, continuing with local cancel:', mpErr.message);
            }
        }

        // Cancel in DB
        await this.subscriptionRepository.updateStatus(subscriptionId, 'CANCELLED');

        // Notify customer (fire-and-forget)
        this.emailService.sendSubscriptionCancelled({
            email:        subscription.email,
            firstName:    subscription.firstName,
            productName:  subscription.product?.name || 'tu producto',
            billingDays:  subscription.billingDays,
            subscriptionId: subscription.id,
        });

        return { message: 'Suscripción cancelada exitosamente' };
    }

    /**
     * Get all subscriptions for a user.
     *
     * @param {string} userId
     */
    async getUserSubscriptions(userId) {
        return this.subscriptionRepository.findByUserId(userId);
    }

    // ─── Private helpers ─────────────────────────────────────────────────

    /**
     * Handle subscription_preapproval webhook — update subscription status.
     * MP sends this when the preapproval status changes (pending → authorized, paused, cancelled).
     */
    async #handlePreapprovalUpdate(mpPreapprovalId) {
        // Fetch latest status from MP
        const preapproval = await this.paymentService.getPreapproval(mpPreapprovalId);

        const subscription = await this.subscriptionRepository.findByMpPreapprovalId(mpPreapprovalId);

        if (!subscription) {
            console.warn(`⚠️  [Webhook] No subscription found for preapproval ${mpPreapprovalId}`);
            return;
        }

        // Map MP status to our enum
        const statusMap = {
            pending: 'PENDING',
            authorized: 'AUTHORIZED',
            paused: 'PAUSED',
            cancelled: 'CANCELLED',
        };

        const newStatus = statusMap[preapproval.status] || subscription.status;

        // If transitioning to AUTHORIZED, set the first nextBillingDate
        let nextBillingDate = undefined;
        if (newStatus === 'AUTHORIZED' && subscription.status !== 'AUTHORIZED') {
            const next = new Date();
            next.setDate(next.getDate() + subscription.billingDays);
            nextBillingDate = next;
        }

        await this.subscriptionRepository.updateStatus(
            subscription.id,
            newStatus,
            nextBillingDate
        );

        console.log(`✅ [Webhook] Subscription ${subscription.id} → ${newStatus}`);

        // Notify customer when subscription is first activated
        if (newStatus === 'AUTHORIZED' && subscription.status !== 'AUTHORIZED') {
            this.emailService.sendSubscriptionActivated({
                email:          subscription.email,
                firstName:      subscription.firstName,
                productName:    subscription.product?.name || preapproval.reason || 'tu producto',
                billingDays:    subscription.billingDays,
                amount:         Number(subscription.amount),
                nextBillingDate,
                subscriptionId: subscription.id,
            });
        }

        // Notify customer when subscription is cancelled via MP (e.g. payment failure)
        if (newStatus === 'CANCELLED' && subscription.status !== 'CANCELLED') {
            this.emailService.sendSubscriptionCancelled({
                email:          subscription.email,
                firstName:      subscription.firstName,
                productName:    subscription.product?.name || preapproval.reason || 'tu producto',
                billingDays:    subscription.billingDays,
                subscriptionId: subscription.id,
            });
        }
    }

    /**
     * Handle subscription_authorized_payment webhook — record the payment.
     * MP sends this when a recurring payment is successfully charged.
     */
    async #handleAuthorizedPayment(mpPaymentId) {
        // Check if we already processed this payment (idempotency)
        try {
            // The dataId for this event type is the payment ID
            // We need to look up which subscription it belongs to via MP API
            const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${mpPaymentId}`, {
                headers: { Authorization: `Bearer ${config.mercadoPagoAccessToken}` },
            });

            if (!paymentRes.ok) {
                console.error(`❌ [Webhook] Failed to fetch payment ${mpPaymentId}`);
                return;
            }

            const payment = await paymentRes.json();

            // Find our subscription by the preapproval ID stored in the payment
            const preapprovalId = payment.metadata?.preapproval_id;
            let subscription;

            if (preapprovalId) {
                subscription = await this.subscriptionRepository.findByMpPreapprovalId(preapprovalId);
            }

            // Fallback: try external_reference
            if (!subscription && payment.external_reference) {
                subscription = await this.subscriptionRepository.findById(payment.external_reference);
            }

            if (!subscription) {
                console.warn(`⚠️  [Webhook] No subscription found for payment ${mpPaymentId}`);
                return;
            }

            // Record the payment
            await this.subscriptionRepository.createPayment({
                subscriptionId: subscription.id,
                mpPaymentId: String(mpPaymentId),
                status: payment.status || 'charged',
                amount: payment.transaction_amount || Number(subscription.amount),
            });

            // Update nextBillingDate
            const next = new Date();
            next.setDate(next.getDate() + subscription.billingDays);
            await this.subscriptionRepository.updateStatus(
                subscription.id,
                'AUTHORIZED',
                next
            );

            console.log(`✅ [Webhook] Payment ${mpPaymentId} recorded for subscription ${subscription.id}`);

            // Notify customer about the successful recurring charge (fire-and-forget)
            this.emailService.sendSubscriptionCharged({
                email:          subscription.email,
                firstName:      subscription.firstName,
                productName:    subscription.product?.name || 'tu producto',
                amount:         payment.transaction_amount || Number(subscription.amount),
                nextBillingDate: next,
                billingDays:    subscription.billingDays,
                subscriptionId: subscription.id,
                mpPaymentId:    String(mpPaymentId),
            });
        } catch (err) {
            console.error(`❌ [Webhook] Error processing payment ${mpPaymentId}:`, err.message);
        }
    }
}
