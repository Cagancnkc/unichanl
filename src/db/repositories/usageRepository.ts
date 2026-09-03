import { prisma } from '../prisma.js';
import type { UsageRecordInput } from '../../types/index.js';

export const usageRepository = {
  async record(data: UsageRecordInput) {
    await prisma.usageRecord.create({ data });
  },

  async getUserStats(userId: string, since: Date) {
    return prisma.usageRecord.groupBy({
      by: ['modelId', 'provider'],
      where: { userId, createdAt: { gte: since } },
      _sum: { inputTokens: true, outputTokens: true, totalCostUsd: true },
      _count: { id: true },
      _avg: { latencyMs: true },
    });
  },

  async getTotalCost(userId: string, since: Date): Promise<number> {
    const result = await prisma.usageRecord.aggregate({
      where: { userId, createdAt: { gte: since } },
      _sum: { totalCostUsd: true },
    });
    return Number(result._sum.totalCostUsd ?? 0);
  },

  async getRecentRecords(userId: string, limit = 50) {
    return prisma.usageRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        requestId: true,
        modelId: true,
        provider: true,
        inputTokens: true,
        outputTokens: true,
        totalCostUsd: true,
        latencyMs: true,
        routingStrategy: true,
        wasFailover: true,
        createdAt: true,
        model: { select: { displayName: true } },
      },
    });
  },
};
