-- Status history for orders (XPANBFLFA-116, XPANBFLFA-117)

-- CreateTable
CREATE TABLE "order_events" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus" NOT NULL,
    "actorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_events_orderId_idx" ON "order_events"("orderId");

-- AddForeignKey
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing orders get one starting event with their current status
INSERT INTO "order_events" ("orderId", "fromStatus", "toStatus", "actorId", "createdAt")
SELECT "id", NULL, "status", "userId", "createdAt" FROM "orders";
