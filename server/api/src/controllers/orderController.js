import { z } from 'zod';

/**
 * Order Controller — HTTP Layer.
 * Validates input with Zod schemas, delegates to OrderService.
 */

// Zod schema for checkout validation
const checkoutSchema = z.object({
    items: z
        .array(
            z.object({
                id: z.string().uuid('Invalid product ID'),
                quantity: z.number().int().positive('Quantity must be a positive integer'),
            })
        )
        .min(1, 'Cart must have at least one item'),
    customerInfo: z.object({
        email: z.string().email('Invalid email address'),
        firstName: z.string().min(1, 'First name is required'),
        lastName: z.string().min(1, 'Last name is required'),
        phone: z.string().min(7, 'Phone number is too short'),
        address: z.string().min(5, 'Address is required'),
        city: z.string().min(1, 'City is required'),
        state: z.string().optional().default(''),
        zipCode: z.string().min(3, 'Zip code is required'),
    }),
    corporateInvoice: z
        .object({
            isCorporate: z.boolean().default(false),
            companyName: z.string().optional(),
            taxOffice: z.string().optional(),
            taxId: z.string().optional(),
        })
        .optional(),
});

const cancelSchema = z.object({
    reason: z.string().optional(),
});

export class OrderController {
    constructor(orderService, pdfService) {
        this.orderService = orderService;
        this.pdfService = pdfService;
    }

    /**
     * POST /orders/checkout
     * Creates a new order from the cart.
     */
    checkout = async (req, res) => {
        // Validate request body with Zod
        const data = checkoutSchema.parse(req.body);
        // Capture userId from JWT if the user is authenticated (optionalAuth middleware)
        const userId = req.user?.userId || null;
        const result = await this.orderService.checkout({ ...data, userId });
        res.status(201).json(result);
    };

    /**
     * GET /orders/track/:token
     * Public order tracking by unique token.
     */
    track = async (req, res) => {
        const { token } = req.params;
        const order = await this.orderService.trackOrder(token);
        res.json(order);
    };

    /**
     * POST /orders/:orderId/cancel
     * Cancel a PENDING order — authenticated users only.
     * Ownership is verified in the service layer.
     */
    cancel = async (req, res) => {
        const { orderId } = req.params;
        const { reason } = cancelSchema.parse(req.body);
        // Pass userId so the service can verify the order belongs to this user
        await this.orderService.cancelOrder(orderId, reason, req.user.userId);
        res.json({ message: 'Pedido cancelado exitosamente' });
    };

    /**
     * POST /orders/cancel-by-token/:token
     * Cancel a PENDING guest order using the order’s tracking token.
     * The token itself acts as the secret credential (similar to a magic link).
     */
    cancelByToken = async (req, res) => {
        const { token } = req.params;
        const { reason } = cancelSchema.parse(req.body);
        await this.orderService.cancelOrderByToken(token, reason);
        res.json({ message: 'Pedido cancelado exitosamente' });
    };

    /**
     * GET /orders/my-orders
     * Returns all orders linked to the authenticated user.
     */
    getMyOrders = async (req, res) => {
        const orders = await this.orderService.getMyOrders(req.user.userId);
        res.json(orders);
    };

    /**
     * GET /orders/receipt/:token
     * Download a PDF receipt for an order (public, by tracking token).
     */
    downloadReceipt = async (req, res) => {
        const { token } = req.params;
        const order = await this.orderService.trackOrder(token);

        // Build customerInfo from tracked order data (trackOrder returns flat fields)
        const orderWithCustomer = {
            ...order,
            // customerInfo is not returned by trackOrder for privacy — use only public data
            customerInfo: {},
        };

        const pdfBuffer = await this.pdfService.generateOrderReceipt(orderWithCustomer);

        const filename = `comprobante-${order.orderNumber}.pdf`;
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': pdfBuffer.length,
            'Cache-Control': 'no-store',
        });
        res.send(pdfBuffer);
    };
}
