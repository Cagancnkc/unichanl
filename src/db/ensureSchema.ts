import { prisma } from './prisma.js';
import { logger } from '../utils/logger.js';

const REPAIR_STATEMENTS: Array<{ label: string; sql: string }> = [
  {
    label: 'users.polarCustomerId',
    sql: `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "polarCustomerId" TEXT`,
  },
  {
    label: 'users.polarCustomerId unique index',
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS "users_polarCustomerId_key" ON "users"("polarCustomerId")`,
  },
  {
    label: 'users.autoRechargeEnabled',
    sql: `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "autoRechargeEnabled" BOOLEAN NOT NULL DEFAULT true`,
  },
  {
    label: 'users.autoRechargeThreshold',
    sql: `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "autoRechargeThreshold" DECIMAL(8,2) NOT NULL DEFAULT 1.00`,
  },
  {
    label: 'users.autoRechargeAmount',
    sql: `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "autoRechargeAmount" DECIMAL(8,2) NOT NULL DEFAULT 5.00`,
  },
  {
    label: 'users.lastAutoRechargeAttemptAt',
    sql: `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastAutoRechargeAttemptAt" TIMESTAMP(3)`,
  },
];

export async function ensureSchema(): Promise<void> {
  logger.info('Schema drift check başlıyor...');
  let repaired = 0;
  let failed = 0;
  for (const { label, sql } of REPAIR_STATEMENTS) {
    try {
      await prisma.$executeRawUnsafe(sql);
      repaired++;
      logger.info({ column: label }, 'Schema check OK');
    } catch (err) {
      failed++;
      logger.error({ err, column: label, sql }, 'Schema repair failed');
    }
  }
  logger.info(
    { repaired, failed, total: REPAIR_STATEMENTS.length },
    'Schema drift check tamam',
  );
}
