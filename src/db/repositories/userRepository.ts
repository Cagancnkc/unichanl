import { prisma } from '../prisma.js';

export type UserTier = 'free' | 'pro' | 'team' | 'enterprise';

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
    return prisma.user.create({ data });
  },

  async upsertByEmail(email: string, data: { name?: string; polarCustomerId?: string; tier?: UserTier }) {
    return prisma.user.upsert({
      where: { email },
      update: data,
      create: { email, ...data },
    });
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
};
