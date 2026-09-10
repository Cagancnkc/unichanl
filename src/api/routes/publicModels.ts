import type { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { deriveCreator } from '../../providers/creatorMap.js';

const MARKUP = 1.95;
const DISCOUNT_PERCENT = 45;
const LIST_MULTIPLIER = MARKUP / (1 - DISCOUNT_PERCENT / 100); // 1.95 / 0.55

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
      if (!provider) return reply.send({ models: [], total: 0, creatorCount: 0, page, limit });
      where.providerId = provider.id;
    }
    if (q.tag) where.capabilityTags = { has: q.tag };
    if (q.search) {
      where.OR = [
        { modelName: { contains: q.search, mode: 'insensitive' } },
        { displayName: { contains: q.search, mode: 'insensitive' } },
      ];
    }

    // Global chip sayıları filtre-bağımsız olsun: tag/search uygulanmamış aggregate.
    const globalWhere: Prisma.ModelWhereInput = {
      enabled: true,
      isPublic: true,
      ...(where.providerId ? { providerId: where.providerId } : {}),
    };

    const [total, models, allNames, allTags] = await Promise.all([
      prisma.model.count({ where }),
      prisma.model.findMany({
        where,
        include: { provider: { select: { name: true, displayName: true } } },
        orderBy: [{ priority: 'desc' }, { displayName: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.model.findMany({
        where: globalWhere,
        select: { modelName: true, upstreamMetadata: true, provider: { select: { displayName: true } } },
      }),
      prisma.model.findMany({
        where: globalWhere,
        select: { capabilityTags: true },
      }),
    ]);

    const brandSet = new Set<string>();
    for (const n of allNames) {
      const { brand } = deriveCreator(n.modelName, n.upstreamMetadata, n.provider.displayName);
      brandSet.add(brand);
    }

    const tagCounts: Record<string, number> = {};
    for (const row of allTags) {
      for (const t of row.capabilityTags) {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      }
    }

    reply.send({
      models: models.map((m) => {
        const { brand, displayName: creatorDisplayName } = deriveCreator(
          m.modelName,
          m.upstreamMetadata,
          m.provider.displayName,
        );
        const inCost = Number(m.inputCostPer1k);
        const outCost = Number(m.outputCostPer1k);
        const isFree = inCost === 0 && outCost === 0;
        return {
          id: m.id,
          modelName: m.modelName,
          displayName: m.displayName,
          description: m.description,
          logoUrl: m.logoUrl,
          provider: m.provider.name,
          providerDisplayName: m.provider.displayName,
          creatorBrand: brand,
          creatorDisplayName,
          contextWindow: m.contextWindow,
          inputPricePer1k: inCost,
          outputPricePer1k: outCost,
          listInputPricePer1k: isFree ? 0 : inCost * LIST_MULTIPLIER,
          listOutputPricePer1k: isFree ? 0 : outCost * LIST_MULTIPLIER,
          discountedInputPricePer1k: isFree ? 0 : inCost * MARKUP,
          discountedOutputPricePer1k: isFree ? 0 : outCost * MARKUP,
          discountPercent: isFree ? 0 : DISCOUNT_PERCENT,
          tags: m.capabilityTags,
          isFree,
        };
      }),
      total,
      creatorCount: brandSet.size,
      tagCounts,
      page,
      limit,
    });
  });
}
