import crypto from 'crypto';

/**
 * Order Service — Business Logic Layer.
 * Handles checkout flow, order tracking, cancellation, and shipping calculation.
 * This is the most complex service because it orchestrates multiple operations.
 */
export class OrderService {
    constructor(orderRepository, productService, settingsFn, paymentService, emailService) {
        this.orderRepository = orderRepository;
        this.productService = productService;
        this.getSettings = settingsFn; // function that returns system settings
        this.paymentService = paymentService;
        this.emailService = emailService;
    }

    /**
     * Process a checkout: validate cart items, calculate totals, create order.
     *
     * @param {Object} checkoutData - { items: [{id, quantity}], customerInfo: {...} }
     * @returns {Object} - The created order with its tracking token
     */
    async checkout(checkoutData) {
        const { items, customerInfo, corporateInvoice, userId } = checkoutData;

        // 1. Validate and fetch product details for each cart item
        const orderItems = [];
        let subtotal = 0;
        let totalWeight = 0;

        for (const item of items) {
            const product = await this.productService.getProductById(item.id);

            if (!product) {
                const error = new Error(`Product not found: ${item.id}`);
                error.statusCode = 400;
                error.code = 'INVALID_PRODUCT';
                throw error;
            }

            if (!product.active) {
                const error = new Error(`Product is not available: ${product.name}`);
                error.statusCode = 400;
                error.code = 'PRODUCT_UNAVAILABLE';
                throw error;
            }

            if (product.stockQuantity < item.quantity) {
                const error = new Error(`Insufficient stock for: ${product.name}`);
                error.statusCode = 400;
                error.code = 'INSUFFICIENT_STOCK';
                throw error;
            }

            // Use discount price if available, otherwise regular price
            const unitPrice = product.discountPrice
                ? Number(product.discountPrice)
                : Number(product.price);

            const lineTotal = unitPrice * item.quantity;

            orderItems.push({
                productId: product.id,
                quantity: item.quantity,
                unitPrice,
                productNameSnap: product.name,
                productPriceSnap: Number(product.price),
                totalPrice: lineTotal,
            });

            subtotal += lineTotal;
            totalWeight += Number(product.weight) * item.quantity;
        }

        // 2. Calculate shipping cost
        const shippingCost = await this.#calculateShipping(subtotal, totalWeight);

        // 3. Generate order number and tracking token
        const orderNumber = this.#generateOrderNumber();
        const trackingToken = crypto.randomUUID();

        // 4. Create the order in the database
        const orderData = {
            orderNumber,
            trackingToken,
            totalAmount: subtotal + shippingCost,
            shippingCost,
            // Link to registered user if authenticated
            ...(userId && { userId }),
            email: customerInfo.email,
            firstName: customerInfo.firstName,
            lastName: customerInfo.lastName,
            phone: customerInfo.phone,
            address: customerInfo.address,
            city: customerInfo.city,
            state: customerInfo.state || '',
            zipCode: customerInfo.zipCode,
            // Corporate invoice (optional)
            isCorporate: corporateInvoice?.isCorporate || false,
            companyName: corporateInvoice?.companyName || null,
            taxOffice: corporateInvoice?.taxOffice || null,
            taxId: corporateInvoice?.taxId || null,
        };

        const order = await this.orderRepository.create(orderData, orderItems);

        // Create Mercado Pago preference so the frontend can mount the Payment Brick
        const preferenceId = await this.paymentService.createPreference(
            {
                orderId: order.id,
                orderNumber: order.orderNumber,
                trackingToken: order.trackingToken,
                totalAmount: Number(order.totalAmount),
                email: customerInfo.email,
                firstName: customerInfo.firstName,
                lastName: customerInfo.lastName,
            },
            orderItems
        );

        const result = {
            orderId: order.id,
            orderNumber: order.orderNumber,
            trackingToken: order.trackingToken,
            totalAmount: Number(order.totalAmount),
            shippingCost: Number(order.shippingCost),
            status: order.status,
            preferenceId,
            items: order.items.map((item) => ({
                productName: item.productNameSnap,
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
                totalPrice: Number(item.totalPrice),
            })),
        };

        return result;
    }

    /**
     * Track an order by its public tracking token.
     */
    async trackOrder(token) {
        const order = await this.orderRepository.findByTrackingToken(token);

        if (!order) {
            const error = new Error('Order not found');
            error.statusCode = 404;
            error.code = 'NOT_FOUND';
            throw error;
        }

        return {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            totalAmount: Number(order.totalAmount),
            shippingCost: Number(order.shippingCost),
            shippingTrackNo: order.shippingTrackNo,
            shippingCarrier: order.shippingCarrier,
            items: order.items.map((item) => ({
                productName: item.productNameSnap,
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
            })),
            history: order.history.map((h) => ({
                status: h.newStatus,
                date: h.createdAt,
                note: h.note,
            })),
        };
    }

