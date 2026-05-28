import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import prisma from '../prisma.js';

/**
 * Settings Routes.
 * GET /api/v1/settings — Get global system settings (shipping config, etc.)
 *
 * This route is simple enough that it doesn't need a full
 * repository/service/controller stack — just a direct Prisma query.
 */
const router = Router();

router.get('/', asyncHandler(async (req, res) => {
    const settings = await prisma.systemSettings.findUnique({
        where: { id: 'global-settings' },
    });

    if (!settings) {
        return res.json({
            shippingWeightFactor: 0,
            warehouseWeightLimit: 0,
            freeShippingThreshold: 0,
        });
    }

    res.json({
        shippingWeightFactor: Number(settings.shippingWeightFactor),
        warehouseWeightLimit: settings.warehouseWeightLimit,
        freeShippingThreshold: settings.freeShippingThreshold
            ? Number(settings.freeShippingThreshold)
            : null,
        shippingPriceList: settings.shippingPriceList,
    });
}));

export default router;
