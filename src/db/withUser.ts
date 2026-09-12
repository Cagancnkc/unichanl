import type { Prisma } from '@prisma/client';
import { prisma } from './prisma.js';

export type TxClient = Prisma.TransactionClient;

/**
 * Runs `fn` inside a transaction with `app.user_id` set for the duration.
 * RLS policies read the GUC via `app_current_user_id()`.
 *
 * Callers MUST use the passed `tx` client for every query that should see
 * the user's rows. Queries issued on the module-level `prisma` client
 * during `fn` run without the GUC and get blocked by RLS.
 */
export async function withUserContext<T>(
  userId: string,
  fn: (tx: TxClient) => Promise<T>,
): Promise<T> {
  if (!userId) throw new Error('withUserContext: userId is required');
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SELECT set_config('app.user_id', $1, true)`, userId);
    return fn(tx);
  });
}
