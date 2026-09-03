import argon2 from 'argon2';
import { prisma } from '../prisma.js';
import { generateApiKey } from '../../utils/id.js';

export const apiKeyRepository = {
  async findByPrefix(prefix: string) {
    return prisma.apiKey.findMany({
      where: { keyPrefix: prefix, enabled: true },
      include: { user: true },
    });
  },

  async create(userId: string, name?: string): Promise<{ key: string; record: { id: string; keyPrefix: string } }> {
    const rawKey = generateApiKey();
    const keyHash = await argon2.hash(rawKey);
    const keyPrefix = rawKey.slice(0, 8);

    const record = await prisma.apiKey.create({
      data: { userId, keyHash, keyPrefix, name },
    });

    return { key: rawKey, record };
  },

  async revoke(id: string) {
    await prisma.apiKey.update({ where: { id }, data: { enabled: false } });
  },

  async updateLastUsed(id: string) {
    await prisma.apiKey.update({ where: { id }, data: { lastUsedAt: new Date() } });
  },

  async listByUser(userId: string) {
    return prisma.apiKey.findMany({
      where: { userId },
      select: { id: true, keyPrefix: true, name: true, rateLimit: true, enabled: true, lastUsedAt: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: 'desc' },
    });
  },
};
