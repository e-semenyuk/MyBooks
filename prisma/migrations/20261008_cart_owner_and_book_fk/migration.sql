-- Cart items get an optional owner (user) and a real foreign key to Book
-- (XPANBFLFA-89, XPANBFLFA-90).

-- Remove rows that would break the new constraints
DELETE FROM "cart_items" WHERE "bookId" NOT IN (SELECT "id" FROM "Book");

-- Merge duplicate (sessionId, bookId) rows: keep the oldest, sum quantities
UPDATE "cart_items" c
SET "quantity" = d."total"
FROM (
  SELECT MIN("id") AS "keep_id", SUM("quantity") AS "total"
  FROM "cart_items"
  GROUP BY "sessionId", "bookId"
  HAVING COUNT(*) > 1
) d
WHERE c."id" = d."keep_id";

DELETE FROM "cart_items" c
USING (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "sessionId", "bookId" ORDER BY "id") AS rn
  FROM "cart_items"
) r
WHERE c."id" = r."id" AND r.rn > 1;

-- AlterTable
ALTER TABLE "cart_items" ADD COLUMN "userId" INTEGER;
ALTER TABLE "cart_items" ALTER COLUMN "sessionId" DROP NOT NULL;

-- Exactly one owner
ALTER TABLE "cart_items"
  ADD CONSTRAINT "cart_items_one_owner_check"
  CHECK (("sessionId" IS NOT NULL AND "userId" IS NULL) OR ("sessionId" IS NULL AND "userId" IS NOT NULL));

-- CreateIndex
CREATE INDEX "cart_items_userId_idx" ON "cart_items"("userId");
CREATE UNIQUE INDEX "cart_items_sessionId_bookId_key" ON "cart_items"("sessionId", "bookId");
CREATE UNIQUE INDEX "cart_items_userId_bookId_key" ON "cart_items"("userId", "bookId");

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
