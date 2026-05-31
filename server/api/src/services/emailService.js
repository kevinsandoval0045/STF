import { Resend } from 'resend';
import { config } from '../config.js';
import { orderConfirmationTemplate } from '../templates/orderConfirmation.js';
import { orderShippedTemplate } from '../templates/orderShipped.js';
import { orderDeliveredTemplate } from '../templates/orderDelivered.js';
import { orderCancelledTemplate } from '../templates/orderCancelled.js';
import { welcomeTemplate } from '../templates/welcome.js';
import { subscriptionActivatedTemplate } from '../templates/subscriptionActivated.js';
import { subscriptionPausedTemplate } from '../templates/subscriptionPaused.js';
import { subscriptionCancelledTemplate } from '../templates/subscriptionCancelled.js';
import { subscriptionChargedTemplate } from '../templates/subscriptionCharged.js';
import { subscriptionBillingReminderTemplate } from '../templates/subscriptionBillingReminder.js';
import { subscriptionChargeFailedTemplate } from '../templates/subscriptionChargeFailed.js';
import { returnRequestReceivedTemplate } from '../templates/returnRequestReceived.js';
import { returnStatusUpdatedTemplate } from '../templates/returnStatusUpdated.js';

/**
 * Email Service - wraps Resend SDK.
 *
 * DEVELOPMENT NOTE:
 * Without a verified domain, Resend only allows sending to the account owner's email.
 * In that case, RESEND_DEV_TO overrides the real recipient so emails are testable.
 * Once a domain is verified, remove RESEND_DEV_TO from .env and all emails will
 * be sent to the real customer address.
 */
export class EmailService {
    constructor() {
        this.resend = new Resend(config.resendApiKey);
        this.from = config.resendFrom;
        this.devTo = config.resendDevTo || null;
    }

    #resolveRecipient(realEmail) {
        return this.devTo ? this.devTo : realEmail;
    }

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
                console.error(`[EmailService] Failed to send "${subject}":`, error.message);
                return;
            }

            console.log(`[EmailService] Sent "${subject}" -> ${to} (id: ${data.id})`);
        } catch (err) {
            console.error(`[EmailService] Unexpected error sending "${subject}":`, err.message);
        }
    }

    // Orders
    async sendOrderConfirmation(order) {
        await this.#send({
            to: this.#resolveRecipient(order.email),
            subject: `Pedido confirmado - ${order.orderNumber} | STF`,
            html: orderConfirmationTemplate(order),
            idempotencyKey: `order-confirmation/${order.orderNumber}`,
        });
    }

    async sendOrderShipped(order) {
        await this.#send({
            to: this.#resolveRecipient(order.email),
            subject: `Tu pedido ${order.orderNumber} esta en camino | STF`,
            html: orderShippedTemplate(order),
            idempotencyKey: `order-shipped/${order.orderNumber}`,
        });
    }

    async sendOrderDelivered(order) {
        await this.#send({
            to: this.#resolveRecipient(order.email),
            subject: `Pedido entregado - ${order.orderNumber} | STF`,
            html: orderDeliveredTemplate(order),
            idempotencyKey: `order-delivered/${order.orderNumber}`,
        });
    }

    async sendOrderCancelled(order) {
        await this.#send({
            to: this.#resolveRecipient(order.email),
            subject: `Tu pedido ${order.orderNumber} fue cancelado | STF`,
            html: orderCancelledTemplate(order),
            idempotencyKey: `order-cancelled/${order.orderNumber}`,
        });
    }

    // Auth
    async sendWelcome(user) {
        await this.#send({
            to: this.#resolveRecipient(user.email),
            subject: 'Bienvenido a STF',
            html: welcomeTemplate({ firstName: user.firstName }),
            idempotencyKey: `welcome/${user.email}`,
        });
    }

    // Subscriptions
    async sendSubscriptionActivated(data) {
        await this.#send({
            to: this.#resolveRecipient(data.email),
            subject: `Tu suscripcion a ${data.productName} esta activa | STF`,
            html: subscriptionActivatedTemplate(data),
            idempotencyKey: `subscription-activated/${data.subscriptionId}`,
        });
    }

    async sendSubscriptionPaused(data) {
        await this.#send({
            to: this.#resolveRecipient(data.email),
            subject: `Tu suscripcion a ${data.productName} esta en pausa | STF`,
            html: subscriptionPausedTemplate(data),
            idempotencyKey: `subscription-paused/${data.subscriptionId}`,
        });
    }

    async sendSubscriptionCancelled(data) {
        await this.#send({
            to: this.#resolveRecipient(data.email),
            subject: `Tu suscripcion a ${data.productName} ha sido cancelada | STF`,
            html: subscriptionCancelledTemplate(data),
            idempotencyKey: `subscription-cancelled/${data.subscriptionId}`,
        });
    }

    async sendSubscriptionCharged(data) {
        await this.#send({
            to: this.#resolveRecipient(data.email),
            subject: `Cobro procesado - ${data.productName} | STF`,
            html: subscriptionChargedTemplate(data),
            idempotencyKey: `subscription-charged/${data.mpPaymentId}`,
        });
    }

    async sendSubscriptionUpcomingChargeReminder(data) {
        const keyDate = data.nextBillingDate
            ? new Date(data.nextBillingDate).toISOString().slice(0, 10)
            : 'unscheduled';

        await this.#send({
            to: this.#resolveRecipient(data.email),
            subject: `Recordatorio de cobro - ${data.productName} | STF`,
            html: subscriptionBillingReminderTemplate(data),
            idempotencyKey: `subscription-reminder/${data.subscriptionId}/${keyDate}`,
        });
    }

    async sendSubscriptionChargeFailed(data) {
        const eventRef = data.eventId || data.paymentStatus || 'unknown';
        await this.#send({
            to: this.#resolveRecipient(data.email),
            subject: `No se pudo cobrar tu suscripcion de ${data.productName} | STF`,
            html: subscriptionChargeFailedTemplate(data),
            idempotencyKey: `subscription-charge-failed/${data.subscriptionId}/${eventRef}`,
        });
    }

    // Returns
    async sendReturnRequestReceived(data) {
        await this.#send({
            to: this.#resolveRecipient(data.email),
            subject: `Solicitud de devolucion recibida - ${data.orderNumber} | STF`,
            html: returnRequestReceivedTemplate(data),
            idempotencyKey: `return-request/${data.orderNumber}`,
        });
    }

    async sendReturnStatusUpdated(data) {
        await this.#send({
            to: this.#resolveRecipient(data.email),
            subject: `Actualizacion de devolucion - ${data.orderNumber} | STF`,
            html: returnStatusUpdatedTemplate(data),
            idempotencyKey: `return-status/${data.orderNumber}/${data.status}`,
        });
    }
}
