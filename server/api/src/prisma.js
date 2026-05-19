import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Singleton.
 * We create a single instance and reuse it across the entire application.
 * This avoids opening too many database connections.
 */
const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export default prisma;
