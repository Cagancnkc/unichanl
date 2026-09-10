import { prisma } from '../../db/prisma.js';
import { logger } from '../../utils/logger.js';
import { fetchOpenRouterModels } from './openRouterSync.js';
import { fetchNvidiaModels } from './nvidiaSync.js';
import type { UpstreamModel } from './openRouterSync.js';

const PROVIDER_META: Record<string, { displayName: string; baseUrl: string }> = {
  openrouter: { displayName: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1' },
  nvidia: {
    displayName: 'NVIDIA',
    baseUrl: process.env.NVIDIA_API_BASE ?? 'https://integrate.api.nvidia.com/v1',
  },
};

export interface SyncResult {
  provider: string;
  added: number;
  updated: number;
  markedInactive: number;
  errors: string[];
}

async function ensureProvider(providerName: string): Promise<string> {
  const meta = PROVIDER_META[providerName];
  if (!meta) throw new Error(`Unknown provider: ${providerName}`);

  const existing = await prisma.provider.findUnique({ where: { name: providerName } });
  if (existing) return existing.id;

  const created = await prisma.provider.create({
    data: { name: providerName, displayName: meta.displayName, baseUrl: meta.baseUrl },
  });
  return created.id;
}

async function syncProviderModels(
  providerName: string,
  fetcher: () => Promise<UpstreamModel[]>,
): Promise<SyncResult> {
  const result: SyncResult = { provider: providerName, added: 0, updated: 0, markedInactive: 0, errors: [] };
  const syncedAt = new Date();

  let models: UpstreamModel[];
  try {
    models = await fetcher();
  } catch (err) {
    result.errors.push((err as Error).message);
    return result;
  }

  if (models.length === 0) {
    logger.warn({ provider: providerName }, 'Upstream sync returned 0 models');
    return result;
  }

  const providerId = await ensureProvider(providerName);
  const upstreamIds = new Set(models.map((m) => m.modelName));

  for (const m of models) {
    try {
      const existing = await prisma.model.findUnique({ where: { modelName: m.modelName } });
      if (existing) {
        await prisma.model.update({
          where: { modelName: m.modelName },
          data: {
            providerId,
            displayName: m.displayName,
            capabilityTags: m.capabilityTags,
            inputCostPer1k: m.inputCostPer1k,
            outputCostPer1k: m.outputCostPer1k,
            contextWindow: m.contextWindow,
            description: m.description,
            logoUrl: m.logoUrl,
            upstreamMetadata: m.upstreamMetadata as any,
            syncedAt,
            enabled: existing.enabled,
          },
        });
        result.updated++;
      } else {
        await prisma.model.create({
          data: {
            providerId,
            modelName: m.modelName,
            displayName: m.displayName,
            capabilityTags: m.capabilityTags,
            inputCostPer1k: m.inputCostPer1k,
            outputCostPer1k: m.outputCostPer1k,
            contextWindow: m.contextWindow,
            description: m.description,
            logoUrl: m.logoUrl,
            upstreamMetadata: m.upstreamMetadata as any,
            syncedAt,
            enabled: true,
            isPublic: true,
          },
        });
        result.added++;
      }
    } catch (err) {
      result.errors.push(`${m.modelName}: ${(err as Error).message}`);
    }
  }

  const stale = await prisma.model.findMany({
    where: {
      providerId,
      enabled: true,
      modelName: { notIn: Array.from(upstreamIds) },
    },
    select: { id: true, modelName: true },
  });

  if (stale.length > 0) {
    await prisma.model.updateMany({
      where: { id: { in: stale.map((s) => s.id) } },
      data: { enabled: false, healthStatus: 'unavailable' },
    });
    result.markedInactive = stale.length;
    logger.info(
      { provider: providerName, count: stale.length, names: stale.map((s) => s.modelName) },
      'Stale modeller devre dışı bırakıldı',
    );
  }

  return result;
}

export async function syncAllProviders(): Promise<SyncResult[]> {
  logger.info('Model senkronizasyonu başlıyor...');
  const startTime = Date.now();

  const results = await Promise.all([
    syncProviderModels('openrouter', fetchOpenRouterModels),
    syncProviderModels('nvidia', fetchNvidiaModels),
  ]);

  const durationMs = Date.now() - startTime;
  const totalAdded = results.reduce((s, r) => s + r.added, 0);
  const totalUpdated = results.reduce((s, r) => s + r.updated, 0);
  const totalInactive = results.reduce((s, r) => s + r.markedInactive, 0);
  const errorCount = results.reduce((s, r) => s + r.errors.length, 0);

  logger.info(
    { durationMs, totalAdded, totalUpdated, totalInactive, errorCount, results },
    'Model senkronizasyonu tamamlandı',
  );

  return results;
}
