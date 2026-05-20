import { MercadoPagoConfig, Preference } from 'mercadopago';
import { config } from '../config.js';

/**
 * Payment Service — Mercado Pago integration.
 * Handles preference creation for Checkout Bricks.
 *
 * NOTE: In development we skip webhooks. Order status is managed
 * manually from the admin panel. Webhooks can be added later when
 * the app is deployed to a public URL.
 */
export class PaymentService {
    constructor() {
        this.client = new MercadoPagoConfig({
            accessToken: config.mercadoPagoAccessToken,
        });
    }

    /**
     * Create a Mercado Pago preference for an order.
     *
     * @param {Object} order  - { orderId, orderNumber, totalAmount, email, firstName, lastName }
     * @param {Array}  items  - [{ productNameSnap, quantity, unitPrice }]
     * @returns {string}      - The preference ID to pass to the Payment Brick
     */
    async createPreference(order, items) {
        const preference = new Preference(this.client);

        const backUrlBase = config.frontendUrl;

        // Normalize items — they may come from pre-DB orderItems array
        // where the field is either 'productNameSnap'/'unitPrice' or 'title'/'unit_price'
        const mpItems = items.map((item) => ({
            id: String(item.productId || item.id || item.productNameSnap || 'product'),
            title: String(item.productNameSnap || item.title || item.name || 'Producto'),
            quantity: Number(item.quantity) || 1,
            unit_price: Number(item.unitPrice || item.unit_price || 0),
            currency_id: 'MXN',
        }));

        try {
            const result = await preference.create({
                body: {
                    items: mpItems,
                    payer: {
                        name: order.firstName,
                        surname: order.lastName,
                        email: order.email,
                    },
                    external_reference: String(order.orderId),
                    // back_urls used for redirect-based payment methods (Oxxo, bank transfer)
                    // Card payments are handled via Payment Brick callbacks (onSubmit/onError)
                    back_urls: {
                        success: `${backUrlBase}/payment-success?orderNumber=${encodeURIComponent(order.orderNumber)}&trackingToken=${encodeURIComponent(order.trackingToken)}`,
                        failure: `${backUrlBase}/payment-failure`,
                        pending: `${backUrlBase}/payment-success?orderNumber=${encodeURIComponent(order.orderNumber)}&trackingToken=${encodeURIComponent(order.trackingToken)}&pending=true`,
                    },
                    // NOTE: auto_return is Checkout Pro only — do NOT use with Checkout Bricks
                    metadata: {
                        orderId: order.orderId,
                        orderNumber: order.orderNumber,
                    },
                },
            });

            return result.id;
        } catch (err) {
            // Log the full MP error for debugging
            console.error('❌ MercadoPago createPreference error:');
            console.error('  Status:', err.status);
            console.error('  Message:', err.message);
            console.error('  Cause:', JSON.stringify(err.cause ?? err, null, 2));
            throw err;
        }
    }

    // ─── Preapproval (Subscriptions) ─────────────────────────────────────
    // The MP SDK does not expose /preapproval, so we call the REST API directly
    // using native fetch (Node 18+).

    /**
     * Create a Mercado Pago preapproval (subscription without associated plan).
     * The user is redirected to init_point to choose their payment method.
     *
     * @param {Object} params - { billingDays, amount, productName, email, subscriptionId, backUrlBase }
     * @returns {Object} - { id: mpPreapprovalId, init_point }
     */
    async createPreapproval({ billingDays, amount, productName, email, subscriptionId, backUrlBase }) {
        const body = {
            reason: `${productName} — Suscripción KAS Supplements`,
            auto_recurring: {
                frequency: billingDays,
                frequency_type: 'days',
                transaction_amount: amount,
                currency_id: 'MXN',
            },
            payer_email: email,
            external_reference: subscriptionId,
            back_url: `${backUrlBase}/subscription-success`,
            status: 'pending',
        };

        try {
            const res = await fetch('https://api.mercadopago.com/preapproval', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${config.mercadoPagoSubscriptionToken}`,
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                console.error('❌ MP createPreapproval error:', JSON.stringify(data, null, 2));
                const err = new Error(data.message || 'Failed to create preapproval');
                err.statusCode = res.status;
                throw err;
            }

            console.log(`✅ MP Preapproval created: ${data.id} → ${data.init_point}`);
            return { id: data.id, init_point: data.init_point };
        } catch (err) {
            console.error('❌ MP createPreapproval exception:', err.message);
            throw err;
        }
    }

    /**
     * Cancel an active preapproval in Mercado Pago.
     *
     * @param {string} mpPreapprovalId
     */
    async cancelPreapproval(mpPreapprovalId) {
        try {
            const res = await fetch(`https://api.mercadopago.com/preapproval/${mpPreapprovalId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${config.mercadoPagoSubscriptionToken}`,
                },
                body: JSON.stringify({ status: 'cancelled' }),
            });

            const data = await res.json();

            if (!res.ok) {
                console.error('❌ MP cancelPreapproval error:', JSON.stringify(data, null, 2));
            } else {
                console.log(`✅ MP Preapproval ${mpPreapprovalId} cancelled`);
            }

            return data;
        } catch (err) {
            console.error('❌ MP cancelPreapproval exception:', err.message);
            throw err;
        }
    }

    /**
     * Get preapproval details from Mercado Pago (used by webhook handler).
     *
     * @param {string} mpPreapprovalId
     * @returns {Object} - Full preapproval object from MP
     */
    async getPreapproval(mpPreapprovalId) {
        try {
            const res = await fetch(`https://api.mercadopago.com/preapproval/${mpPreapprovalId}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${config.mercadoPagoSubscriptionToken}`,
                },
            });

            const data = await res.json();

            if (!res.ok) {
                console.error('❌ MP getPreapproval error:', JSON.stringify(data, null, 2));
                const err = new Error(data.message || 'Failed to get preapproval');
                err.statusCode = res.status;
                throw err;
            }

            return data;
        } catch (err) {
            console.error('❌ MP getPreapproval exception:', err.message);
            throw err;
        }
    }
}
