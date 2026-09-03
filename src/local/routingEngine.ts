import type { ChatMessage, ProviderResponse, StreamChunk, RoutingStrategy } from '../types/index.js';
import type { ModelMetadata, ProviderName } from '../registry/model.types.js';
import type { InferenceProvider, CompletionOptions } from '../providers/types.js';
import { getModelRegistry } from '../registry/modelRegistry.js';
import { seedModels } from '../registry/seed.js';
import { openRouterAdapter } from '../providers/openRouterAdapter.js';
import { nvidiaAdapter } from '../providers/nvidiaAdapter.js';
import { getCircuitBreakers } from './circuitBreaker.js';
import { logger } from '../utils/logger.js';
import { recordUsage } from './usageLog.js';
import { computeCost } from './costTracker.js';
import { loadHealth, recordSuccess as recordHealthSuccess, recordFailure as recordHealthFailure } from './healthTracker.js';
import { filterByTier } from './tierGate.js';

export interface RouteRequest {
  requestedModel: string;
  strategy?: RoutingStrategy;
  capabilities?: string[];
  preferredTags?: string[];
  tier?: string;
}

export interface Attempt {
  modelId: string;
  providerName: ProviderName;
  latencyMs: number;
  ok: boolean;
  errorCode?: string;
}

export interface RouteResult {
  response: ProviderResponse;
  chosen: ModelMetadata;
  strategy: RoutingStrategy;
  reason: string;
  attempts: Attempt[];
}

export interface StreamRouteResult {
  chosen: ModelMetadata;
  strategy: RoutingStrategy;
  reason: string;
  attempts: Attempt[];
  chunks: AsyncGenerator<StreamChunk, void, unknown>;
}

let seeded = false;
function ensureSeeded(): void {
  if (seeded) return;
  const reg = getModelRegistry();
  if (reg.list().length === 0) reg.seed(seedModels());
  loadHealth();
  seeded = true;
}

function adapterFor(providerName: ProviderName): InferenceProvider {
  switch (providerName) {
    case 'nvidia':
      return nvidiaAdapter;
    case 'openrouter':
      return openRouterAdapter;
  }
}

function costSum(m: ModelMetadata): number {
  return m.cost.inputPerMTokUsd + m.cost.outputPerMTokUsd;
}

function latencyKey(m: ModelMetadata): number {
  const v = m.health.avgLatencyMs;
  return v > 0 ? v : Number.MAX_SAFE_INTEGER;
}

function tagOverlap(m: ModelMetadata, preferred: string[]): number {
  if (preferred.length === 0) return 0;
  let n = 0;
  for (const t of preferred) if (m.tags.includes(t)) n += 1;
  return n;
}

export function rankCandidates(
  models: ModelMetadata[],
  strategy: RoutingStrategy,
  capabilities: string[] = [],
  preferredTags: string[] = [],
): ModelMetadata[] {
  const filtered = models.filter((m) => {
    if (!m.enabled) return false;
    if (m.availability === 'DISABLED' || m.availability === 'UNAVAILABLE') return false;
    if (capabilities.length > 0) {
      for (const cap of capabilities) if (!m.tags.includes(cap)) return false;
    }
    return true;
  });

  const sorted = [...filtered];
  const boostFirst = (a: ModelMetadata, b: ModelMetadata) => tagOverlap(b, preferredTags) - tagOverlap(a, preferredTags);

  switch (strategy) {
    case 'cheapest':
      sorted.sort((a, b) => {
        const boost = boostFirst(a, b);
        if (boost !== 0) return boost;
        return costSum(a) - costSum(b);
      });
      break;
    case 'fastest':
      sorted.sort((a, b) => {
        const boost = boostFirst(a, b);
        if (boost !== 0) return boost;
        return latencyKey(a) - latencyKey(b);
      });
      break;
    case 'capability':
    case 'priority':
      if (preferredTags.length > 0) sorted.sort(boostFirst);
      break;
    case 'auto':
    default:
      sorted.sort((a, b) => {
        const availDelta =
          (a.availability === 'AVAILABLE' ? 0 : 1) - (b.availability === 'AVAILABLE' ? 0 : 1);
        if (availDelta !== 0) return availDelta;
        const boost = boostFirst(a, b);
        if (boost !== 0) return boost;
        const costDelta = costSum(a) - costSum(b);
        if (costDelta !== 0) return costDelta;
        return latencyKey(a) - latencyKey(b);
      });
      break;
  }
  return sorted;
}

