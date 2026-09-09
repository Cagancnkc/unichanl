import { Prisma } from '@prisma/client';
import { redis } from '../cache/redis.js';
import { userRepository } from '../db/repositories/userRepository.js';
import { creditRepository } from '../db/repositories/creditRepository.js';
import { createRechargeSession } from '../billing/polar.js';
import { sendEmail, renderLowBalanceEmail } from '../notifications/email.js';
import { logger } from '../utils/logger.js';

const LOCK_KEY = 'autorecharge:scan:lock';
const LOCK_TTL_SEC = 60;
const BACKOFF_HOURS = 6;

interface ScanStats {
  scanned: number;
  triggered: number;
  skipped: number;
  errors: number;
}

async function acquireLock(): Promise<boolean> {
  try {
    const res = await redis.set(LOCK_KEY, '1', 'EX', LOCK_TTL_SEC, 'NX');
    return res === 'OK';
  } catch (err) {
    logger.warn({ err }, 'autoRecharge lock acquire failed');
    return false;
  }
}

async function releaseLock(): Promise<void> {
  try {
    await redis.del(LOCK_KEY);
  } catch {
    /* ignore */
  }
}

export function withinBackoff(lastAttempt: Date | null | undefined, backoffHours = BACKOFF_HOURS): boolean {
  if (!lastAttempt) return false;
  const ageMs = Date.now() - lastAttempt.getTime();
  return ageMs < backoffHours * 60 * 60 * 1000;
}

async function attemptRecharge(user: {
  id: string;
  email: string;
  autoRechargeThreshold: Prisma.Decimal;
  autoRechargeAmount: Prisma.Decimal;
  polarCustomerId: string | null;
}, balance: Prisma.Decimal): Promise<'triggered' | 'error'> {
  const amountUsd = Number(user.autoRechargeAmount);
  const thresholdStr = user.autoRechargeThreshold.toString();

  try {
    const session = await createRechargeSession({
      userId: user.id,
      customerEmail: user.email,
      customerId: user.polarCustomerId ?? undefined,
      amountUsd,
      successUrl: process.env.APP_URL ? `${process.env.APP_URL}/dashboard.html` : undefined,
    });

    const { subject, html } = renderLowBalanceEmail({
      email: user.email,
      amountUsd,
      checkoutUrl: session.url,
      balanceUsd: balance.toString(),
      thresholdUsd: thresholdStr,
    });
    await sendEmail({ to: user.email, subject, html });
    logger.info({ userId: user.id, amountUsd, checkoutId: session.checkoutId }, 'autoRecharge triggered');
    return 'triggered';
  } catch (err) {
    logger.error({ err, userId: user.id }, 'autoRecharge attempt failed');
    return 'error';
  }
}

export async function runAutoRechargeScan(): Promise<ScanStats> {
  const stats: ScanStats = { scanned: 0, triggered: 0, skipped: 0, errors: 0 };
  const gotLock = await acquireLock();
  if (!gotLock) {
    logger.debug('autoRecharge scan skipped: lock held');
    return stats;
  }

  try {
    const candidates = await userRepository.listAutoRechargeCandidates();
    for (const user of candidates) {
      stats.scanned += 1;
      try {
        const balance = await creditRepository.getBalance(user.id);
        if (balance.gte(user.autoRechargeThreshold)) {
          stats.skipped += 1;
          continue;
        }
        if (withinBackoff(user.lastAutoRechargeAttemptAt)) {
          stats.skipped += 1;
          continue;
        }
        const outcome = await attemptRecharge(user, balance);
        if (outcome === 'triggered') stats.triggered += 1;
        else stats.errors += 1;
        await userRepository.markAutoRechargeAttempted(user.id);
      } catch (err) {
        stats.errors += 1;
        logger.error({ err, userId: user.id }, 'autoRecharge user loop failed');
      }
    }
    logger.info(stats, 'autoRecharge scan complete');
  } finally {
    await releaseLock();
  }
  return stats;
}

export function startAutoRechargeScanner(): { stop: () => void } {
  const enabled = process.env.AUTO_RECHARGE_SCAN_ENABLED !== 'false' && process.env.NODE_ENV !== 'test';
  if (!enabled) {
    logger.info('autoRecharge scanner disabled');
    return { stop: () => {} };
  }

  const intervalSec = Number(process.env.AUTO_RECHARGE_SCAN_INTERVAL_SEC ?? 300);
  const intervalMs = Math.max(30, intervalSec) * 1000;

  const handle = setInterval(() => {
    runAutoRechargeScan().catch((err) => logger.error({ err }, 'autoRecharge scan crashed'));
  }, intervalMs);
  handle.unref();

  logger.info({ intervalSec }, 'autoRecharge scanner started');
  return {
    stop: () => clearInterval(handle),
  };
}
