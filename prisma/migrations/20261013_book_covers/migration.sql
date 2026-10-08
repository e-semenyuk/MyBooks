-- Uploaded book covers (XPANBFLFA-110). Stored in the database because the
-- hosting platform has no writable disk.

-- CreateTable
CREATE TABLE "book_covers" (
    "bookId" INTEGER NOT NULL,
    "contentType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "size" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_covers_pkey" PRIMARY KEY ("bookId")
);

-- AddForeignKey
ALTER TABLE "book_covers" ADD CONSTRAINT "book_covers_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
