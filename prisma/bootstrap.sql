-- Idempotent schema repair: ensures columns exist even if _prisma_migrations
-- table thinks they were applied. Safe to run on every boot.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastAutoRechargeAttemptAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "polarCustomerId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "autoRechargeEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "autoRechargeThreshold" INTEGER NOT NULL DEFAULT 1000;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "autoRechargeAmount" INTEGER NOT NULL DEFAULT 10000;
