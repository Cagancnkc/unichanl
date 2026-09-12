import { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';
import type { TxClient } from '../withUser.js';

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
  async getBalance(userId: string, tx?: TxClient): Promise<Prisma.Decimal> {
    const client = tx ?? prisma;
    const row = await client.creditBalance.findUnique({ where: { userId } });
    return row?.balanceUsd ?? new Prisma.Decimal(0);
  },

  async topup(
    userId: string,
    amountUsd: NumericInput,
    idempotencyKey: string,
    metadata?: Record<string, unknown>,
    tx?: TxClient,
  ): Promise<Prisma.Decimal> {
    const amount = toDecimal(amountUsd);
    if (amount.lte(0)) throw new Error('topup_amount_must_be_positive');

    const doTopup = async (txClient: TxClient) => {
      const existing = await txClient.creditTransaction.findUnique({ where: { polarOrderId: idempotencyKey } });
      if (existing) {
        const bal = await txClient.creditBalance.findUnique({ where: { userId } });
        return bal?.balanceUsd ?? new Prisma.Decimal(0);
      }

      const upserted = await txClient.creditBalance.upsert({
        where: { userId },
        update: { balanceUsd: { increment: amount } },
        create: { userId, balanceUsd: amount },
      });

      await txClient.creditTransaction.create({
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
    };

    if (tx) return doTopup(tx);
    return prisma.$transaction(doTopup);
  },

  async debit(userId: string, amountUsd: NumericInput, requestId?: string, tx?: TxClient): Promise<Prisma.Decimal> {
    const amount = toDecimal(amountUsd);
    if (amount.lte(0)) throw new Error('debit_amount_must_be_positive');

    const doDebit = async (txClient: TxClient) => {
      const bal = await txClient.creditBalance.findUnique({ where: { userId } });
      const current = bal?.balanceUsd ?? new Prisma.Decimal(0);
      if (current.lt(amount)) {
        throw new InsufficientCreditsError(current.toString(), amount.toString());
      }

      const updated = await txClient.creditBalance.update({
        where: { userId },
        data: { balanceUsd: { decrement: amount } },
      });

      await txClient.creditTransaction.create({
        data: {
          userId,
          type: 'debit',
          amountUsd: amount.neg(),
          balanceAfter: updated.balanceUsd,
          requestId: requestId ?? null,
        },
      });

      return updated.balanceUsd;
    };

    if (tx) return doDebit(tx);
    return prisma.$transaction(doDebit);
  },

  async listTransactions(userId: string, limit = 50, tx?: TxClient) {
    const client = tx ?? prisma;
    return client.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  async hasRealTopup(userId: string, tx?: TxClient): Promise<Date | null> {
    const client = tx ?? prisma;
    const topups = await client.creditTransaction.findMany({
      where: { userId, type: 'topup' },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true, metadata: true },
    });
    for (const txn of topups) {
      const meta = (txn.metadata ?? {}) as Record<string, unknown>;
      if (meta.source !== 'signup_bonus') return txn.createdAt;
    }
    return null;
  },
};
