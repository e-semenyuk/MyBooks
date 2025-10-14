-- Complete database setup script for Next.js Bookstore
-- Run this in Supabase SQL Editor: Dashboard > SQL Editor > New Query

-- Create UserRole enum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- Create Users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for users
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");

-- Create Books table
CREATE TABLE IF NOT EXISTS "Book" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "author" TEXT NOT NULL,
  "isbn" TEXT UNIQUE,
  "price" DOUBLE PRECISION NOT NULL,
  "description" TEXT,
  "stockQuantity" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for Book
CREATE INDEX IF NOT EXISTS "Book_title_idx" ON "Book"("title");
CREATE INDEX IF NOT EXISTS "Book_author_idx" ON "Book"("author");

-- Create Cart Items table
CREATE TABLE IF NOT EXISTS "cart_items" (
  "id" SERIAL PRIMARY KEY,
  "bookId" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "sessionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for cart_items
CREATE INDEX IF NOT EXISTS "cart_items_sessionId_idx" ON "cart_items"("sessionId");
CREATE INDEX IF NOT EXISTS "cart_items_bookId_idx" ON "cart_items"("bookId");

-- Create Orders table
CREATE TABLE IF NOT EXISTS "orders" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER,
  "customerName" TEXT NOT NULL,
  "customerEmail" TEXT NOT NULL,
  "customerAddress" TEXT NOT NULL,
  "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "totalAmount" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for orders
CREATE INDEX IF NOT EXISTS "orders_userId_idx" ON "orders"("userId");
CREATE INDEX IF NOT EXISTS "orders_customerEmail_idx" ON "orders"("customerEmail");
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders"("status");
CREATE INDEX IF NOT EXISTS "orders_orderDate_idx" ON "orders"("orderDate");

-- Create Order Items table
CREATE TABLE IF NOT EXISTS "order_items" (
  "id" SERIAL PRIMARY KEY,
  "orderId" INTEGER NOT NULL,
  "bookId" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "price" DOUBLE PRECISION NOT NULL
);

-- Create indexes for order_items
CREATE INDEX IF NOT EXISTS "order_items_orderId_idx" ON "order_items"("orderId");
CREATE INDEX IF NOT EXISTS "order_items_bookId_idx" ON "order_items"("bookId");

-- Add foreign key constraints
ALTER TABLE "orders"
  DROP CONSTRAINT IF EXISTS "orders_userId_fkey",
  ADD CONSTRAINT "orders_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "order_items" 
  DROP CONSTRAINT IF EXISTS "order_items_orderId_fkey",
  ADD CONSTRAINT "order_items_orderId_fkey" 
  FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_items" 
  DROP CONSTRAINT IF EXISTS "order_items_bookId_fkey",
  ADD CONSTRAINT "order_items_bookId_fkey" 
  FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Insert default admin user
-- Email: admin@bookstore.com
-- Password: admin123
INSERT INTO "users" ("email", "password", "name", "role")
VALUES
  ('admin@bookstore.com', '$2b$10$D5rCDli6BRcqwmkWc4Iede9gIeIrwl6WzaOF6DcTyx.Ym4boV7VOO', 'Admin User', 'ADMIN')
ON CONFLICT (email) DO NOTHING;

-- Insert sample books
INSERT INTO "Book" ("title", "author", "isbn", "price", "description", "stockQuantity")
VALUES
  ('The Great Gatsby', 'F. Scott Fitzgerald', '978-0743273565', 12.99, 
   'A classic American novel set in the Jazz Age, exploring themes of decadence, idealism, and excess.', 50),
  
  ('To Kill a Mockingbird', 'Harper Lee', '978-0061120084', 14.99, 
   'A gripping tale of racial injustice and childhood innocence in the American South.', 35),
  
  ('1984', 'George Orwell', '978-0451524935', 13.99, 
   'A dystopian social science fiction novel and cautionary tale about totalitarianism.', 40),
  
  ('Pride and Prejudice', 'Jane Austen', '978-0141439518', 11.99, 
   'A romantic novel of manners that critiques the British landed gentry at the end of the 18th century.', 30),
  
  ('The Catcher in the Rye', 'J.D. Salinger', '978-0316769174', 13.50, 
   'A story about teenage rebellion and angst, narrated by the iconic Holden Caulfield.', 25)
ON CONFLICT (isbn) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_book_updated_at ON "Book";
CREATE TRIGGER update_book_updated_at BEFORE UPDATE ON "Book" 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON "cart_items";
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON "cart_items" 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON "orders";
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON "orders" 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

