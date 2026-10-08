-- Book categories (XPANBFLFA-106). A category that still has books cannot be deleted.

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_categories" (
    "bookId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "book_categories_pkey" PRIMARY KEY ("bookId","categoryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
CREATE INDEX "book_categories_categoryId_idx" ON "book_categories"("categoryId");

-- AddForeignKey
ALTER TABLE "book_categories" ADD CONSTRAINT "book_categories_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "book_categories" ADD CONSTRAINT "book_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Catalog queries sort and filter on price and creation date
CREATE INDEX "Book_priceCents_idx" ON "Book"("priceCents");
CREATE INDEX "Book_createdAt_idx" ON "Book"("createdAt");