    /**
     * Cancel an order. Only PENDING orders can be cancelled.
     *
     * Security: if the order is linked to a registered user, the caller
     * MUST be that user (ownership check). This prevents any authenticated
     * user from cancelling another user’s order by guessing the orderId.
     *
     * @param {string} orderId
     * @param {string|undefined} reason   - Optional cancellation reason
     * @param {string} requestingUserId   - userId from the JWT (req.user.userId)
     */
    async cancelOrder(orderId, reason, requestingUserId) {
        const order = await this.orderRepository.findById(orderId);

        if (!order) {
            const error = new Error('Pedido no encontrado');
            error.statusCode = 404;
            error.code = 'NOT_FOUND';
            throw error;
        }

        // Ownership check: if the order is linked to a user account,
        // only that user can cancel it.
        if (order.userId && order.userId !== requestingUserId) {
            const error = new Error('No tienes permisos para cancelar este pedido');
            error.statusCode = 403;
            error.code = 'FORBIDDEN';
            throw error;
        }

        // Guest orders (no userId) cannot be cancelled via this authenticated endpoint.
        // They must use POST /orders/cancel-by-token/:token instead.
        if (!order.userId) {
            const error = new Error(
                'Los pedidos de invitado deben cancelarse usando el token de seguimiento'
            );
            error.statusCode = 403;
            error.code = 'GUEST_ORDER_TOKEN_REQUIRED';
            throw error;
        }

        if (order.status !== 'PENDING') {
            const error = new Error(
                `No se puede cancelar un pedido con estado: ${order.status}. Solo los pedidos PENDING pueden cancelarse.`
            );
            error.statusCode = 400;
            error.code = 'INVALID_STATUS';
            throw error;
        }

        const updated = await this.orderRepository.updateStatus(
            orderId,
            order.status,
            'CANCELLED',
            reason || 'Cancelado por el cliente'
        );

        // Notify customer (fire-and-forget)
        this.emailService.sendOrderCancelled({
            email:       order.email,
            firstName:   order.firstName,
            orderNumber: order.orderNumber,
            reason,
        });

        return updated;
    }

    /**
     * Cancel a guest order by its public tracking token.
     * The tracking token serves as the secret credential for guests.
     *
     * @param {string} trackingToken
     * @param {string|undefined} reason
     */
    async cancelOrderByToken(trackingToken, reason) {
        const order = await this.orderRepository.findByTrackingToken(trackingToken);

        if (!order) {
            const error = new Error('Pedido no encontrado');
            error.statusCode = 404;
            error.code = 'NOT_FOUND';
            throw error;
        }

        // This route is only for guest orders.
        // If the order belongs to a registered user, they must use the authenticated cancel endpoint.
        if (order.userId) {
            const error = new Error(
                'Este pedido pertenece a una cuenta registrada. Por favor inicia sesión para cancelarlo.'
            );
            error.statusCode = 403;
            error.code = 'AUTHENTICATED_ORDER';
            throw error;
        }

        if (order.status !== 'PENDING') {
            const error = new Error(
                `No se puede cancelar un pedido con estado: ${order.status}. Solo los pedidos PENDING pueden cancelarse.`
            );
            error.statusCode = 400;
            error.code = 'INVALID_STATUS';
            throw error;
        }

        const updated = await this.orderRepository.updateStatus(
            order.id,
            order.status,
            'CANCELLED',
            reason || 'Cancelado por el cliente'
        );

        // Notify customer (fire-and-forget)
        this.emailService.sendOrderCancelled({
            email:       order.email,
            firstName:   order.firstName,
            orderNumber: order.orderNumber,
            reason,
        });

        return updated;
    }

    /**
     * Update an order's status.
     * Sends customer notifications for shipment and delivery states.
     * Called from the admin panel.
     */
    async updateOrderStatus(orderId, newStatus, note, { shippingTrackNo, shippingCarrier } = {}) {
        const order = await this.orderRepository.findById(orderId);

        if (!order) {
            const error = new Error('Order not found');
            error.statusCode = 404;
            error.code = 'NOT_FOUND';
            throw error;
        }

        const updated = await this.orderRepository.updateStatus(orderId, order.status, newStatus, note);

        // Notify customer when their order ships
        if (newStatus === 'SHIPPED') {
            this.emailService.sendOrderShipped({
                email: order.email,
                firstName: order.firstName,
                orderNumber: order.orderNumber,
                trackingToken: order.trackingToken,
                shippingTrackNo: shippingTrackNo || order.shippingTrackNo,
                shippingCarrier: shippingCarrier || order.shippingCarrier,
            });
        }

        // Notify customer when the package is marked as delivered
        if (newStatus === 'DELIVERED') {
            this.emailService.sendOrderDelivered({
                email: order.email,
                firstName: order.firstName,
                orderNumber: order.orderNumber,
                trackingToken: order.trackingToken,
            });
        }

        return updated;
    }

