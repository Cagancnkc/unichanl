-- AlterTable
ALTER TABLE "users" ADD COLUMN     "autoRechargeAmount" DECIMAL(8,2) NOT NULL DEFAULT 5.00,
ADD COLUMN     "autoRechargeEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoRechargeThreshold" DECIMAL(8,2) NOT NULL DEFAULT 1.00;
