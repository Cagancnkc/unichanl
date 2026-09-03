import { prisma } from '../prisma.js';
import type { ModelCandidate } from '../../types/index.js';

export const modelRepository = {
  async findAll(enabledOnly = true): Promise<ModelCandidate[]> {
    const models = await prisma.model.findMany({
      where: enabledOnly ? { enabled: true } : {},
      orderBy: { priority: 'desc' },
    });

    return models.map((m) => ({
      id: m.id,
      openrouterModelId: m.modelName,
      provider: m.providerId,
      displayName: m.displayName,
      capabilityTags: m.capabilityTags,
      inputCostPer1k: Number(m.inputCostPer1k),
      outputCostPer1k: Number(m.outputCostPer1k),
      priority: m.priority,
      avgLatencyMs: m.avgLatencyMs,
      healthStatus: m.healthStatus as 'healthy' | 'degraded' | 'down',
    }));
  },

  async findById(id: string) {
    return prisma.model.findUnique({ where: { id } });
  },

  async findByName(modelName: string) {
    return prisma.model.findUnique({ where: { modelName } });
  },

  async updateHealthStatus(id: string, status: string, latencyMs?: number) {
    await prisma.model.update({
      where: { id },
      data: { healthStatus: status, ...(latencyMs != null ? { avgLatencyMs: latencyMs } : {}) },
    });
  },

  async updateAvgLatency(id: string, newLatencyMs: number) {
    const model = await prisma.model.findUnique({ where: { id }, select: { avgLatencyMs: true } });
    if (!model) return;
    const rollingAvg = Math.round(0.9 * model.avgLatencyMs + 0.1 * newLatencyMs);
    await prisma.model.update({ where: { id }, data: { avgLatencyMs: rollingAvg } });
  },

  async listPublic() {
    return prisma.model.findMany({
      where: { enabled: true },
      select: {
        id: true,
        modelName: true,
        displayName: true,
        capabilityTags: true,
        contextWindow: true,
        priority: true,
        healthStatus: true,
        avgLatencyMs: true,
        provider: { select: { name: true, displayName: true } },
      },
      orderBy: { priority: 'desc' },
    });
  },
};
