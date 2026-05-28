import { Resend } from 'resend';
import { config } from '../config.js';
import { orderConfirmationTemplate } from '../templates/orderConfirmation.js';
import { orderShippedTemplate } from '../templates/orderShipped.js';
import { orderCancelledTemplate } from '../templates/orderCancelled.js';
import { welcomeTemplate } from '../templates/welcome.js';
import { subscriptionActivatedTemplate } from '../templates/subscriptionActivated.js';
import { subscriptionCancelledTemplate } from '../templates/subscriptionCancelled.js';
import { subscriptionChargedTemplate } from '../templates/subscriptionCharged.js';
import { returnRequestReceivedTemplate } from '../templates/returnRequestReceived.js';

/**
 * Email Service — wraps Resend SDK.
 *
 * DEVELOPMENT NOTE:
 * Without a verified domain, Resend only allows sending to the account owner's email.
 * In that case, RESEND_DEV_TO overrides the real recipient so emails are testable.
 * Once a domain is verified, remove RESEND_DEV_TO from .env and all emails will
 * be sent to the real customer address.
 *
 * Idempotency keys follow the pattern: <event-type>/<entity-id>
 * to prevent duplicate sends on retries.
 */
export class EmailService {
    constructor() {
        this.resend = new Resend(config.resendApiKey);
        this.from = config.resendFrom;
        // If set, ALL emails go here (sandbox / no-verified-domain mode)
        this.devTo = config.resendDevTo || null;
    }

    /**
     * Resolve recipient: in dev/sandbox mode, always send to devTo.
     */
    #resolveRecipient(realEmail) {
        return this.devTo ? this.devTo : realEmail;
    }

    /**
     * Low-level send with error handling.
     * Never throws — logs error so the main flow is never interrupted.
     */
    async #send({ to, subject, html, idempotencyKey }) {
        try {
            const { data, error } = await this.resend.emails.send(
                {
                    from: this.from,
                    to: [to],
                    subject,
                    html,
                },
                { idempotencyKey }
            );

            if (error) {
                console.error(`❌ [EmailService] Failed to send "${subject}":`, error.message);
                return;
            }

            console.log(`✉️  [EmailService] Sent "${subject}" → ${to} (id: ${data.id})`);
        } catch (err) {
            // Never let an email error crash a request
            console.error(`❌ [EmailService] Unexpected error sending "${subject}":`, err.message);
        }
    }

    // ─── Orders ────────────────────────────────────────────────────────────────

    /**
     * Send order confirmation email right after checkout.
     *
     * @param {Object} order - { email, firstName, orderNumber, trackingToken, totalAmount, shippingCost, items }
     */
    async sendOrderConfirmation(order) {
        await this.#send({
            to: this.#resolveRecipient(order.email),
            subject: `Pedido confirmado — ${order.orderNumber} | KAS Supplements`,
            html: orderConfirmationTemplate(order),
            idempotencyKey: `order-confirmation/${order.orderNumber}`,
        });
    }

    /**
     * Send shipped notification when an order status changes to SHIPPED.
     *
     * @param {Object} order - { email, firstName, orderNumber, trackingToken, shippingTrackNo?, shippingCarrier? }
     */
    async sendOrderShipped(order) {
        await this.#send({
            to: this.#resolveRecipient(order.email),
            subject: `Tu pedido ${order.orderNumber} está en camino 🚚 | KAS Supplements`,
            html: orderShippedTemplate(order),
            idempotencyKey: `order-shipped/${order.orderNumber}`,
        });
    }

    /**
     * Send cancellation confirmation when the customer cancels a PENDING order.
     *
     * @param {Object} order - { email, firstName, orderNumber, reason? }
     */
    async sendOrderCancelled(order) {
        await this.#send({
            to: this.#resolveRecipient(order.email),
            subject: `Tu pedido ${order.orderNumber} ha sido cancelado | KAS Supplements`,
            html: orderCancelledTemplate(order),
            idempotencyKey: `order-cancelled/${order.orderNumber}`,
        });
    }

    // ─── Auth ──────────────────────────────────────────────────────────────────

    /**
     * Send welcome email after a new user registers.
     *
     * @param {Object} user - { email, firstName }
     */
    async sendWelcome(user) {
        await this.#send({
            to: this.#resolveRecipient(user.email),
            subject: '¡Bienvenido a KAS Supplements! 💪',
            html: welcomeTemplate({ firstName: user.firstName }),
            idempotencyKey: `welcome/${user.email}`,
        });
    }

    // ─── Subscriptions ─────────────────────────────────────────────────────────

    /**
     * Send activation email when a subscription transitions to AUTHORIZED.
     *
     * @param {Object} data - { email, firstName, productName, billingDays, amount, nextBillingDate }
     */
    async sendSubscriptionActivated(data) {
        await this.#send({
            to: this.#resolveRecipient(data.email),
            subject: `¡Tu suscripción a ${data.productName} está activa! 🎉 | KAS Supplements`,
            html: subscriptionActivatedTemplate(data),
            idempotencyKey: `subscription-activated/${data.subscriptionId}`,
        });
    }

    /**
     * Send cancellation confirmation when a subscription is cancelled.
     *
     * @param {Object} data - { email, firstName, productName, billingDays, subscriptionId }
     */
    async sendSubscriptionCancelled(data) {
        await this.#send({
            to: this.#resolveRecipient(data.email),
            subject: `Tu suscripción a ${data.productName} ha sido cancelada | KAS Supplements`,
            html: subscriptionCancelledTemplate(data),
            idempotencyKey: `subscription-cancelled/${data.subscriptionId}`,
        });
    }

    /**
     * Send charge receipt when a recurring payment is successfully processed.
     *
     * @param {Object} data - { email, firstName, productName, amount, nextBillingDate, billingDays, subscriptionId, mpPaymentId }
     */
    async sendSubscriptionCharged(data) {
        await this.#send({
            to: this.#resolveRecipient(data.email),
            subject: `Cobro procesado — ${data.productName} | KAS Supplements`,
            html: subscriptionChargedTemplate(data),
            idempotencyKey: `subscription-charged/${data.mpPaymentId}`,
        });
    }

    // ─── Returns ───────────────────────────────────────────────────────────────

    /**
     * Send confirmation when a return request is received.
     *
     * @param {Object} data - { email, firstName, orderNumber, returnType, description }
     */
    async sendReturnRequestReceived(data) {
        await this.#send({
            to: this.#resolveRecipient(data.email),
            subject: `Solicitud de devolución recibida — ${data.orderNumber} | KAS Supplements`,
            html: returnRequestReceivedTemplate(data),
            idempotencyKey: `return-request/${data.orderNumber}`,
        });
    }
}
