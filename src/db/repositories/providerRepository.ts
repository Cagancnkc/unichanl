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
    const providers = await this.listActive();
    return providers.map((p) => {
      const latest = p.providerHealth[0];
      const _p = p as any;
      return {
        id: p.id,
        name: p.name,
        displayName: p.displayName,
        baseUrl: p.baseUrl,
        enabled: p.enabled,
        modelCount: _p._count?.models || 0,
        health: latest
          ? {
              status: latest.status,
              latencyMs: latest.latencyMs,
              errorRate: latest.errorRate,
              checkedAt: latest.checkedAt.toISOString(),
              errorMessage: latest.errorMessage,
            }
          : null,
      };
    });
  },
};
