-- Update existing database to add authentication support
-- Run this in Supabase SQL Editor if you already have data

-- Step 1: Create UserRole enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for users email
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");

-- Step 3: Add userId column to orders table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'userId'
    ) THEN
        ALTER TABLE "orders" ADD COLUMN "userId" INTEGER;
    END IF;
END $$;

-- Step 4: Create index for userId in orders
CREATE INDEX IF NOT EXISTS "orders_userId_idx" ON "orders"("userId");

-- Step 5: Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_userId_fkey'
    ) THEN
        ALTER TABLE "orders"
        ADD CONSTRAINT "orders_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 6: Insert default admin user
INSERT INTO "users" ("email", "password", "name", "role")
VALUES
  ('admin@bookstore.com', '$2b$10$D5rCDli6BRcqwmkWc4Iede9gIeIrwl6WzaOF6DcTyx.Ym4boV7VOO', 'Admin User', 'ADMIN')
ON CONFLICT (email) DO NOTHING;

-- Step 7: Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_users_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 8: Add trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON "users";
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON "users" 
  FOR EACH ROW 
  EXECUTE FUNCTION update_users_updated_at_column();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Database updated successfully!';
  RAISE NOTICE '📧 Admin email: admin@bookstore.com';
  RAISE NOTICE '🔑 Admin password: admin123';
END $$;