export function selectCandidates(req: RouteRequest): { candidates: ModelMetadata[]; reason: string } {
  ensureSeeded();
  const reg = getModelRegistry();
  const strategy = req.strategy ?? 'auto';

  const pinned = reg.get(req.requestedModel);
  const all = filterByTier(reg.list(), req.tier);

  if (pinned && pinned.enabled && all.some((m) => m.id === pinned.id)) {
    const rest = rankCandidates(
      all.filter((m) => m.id !== pinned.id),
      strategy,
      req.capabilities,
      req.preferredTags,
    );
    return { candidates: [pinned, ...rest], reason: `pinned:${pinned.id}` };
  }

  const ranked = rankCandidates(all, strategy, req.capabilities, req.preferredTags);
  const tagSuffix = req.preferredTags && req.preferredTags.length > 0 ? `+brain:${req.preferredTags.join(',')}` : '';
  return { candidates: ranked, reason: `strategy:${strategy}${tagSuffix}` };
}

export async function routeComplete(
  req: RouteRequest,
  messages: ChatMessage[],
  options: CompletionOptions,
): Promise<RouteResult> {
  const strategy = req.strategy ?? 'auto';
  const { candidates, reason } = selectCandidates(req);
  const cb = getCircuitBreakers();
  const attempts: Attempt[] = [];

  if (candidates.length === 0) {
    throw new Error('Uygun model bulunamadı (registry boş veya tüm modeller devre dışı)');
  }

  for (const model of candidates) {
    if (cb.isOpen(model.id)) {
      attempts.push({
        modelId: model.id,
        providerName: model.providerName,
        latencyMs: 0,
        ok: false,
        errorCode: 'circuit_open',
      });
      continue;
    }

    const adapter = adapterFor(model.providerName);
    const resp = await adapter.complete(model.providerModelId, messages, options);
    attempts.push({
      modelId: model.id,
      providerName: model.providerName,
      latencyMs: resp.latencyMs,
      ok: resp.success,
      errorCode: resp.error?.code,
    });

    if (resp.success) {
      cb.recordSuccess(model.id);
      recordHealthSuccess(model, resp.latencyMs);
      const cost = computeCost(model, resp.data?.usage);
      recordUsage({
        ts: new Date().toISOString(),
        requestId: options.requestId,
        modelId: model.id,
        providerName: model.providerName,
        strategy,
        reason,
        attempts: attempts.length,
        latencyMs: resp.latencyMs,
        success: true,
        tokens: resp.data?.usage,
        cost,
      });
      return { response: resp, chosen: model, strategy, reason, attempts };
    }

    cb.recordFailure(model.id);
    recordHealthFailure(model, resp.latencyMs, resp.error?.code ?? 'unknown', resp.error?.message ?? '');
    if (!resp.error?.retryable) {
      recordUsage({
        ts: new Date().toISOString(),
        requestId: options.requestId,
        modelId: model.id,
        providerName: model.providerName,
        strategy,
        reason,
        attempts: attempts.length,
        latencyMs: resp.latencyMs,
        success: false,
        errorCode: resp.error?.code,
      });
      return { response: resp, chosen: model, strategy, reason, attempts };
    }
    const backoff = resp.error?.retryAfterMs ?? Math.min(200 * attempts.length, 2000);
    await sleep(backoff);
  }

  // All candidates exhausted.
  const last = attempts[attempts.length - 1];
  logger.warn({ attempts }, 'routing: tüm adaylar başarısız');
  const chosen = candidates[candidates.length - 1];
  recordUsage({
    ts: new Date().toISOString(),
    requestId: options.requestId,
    modelId: chosen.id,
    providerName: chosen.providerName,
    strategy,
    reason,
    attempts: attempts.length,
    latencyMs: 0,
    success: false,
    errorCode: last?.errorCode ?? 'exhausted',
  });
  return {
    response: {
      success: false,
      latencyMs: 0,
      error: {
        code: 'upstream_error',
        message: `Tüm modeller başarısız (${attempts.length} deneme). Son: ${last?.errorCode ?? 'unknown'}`,
        retryable: false,
      },
    },
    chosen,
    strategy,
    reason,
    attempts,
  };
}

export function routeStream(
  req: RouteRequest,
  messages: ChatMessage[],
  options: CompletionOptions,
): StreamRouteResult {
  // Streaming: no mid-stream fallback. Pick the first non-open candidate.
  const strategy = req.strategy ?? 'auto';
  const { candidates, reason } = selectCandidates(req);
  const cb = getCircuitBreakers();
  const attempts: Attempt[] = [];

  const chosen = candidates.find((m) => !cb.isOpen(m.id));
  if (!chosen) {
    throw new Error('Streaming için uygun model bulunamadı (tüm devreler açık veya registry boş)');
  }
  attempts.push({ modelId: chosen.id, providerName: chosen.providerName, latencyMs: 0, ok: true });
  recordUsage({
    ts: new Date().toISOString(),
    requestId: options.requestId,
    modelId: chosen.id,
    providerName: chosen.providerName,
    strategy,
    reason,
    attempts: attempts.length,
    latencyMs: 0,
    success: true,
    streaming: true,
  });

  const adapter = adapterFor(chosen.providerName);
  const chunks = adapter.stream(chosen.providerModelId, messages, options);
  return { chosen, strategy, reason, attempts, chunks };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