    /**
     * Confirm an order after Mercado Pago approves the payment.
     *
     * Idempotent behavior:
     * - Only transitions PENDING -> PROCESSING
     * - Sends confirmation email exactly once
     *
     * @param {string} orderId
     * @param {string|number|undefined} mpPaymentId
     */
    async confirmPaidOrder(orderId, mpPaymentId) {
        const order = await this.orderRepository.findById(orderId);

        if (!order) {
            const error = new Error('Pedido no encontrado');
            error.statusCode = 404;
            error.code = 'NOT_FOUND';
            throw error;
        }

        // Persist explicit approved payment state even if webhook arrives late/duplicated.
        // This enables accurate filtering in profile/admin.
        await this.orderRepository.updatePaymentState(order.id, {
            paymentStatus: 'approved',
            paymentId: mpPaymentId ? String(mpPaymentId) : undefined,
        });

        if (order.status !== 'PENDING') {
            return {
                updated: false,
                orderNumber: order.orderNumber,
                previousStatus: order.status,
            };
        }

        const transitioned = await this.orderRepository.updateStatusIfCurrent(
            order.id,
            order.status,
            'PROCESSING',
            `Pago aprobado por Mercado Pago${mpPaymentId ? ` - payment_id: ${mpPaymentId}` : ''}`
        );

        if (!transitioned) {
            const latest = await this.orderRepository.findById(order.id);
            return {
                updated: false,
                orderNumber: order.orderNumber,
                previousStatus: latest?.status || order.status,
            };
        }

        // Fire-and-forget: never block order state transition if email service is down.
        this.emailService.sendOrderConfirmation({
            email: order.email,
            firstName: order.firstName,
            orderNumber: order.orderNumber,
            trackingToken: order.trackingToken,
            totalAmount: Number(order.totalAmount),
            shippingCost: Number(order.shippingCost),
            items: order.items.map((item) => ({
                productName: item.productNameSnap,
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
                totalPrice: Number(item.totalPrice),
            })),
        });

        return {
            updated: true,
            orderNumber: order.orderNumber,
            previousStatus: order.status,
            newStatus: 'PROCESSING',
        };
    }

    /**
     * Persist payment attempt outcome for a PENDING order.
     * This lets the UI differentiate approved/rejected/pending attempts.
     *
     * @param {string} orderId
     * @param {Object} data
     * @param {string} data.status
     * @param {string|number|undefined} data.paymentId
     */
    async registerPaymentAttempt(orderId, { status, paymentId } = {}) {
        const order = await this.orderRepository.findById(orderId);

        if (!order) {
            const error = new Error('Pedido no encontrado');
            error.statusCode = 404;
            error.code = 'NOT_FOUND';
            throw error;
        }

        // Never mutate payment metadata for orders that already moved forward.
        if (order.status !== 'PENDING' && String(status || '').toLowerCase() !== 'approved') {
            return order;
        }

        const normalizedStatus = String(status || '').trim().toLowerCase() || 'unknown';

        return this.orderRepository.updatePaymentState(order.id, {
            paymentStatus: normalizedStatus,
            paymentId: paymentId ? String(paymentId) : undefined,
        });
    }

    /**
     * Calculate shipping cost based on weight and system settings.
     * Free shipping if subtotal exceeds the threshold.
     */
    async #calculateShipping(subtotal, totalWeight) {
        let settings;
        try {
            settings = await this.getSettings();
        } catch {
            // If settings not found, return a default shipping cost
            return 99;
        }

        // Free shipping threshold
        if (
            settings &&
            settings.freeShippingThreshold &&
            subtotal >= Number(settings.freeShippingThreshold)
        ) {
            return 0;
        }

        // Use shipping price list if available
        if (settings?.shippingPriceList && Array.isArray(settings.shippingPriceList)) {
            const sorted = [...settings.shippingPriceList].sort(
                (a, b) => a.maxWeight - b.maxWeight
            );

            for (const tier of sorted) {
                if (totalWeight <= tier.maxWeight) {
                    return tier.price;
                }
            }

            // If weight exceeds all tiers, use weight × factor
            return totalWeight * Number(settings.shippingWeightFactor || 5.5);
        }

        // Fallback: weight × factor
        return totalWeight * Number(settings?.shippingWeightFactor || 5.5);
    }


    /**
     * Generate a unique order number like "SUP-20260301-A1B2C"
     */
    #generateOrderNumber() {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 5);
        return `SUP-${date}-${random}`;
    }

    /**
     * Get all orders for a registered user (for profile history).
     */
    async getMyOrders(userId) {
        return this.orderRepository.findByUserId(userId);
    }

    /**
     * Get a single order by its internal ID.
     * Used by the payment processing route to verify the order before charging.
     *
     * @param {string} orderId
     */
    async getOrderById(orderId) {
        return this.orderRepository.findById(orderId);
    }
}

