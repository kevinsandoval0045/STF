DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'products_stock_nonnegative'
          AND conrelid = 'products'::regclass
    ) THEN
        ALTER TABLE "products"
            ADD CONSTRAINT "products_stock_nonnegative"
            CHECK ("stockQuantity" >= 0);
    END IF;
END $$;
