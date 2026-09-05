import { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';

export class InsufficientCreditsError extends Error {
  constructor(public readonly balanceUsd: string, public readonly requiredUsd: string) {
    super('insufficient_credits');
    this.name = 'InsufficientCreditsError';
  }
}

type NumericInput = number | string | Prisma.Decimal;

function toDecimal(v: NumericInput): Prisma.Decimal {
  return v instanceof Prisma.Decimal ? v : new Prisma.Decimal(v);
}

export const creditRepository = {
  async getBalance(userId: string): Promise<Prisma.Decimal> {
    const row = await prisma.creditBalance.findUnique({ where: { userId } });
    return row?.balanceUsd ?? new Prisma.Decimal(0);
  },

  async topup(
    userId: string,
    amountUsd: NumericInput,
    idempotencyKey: string,
    metadata?: Record<string, unknown>,
  ): Promise<Prisma.Decimal> {
    const amount = toDecimal(amountUsd);
    if (amount.lte(0)) throw new Error('topup_amount_must_be_positive');

    return prisma.$transaction(async (tx) => {
      const existing = await tx.creditTransaction.findUnique({ where: { polarOrderId: idempotencyKey } });
      if (existing) {
        const bal = await tx.creditBalance.findUnique({ where: { userId } });
        return bal?.balanceUsd ?? new Prisma.Decimal(0);
      }

      const upserted = await tx.creditBalance.upsert({
        where: { userId },
        update: { balanceUsd: { increment: amount } },
        create: { userId, balanceUsd: amount },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          type: 'topup',
          amountUsd: amount,
          balanceAfter: upserted.balanceUsd,
          polarOrderId: idempotencyKey,
          metadata: (metadata ?? {}) as Prisma.InputJsonValue,
        },
      });

      return upserted.balanceUsd;
    });
  },

  async debit(userId: string, amountUsd: NumericInput, requestId?: string): Promise<Prisma.Decimal> {
    const amount = toDecimal(amountUsd);
    if (amount.lte(0)) throw new Error('debit_amount_must_be_positive');

    return prisma.$transaction(async (tx) => {
      const bal = await tx.creditBalance.findUnique({ where: { userId } });
      const current = bal?.balanceUsd ?? new Prisma.Decimal(0);
      if (current.lt(amount)) {
        throw new InsufficientCreditsError(current.toString(), amount.toString());
      }

      const updated = await tx.creditBalance.update({
        where: { userId },
        data: { balanceUsd: { decrement: amount } },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          type: 'debit',
          amountUsd: amount.neg(),
          balanceAfter: updated.balanceUsd,
          requestId: requestId ?? null,
        },
      });

      return updated.balanceUsd;
    });
  },

  async listTransactions(userId: string, limit = 50) {
    return prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  async hasRealTopup(userId: string): Promise<Date | null> {
    const topups = await prisma.creditTransaction.findMany({
      where: { userId, type: 'topup' },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true, metadata: true },
    });
    for (const tx of topups) {
      const meta = (tx.metadata ?? {}) as Record<string, unknown>;
      if (meta.source !== 'signup_bonus') return tx.createdAt;
    }
    return null;
  },
};
