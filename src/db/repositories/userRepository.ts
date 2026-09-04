import { prisma } from '../prisma.js';
import { creditRepository } from './creditRepository.js';
import { WELCOME_CREDIT_USD } from '../../config/pricing.js';
import { logger } from '../../utils/logger.js';

export type UserTier = 'free' | 'pro' | 'team' | 'enterprise';

async function grantWelcomeCredit(userId: string): Promise<void> {
  if (WELCOME_CREDIT_USD <= 0) return;
  try {
    await creditRepository.topup(userId, WELCOME_CREDIT_USD, `welcome_${userId}`, { source: 'signup_bonus' });
  } catch (err) {
    logger.warn({ err, userId }, 'welcome credit grant failed');
  }
}

export const userRepository = {
  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  async findByPolarCustomerId(polarCustomerId: string) {
    return prisma.user.findUnique({ where: { polarCustomerId } });
  },

  async create(data: { email: string; name?: string; plan?: string; tier?: UserTier; polarCustomerId?: string }) {
    const user = await prisma.user.create({ data });
    await grantWelcomeCredit(user.id);
    return user;
  },

  async upsertByEmail(email: string, data: { name?: string; polarCustomerId?: string; tier?: UserTier }) {
    const existing = await prisma.user.findUnique({ where: { email } });
    const user = await prisma.user.upsert({
      where: { email },
      update: data,
      create: { email, ...data },
    });
    if (!existing) await grantWelcomeCredit(user.id);
    return user;
  },

  async updatePlan(id: string, plan: string) {
    return prisma.user.update({ where: { id }, data: { plan } });
  },

  async updateTier(id: string, tier: UserTier) {
    return prisma.user.update({ where: { id }, data: { tier } });
  },

  async setPolarCustomerId(id: string, polarCustomerId: string) {
    return prisma.user.update({ where: { id }, data: { polarCustomerId } });
  },

  async getRechargeSettings(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { autoRechargeEnabled: true, autoRechargeThreshold: true, autoRechargeAmount: true },
    });
  },

  async setRechargeSettings(id: string, data: { autoRechargeEnabled?: boolean }) {
    return prisma.user.update({ where: { id }, data });
  },
};
