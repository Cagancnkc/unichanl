import { prisma } from '../prisma.js';
import type { UserTier } from './userRepository.js';

export interface SubscriptionUpsertInput {
  userId: string;
  polarSubscriptionId: string;
  polarProductId: string;
  tier: UserTier;
  status: string;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
}

export const subscriptionRepository = {
  async findByPolarId(polarSubscriptionId: string) {
    return prisma.subscription.findUnique({ where: { polarSubscriptionId } });
  },

  async findActiveByUser(userId: string) {
    return prisma.subscription.findFirst({
      where: { userId, status: { in: ['active', 'trialing'] } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async listByUser(userId: string) {
    return prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async upsert(input: SubscriptionUpsertInput) {
    const { polarSubscriptionId, ...rest } = input;
    return prisma.subscription.upsert({
      where: { polarSubscriptionId },
      update: {
        polarProductId: rest.polarProductId,
        tier: rest.tier,
        status: rest.status,
        currentPeriodStart: rest.currentPeriodStart ?? null,
        currentPeriodEnd: rest.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: rest.cancelAtPeriodEnd ?? false,
      },
      create: {
        polarSubscriptionId,
        userId: rest.userId,
        polarProductId: rest.polarProductId,
        tier: rest.tier,
        status: rest.status,
        currentPeriodStart: rest.currentPeriodStart ?? null,
        currentPeriodEnd: rest.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: rest.cancelAtPeriodEnd ?? false,
      },
    });
  },

  async updateStatus(polarSubscriptionId: string, status: string, cancelAtPeriodEnd?: boolean) {
    return prisma.subscription.update({
      where: { polarSubscriptionId },
      data: {
        status,
        ...(cancelAtPeriodEnd !== undefined ? { cancelAtPeriodEnd } : {}),
      },
    });
  },
};
