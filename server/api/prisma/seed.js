import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed Script — populates the database with sample supplement data.
 * Run with: npx prisma db seed
 */
async function main() {
    console.log('🌱 Seeding database...');

    // ─── Brands ──────────────────────────────────────────
    const brandON = await prisma.brand.create({
        data: {
            name: 'Optimum Nutrition',
            slug: 'optimum-nutrition',
            logoUrl: 'https://placehold.co/200x80?text=Optimum+Nutrition',
            sortOrder: 1,
        },
    });

    const brandMP = await prisma.brand.create({
        data: {
            name: 'MyProtein',
            slug: 'myprotein',
            logoUrl: 'https://placehold.co/200x80?text=MyProtein',
            sortOrder: 2,
        },
    });

    const brandBSN = await prisma.brand.create({
        data: {
            name: 'BSN',
            slug: 'bsn',
            logoUrl: 'https://placehold.co/200x80?text=BSN',
            sortOrder: 3,
        },
    });

    console.log('✅ Brands created');

    // ─── Categories ──────────────────────────────────────
    const catProtein = await prisma.category.create({
        data: {
            name: 'Protein',
            slug: 'protein',
            image: 'https://placehold.co/400x300?text=Protein',
            sortOrder: 1,
        },
    });

    const catCreatine = await prisma.category.create({
        data: {
            name: 'Creatine',
            slug: 'creatine',
            image: 'https://placehold.co/400x300?text=Creatine',
            sortOrder: 2,
        },
    });

    const catVitamins = await prisma.category.create({
        data: {
            name: 'Vitamins & Minerals',
            slug: 'vitamins-minerals',
            image: 'https://placehold.co/400x300?text=Vitamins',
            sortOrder: 3,
        },
    });

    // Subcategories under Protein
    const catWhey = await prisma.category.create({
        data: {
            name: 'Whey Protein',
            slug: 'whey-protein',
            sortOrder: 1,
            parentId: catProtein.id,
        },
    });

    const catCasein = await prisma.category.create({
        data: {
            name: 'Casein Protein',
            slug: 'casein-protein',
            sortOrder: 2,
            parentId: catProtein.id,
        },
    });

    console.log('✅ Categories created');

    // ─── Products ────────────────────────────────────────
    const products = [
        {
            name: 'Gold Standard 100% Whey - Double Rich Chocolate',
            slug: 'gold-standard-whey-chocolate',
            price: 899.99,
            discountPrice: 749.99,
            weight: 2.27,
            description: 'The world\'s best-selling whey protein powder. 24g of protein per serving with 5.5g of BCAAs. Double rich chocolate flavor, perfect for post-workout recovery.',
            imageUrl: 'https://placehold.co/500x500?text=Gold+Standard+Whey',
            featured: true,
            bestSeller: true,
            onSale: true,
            stockQuantity: 50,
            categoryId: catWhey.id,
            brandId: brandON.id,
        },
        {
            name: 'Impact Whey Protein - Vanilla',
            slug: 'impact-whey-vanilla',
            price: 659.99,
            description: 'High-quality whey protein with 21g of protein per serving. Low in fat and sugar, ideal for lean muscle building.',
            imageUrl: 'https://placehold.co/500x500?text=Impact+Whey',
            isNew: true,
            stockQuantity: 75,
            categoryId: catWhey.id,
            brandId: brandMP.id,
        },
        {
            name: 'Syntha-6 - Cookies & Cream',
            slug: 'syntha-6-cookies-cream',
            price: 799.99,
            discountPrice: 699.99,
            weight: 2.27,
            description: 'Ultra-premium protein matrix with 22g of protein per serving. Exceptional taste, mixes easily. Great as a meal replacement shake.',
            imageUrl: 'https://placehold.co/500x500?text=Syntha+6',
            onSale: true,
            stockQuantity: 30,
            categoryId: catWhey.id,
            brandId: brandBSN.id,
        },
        {
            name: 'Gold Standard Casein - Chocolate Supreme',
            slug: 'gold-standard-casein-chocolate',
            price: 949.99,
            weight: 1.82,
            description: 'Slow-digesting casein protein ideal for overnight recovery. 24g of casein per serving to feed your muscles while you sleep.',
            imageUrl: 'https://placehold.co/500x500?text=Casein+Protein',
            stockQuantity: 25,
            categoryId: catCasein.id,
            brandId: brandON.id,
        },
        {
            name: 'Creatine Monohydrate Powder',
            slug: 'creatine-monohydrate-powder',
            price: 399.99,
            discountPrice: 349.99,
            weight: 0.5,
            description: 'Pure creatine monohydrate. 5g per serving to increase strength, power output, and lean body mass. Unflavored for easy mixing.',
            imageUrl: 'https://placehold.co/500x500?text=Creatine',
            featured: true,
            bestSeller: true,
            onSale: true,
            stockQuantity: 100,
            categoryId: catCreatine.id,
            brandId: brandON.id,
        },
        {
            name: 'Creatine Monohydrate Tablets',
            slug: 'creatine-monohydrate-tablets',
            price: 299.99,
            weight: 0.3,
            description: '250 tablets of creatine monohydrate. Convenient tablet form, no mixing required. Take 5 tablets daily.',
            imageUrl: 'https://placehold.co/500x500?text=Creatine+Tabs',
            isNew: true,
            stockQuantity: 60,
            categoryId: catCreatine.id,
            brandId: brandMP.id,
        },
        {
            name: 'Opti-Men Multivitamin',
            slug: 'opti-men-multivitamin',
            price: 499.99,
            weight: 0.25,
            description: 'Complete multivitamin for active men. 75+ ingredients including essential vitamins, minerals, and amino acids. 150 tablets.',
            imageUrl: 'https://placehold.co/500x500?text=Opti-Men',
            featured: true,
            stockQuantity: 40,
            categoryId: catVitamins.id,
            brandId: brandON.id,
        },
        {
            name: 'Vitamin D3 5000 IU',
            slug: 'vitamin-d3-5000iu',
            price: 199.99,
            discountPrice: 159.99,
            weight: 0.1,
            description: 'High-potency vitamin D3 softgels. Supports bone health, immune function, and mood. 120 softgels.',
            imageUrl: 'https://placehold.co/500x500?text=Vitamin+D3',
            onSale: true,
            stockQuantity: 90,
            categoryId: catVitamins.id,
            brandId: brandMP.id,
        },
    ];

    for (const product of products) {
        await prisma.product.create({ data: product });
    }

    console.log(`✅ ${products.length} products created`);

    // ─── System Settings ─────────────────────────────
    // Use upsert so re-running the seed on a DB that already has settings
    // (e.g. production after a redeploy) does not crash. (M-4)
    await prisma.systemSettings.upsert({
        where: { id: 'global-settings' },
        update: {},
        create: {
            id: 'global-settings',
            shippingWeightFactor: 5.50,
            warehouseWeightLimit: 100,
            freeShippingThreshold: 500.00,
            shippingPriceList: [
                { maxWeight: 1, price: 50 },
                { maxWeight: 3, price: 100 },
                { maxWeight: 5, price: 150 },
                { maxWeight: 10, price: 250 },
            ],
        },
    });

    console.log('✅ System settings created');
    console.log('🎉 Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
