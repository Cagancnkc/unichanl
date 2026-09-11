import { prisma } from '../prisma.js';

export const providerRepository = {
  async listActive() {
    return prisma.provider.findMany({
      where: { enabled: true },
      orderBy: { name: 'asc' },
      include: {
        providerHealth: {
          orderBy: { checkedAt: 'desc' },
          take: 1,
        },
      },
    });
  },

  async getSummary() {
    const providers = await prisma.provider.findMany({
      where: { enabled: true },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { models: { where: { enabled: true } } } },
        models: {
          where: { enabled: true },
          select: { healthStatus: true, avgLatencyMs: true },
        },
      },
    });

    return providers.map((p) => {
      const models = p.models;
      let health: {
        status: string;
        latencyMs: number | null;
        errorRate: number;
        checkedAt: string;
        errorMessage: null;
      } | null = null;

      if (models.length > 0) {
        const healthy = models.filter((m) => m.healthStatus === 'healthy').length;
        const down = models.filter(
          (m) => m.healthStatus === 'down' || m.healthStatus === 'unavailable',
        ).length;
        const status =
          healthy === models.length
            ? 'healthy'
            : down === models.length
              ? 'error'
              : 'degraded';
        const avgLatencyMs = Math.round(
          models.reduce((s, m) => s + m.avgLatencyMs, 0) / models.length,
        );
        health = {
          status,
          latencyMs: avgLatencyMs,
          errorRate: down / models.length,
          checkedAt: new Date().toISOString(),
          errorMessage: null,
        };
      }

      return {
        id: p.id,
        name: p.name,
        displayName: p.displayName,
        baseUrl: p.baseUrl,
        enabled: p.enabled,
        modelCount: p._count.models,
        health,
      };
    });
  },
};
