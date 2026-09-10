import type { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma.js';

export async function publicModelRoutes(app: FastifyInstance): Promise<void> {
  // OpenAI-compatible /v1/models endpoint — no auth required, matches OpenAI SDK expectations.
  app.get('/v1/models', async (_request, reply) => {
    const models = await prisma.model.findMany({
      where: { enabled: true, isPublic: true },
      include: { provider: { select: { name: true } } },
      orderBy: [{ priority: 'desc' }, { modelName: 'asc' }],
    });

    reply.send({
      object: 'list',
      data: models.map((m) => ({
        id: m.modelName,
        object: 'model',
        created: Math.floor((m.createdAt?.getTime() ?? Date.now()) / 1000),
        owned_by: m.provider.name,
      })),
    });
  });

  // Katalog için public listeleme — auth yok, filtre destekli.
  app.get('/api/public/models', async (request, reply) => {
    const q = request.query as {
      provider?: string;
      tag?: string;
      search?: string;
      page?: string;
      limit?: string;
    };
    const page = Math.max(1, parseInt(q.page ?? '1'));
    const limit = Math.min(200, Math.max(1, parseInt(q.limit ?? '50')));

    const where: Prisma.ModelWhereInput = {
      enabled: true,
      isPublic: true,
    };

    if (q.provider) {
      const provider = await prisma.provider.findUnique({ where: { name: q.provider } });
      if (!provider) return reply.send({ models: [], total: 0, page, limit });
      where.providerId = provider.id;
    }
    if (q.tag) where.capabilityTags = { has: q.tag };
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

    reply.send({
      models: models.map((m) => ({
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
        isFree: Number(m.inputCostPer1k) === 0 && Number(m.outputCostPer1k) === 0,
      })),
      total,
      page,
      limit,
    });
  });
}
