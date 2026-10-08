-- Totals breakdown, shipping method and promo codes (XPANBFLFA-112, 113, 114).
-- Existing orders keep their total: the whole amount counts as subtotal.

-- CreateEnum
CREATE TYPE "ShippingMethod" AS ENUM ('STANDARD', 'EXPRESS');
CREATE TYPE "PromoType" AS ENUM ('PERCENT', 'FIXED');

-- AlterTable
ALTER TABLE "orders"
  ADD COLUMN "subtotalCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "discountCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "shippingCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "taxCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "shippingMethod" "ShippingMethod" NOT NULL DEFAULT 'STANDARD',
  ADD COLUMN "promoCode" TEXT;

UPDATE "orders" SET "subtotalCents" = "totalCents";

-- CreateTable
CREATE TABLE "promo_codes" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "type" "PromoType" NOT NULL,
    "value" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "promo_codes_value_check" CHECK ("value" > 0),
    CONSTRAINT "promo_codes_percent_check" CHECK ("type" <> 'PERCENT' OR "value" <= 100)
);

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");
