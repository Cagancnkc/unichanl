import type { FastifyInstance, FastifyRequest } from 'fastify';
import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { getCircuitBreaker } from '../../cache/circuitBreaker.js';

interface ListQuery {
  provider?: string;
  tag?: string;
  search?: string;
  page?: string;
  limit?: string;
  includeDisabled?: string;
}

export async function modelRoutes(app: FastifyInstance): Promise<void> {
  app.get('/models', async (request: FastifyRequest<{ Querystring: ListQuery }>, reply) => {
    const q = request.query;
    const page = Math.max(1, parseInt(q.page ?? '1'));
    const limit = Math.min(200, Math.max(1, parseInt(q.limit ?? '50')));
    const includeDisabled = q.includeDisabled === 'true';

    const where: Prisma.ModelWhereInput = {
      isPublic: true,
      ...(includeDisabled ? {} : { enabled: true }),
    };

    if (q.provider) {
      const provider = await prisma.provider.findUnique({ where: { name: q.provider } });
      if (!provider) {
        return reply.send({ models: [], total: 0, page, limit });
      }
      where.providerId = provider.id;
    }

    if (q.tag) {
      where.capabilityTags = { has: q.tag };
    }

    if (q.search) {
      where.OR = [
        { modelName: { contains: q.search, mode: 'insensitive' } },
        { displayName: { contains: q.search, mode: 'insensitive' } },
      ];
    }

    const [total, models] = await Promise.all([
      prisma.model.count({ where }),
      prisma.model.findMany({
        where,
        include: { provider: { select: { name: true, displayName: true } } },
        orderBy: [{ priority: 'desc' }, { displayName: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const modelsWithStatus = await Promise.all(
      models.map(async (m) => {
        const cb = getCircuitBreaker(m.modelName);
        const cbState = await cb.getState().catch(() => ({ state: 'unknown' as const }));
        return {
          id: m.id,
          modelName: m.modelName,
          displayName: m.displayName,
          description: m.description,
          logoUrl: m.logoUrl,
          provider: m.provider.name,
          providerDisplayName: m.provider.displayName,
          contextWindow: m.contextWindow,
          inputPricePer1k: Number(m.inputCostPer1k),
          outputPricePer1k: Number(m.outputCostPer1k),
          tags: m.capabilityTags,
          enabled: m.enabled,
          healthStatus: m.healthStatus,
          syncedAt: m.syncedAt,
          circuitState: cbState.state,
          isFree: Number(m.inputCostPer1k) === 0 && Number(m.outputCostPer1k) === 0,
        };
      }),
    );

    reply.send({ models: modelsWithStatus, total, page, limit });
  });

  app.patch('/models/:id/toggle', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { enabled } = request.body as { enabled: boolean };

    const model = await prisma.model.findUnique({ where: { id } });
    if (!model) {
      reply.status(404).send({ error: 'Model bulunamadı' });
      return;
    }

    await prisma.model.update({
      where: { id },
      data: { enabled },
    });

    reply.send({ success: true, enabled });
  });
}
