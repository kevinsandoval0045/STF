import { z } from 'zod';

/**
 * Subscription Controller — HTTP Layer.
 * Validates input with Zod schemas, delegates to SubscriptionService.
 */

const createSchema = z.object({
    productId: z.string().uuid('ID de producto inválido'),
    quantity: z.number().int().positive().default(1),
    customerInfo: z.object({
        email: z.string().email('Correo electrónico inválido'),
        firstName: z.string().min(1, 'Nombre requerido'),
        lastName: z.string().min(1, 'Apellido requerido'),
        phone: z.string().min(7, 'Teléfono demasiado corto'),
        address: z.string().min(5, 'Dirección requerida'),
        city: z.string().min(1, 'Ciudad requerida'),
        state: z.string().optional().default(''),
        zipCode: z.string().min(3, 'Código postal requerido'),
    }),
});

export class SubscriptionController {
    constructor(subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    /**
     * POST /subscriptions
     * Create a new subscription — requires authentication.
     */
    create = async (req, res) => {
        const data = createSchema.parse(req.body);
        const result = await this.subscriptionService.create(
            req.user.userId,
            data.productId,
            data.quantity,
            data.customerInfo
        );
        res.status(201).json(result);
    };

    /**
     * GET /subscriptions/my
     * List all subscriptions for the authenticated user.
     */
    getMySubscriptions = async (req, res) => {
        const subscriptions = await this.subscriptionService.getUserSubscriptions(
            req.user.userId
        );
        res.json(subscriptions);
    };

    /**
     * POST /subscriptions/:id/cancel
     * Cancel a subscription — verifies ownership.
     */
    cancel = async (req, res) => {
        const { id } = req.params;
        const result = await this.subscriptionService.cancel(id, req.user.userId);
        res.json(result);
    };
}
