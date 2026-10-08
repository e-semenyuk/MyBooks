-- Returns after delivery and a note on status changes (XPANBFLFA-119).

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'RETURNED';

-- AlterTable
ALTER TABLE "order_events" ADD COLUMN "note" TEXT;
