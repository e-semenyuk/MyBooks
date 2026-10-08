-- Email verification, password reset tokens, login lockout and the email
-- outbox (XPANBFLFA-102, 103, 104). Existing accounts count as verified.

-- CreateEnum
CREATE TYPE "TokenPurpose" AS ENUM ('PASSWORD_RESET', 'EMAIL_VERIFICATION');

-- AlterTable
ALTER TABLE "users"
  ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "failedLogins" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastFailedLoginAt" TIMESTAMP(3),
  ADD COLUMN "lockedUntil" TIMESTAMP(3);

UPDATE "users" SET "emailVerifiedAt" = "createdAt";

-- CreateTable
CREATE TABLE "auth_tokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "purpose" "TokenPurpose" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_outbox" (
    "id" SERIAL NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "email_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_tokens_tokenHash_key" ON "auth_tokens"("tokenHash");
CREATE INDEX "auth_tokens_userId_purpose_idx" ON "auth_tokens"("userId", "purpose");
CREATE INDEX "email_outbox_to_idx" ON "email_outbox"("to");

-- AddForeignKey
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
