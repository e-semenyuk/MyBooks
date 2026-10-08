-- Money moves from Float dollars to integer cents (XPANBFLFA-92) and order status
-- becomes an enum (XPANBFLFA-88).

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- Book.price -> Book.priceCents
ALTER TABLE "Book" ADD COLUMN "priceCents" INTEGER;
UPDATE "Book" SET "priceCents" = ROUND("price" * 100)::INTEGER;
ALTER TABLE "Book" ALTER COLUMN "priceCents" SET NOT NULL;
ALTER TABLE "Book" DROP COLUMN "price";

-- order_items.price -> order_items.priceCents
ALTER TABLE "order_items" ADD COLUMN "priceCents" INTEGER;
UPDATE "order_items" SET "priceCents" = ROUND("price" * 100)::INTEGER;
ALTER TABLE "order_items" ALTER COLUMN "priceCents" SET NOT NULL;
ALTER TABLE "order_items" DROP COLUMN "price";

-- orders.totalAmount -> orders.totalCents
ALTER TABLE "orders" ADD COLUMN "totalCents" INTEGER;
UPDATE "orders" SET "totalCents" = ROUND("totalAmount" * 100)::INTEGER;
ALTER TABLE "orders" ALTER COLUMN "totalCents" SET NOT NULL;
ALTER TABLE "orders" DROP COLUMN "totalAmount";

-- orders.status String -> enum. Unknown legacy values become PENDING.
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders"
  ALTER COLUMN "status" TYPE "OrderStatus"
  USING (
    CASE
      WHEN UPPER("status") IN ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED')
        THEN UPPER("status")::"OrderStatus"
      ELSE 'PENDING'::"OrderStatus"
    END
  );
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED';
