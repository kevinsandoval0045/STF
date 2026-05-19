/**
 * reset-categories.js
 * Deletes all existing categories and inserts the 5 canonical ones.
 * Run with: node prisma/reset-categories.js (from server/api folder)
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🗑️  Deleting existing categories...');

    // Unlink products from categories first to avoid FK violations
    await prisma.product.updateMany({ data: { categoryId: null } });

    // Delete all categories (children first via cascade or manual order)
    await prisma.category.deleteMany({});

    console.log('✅ Old categories removed');

    // ─── Insert the 5 canonical categories ───────────────
    const categories = [
        { name: 'Proteínas',          slug: 'proteinas',          sortOrder: 1, image: null },
        { name: 'Creatinas',          slug: 'creatinas',          sortOrder: 2, image: null },
        { name: 'Pre-entrenos',       slug: 'preentrenos',        sortOrder: 3, image: null },
        { name: 'Ganadores de peso',  slug: 'ganadores-de-peso',  sortOrder: 4, image: null },
        { name: 'Otros',              slug: 'otros',              sortOrder: 5, image: null },
    ];

    for (const cat of categories) {
        const created = await prisma.category.create({ data: cat });
        console.log(`  ✔ ${created.name} (${created.slug})`);
    }

    console.log('🎉 Categories reset successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
