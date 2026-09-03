import type { ChatMessage, ModelCandidate, ProviderResponse, RoutingContext } from '../types/index.js';
import type { CompletionOptions } from '../providers/types.js';
import { modelRepository } from '../db/repositories/modelRepository.js';
import { getCircuitBreaker } from '../cache/circuitBreaker.js';
import { redis, KEYS } from '../cache/redis.js';
import { openRouterAdapter } from '../providers/openRouterAdapter.js';
import { NoAvailableModelError, ProviderRequestError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import {
  autoStrategy,
  cheapestStrategy,
  fastestStrategy,
  priorityStrategy,
  capabilityStrategy,
} from './strategies.js';

const MODEL_CACHE_TTL_MS = 30_000;

interface ExecuteResult {
  response: ProviderResponse;
  model: ModelCandidate;
  attempts: string[];
}

class RoutingEngine {
  private inMemoryCache: ModelCandidate[] = [];
  private lastCacheRefresh = 0;

  async selectModel(ctx: RoutingContext): Promise<ModelCandidate> {
    const candidates = await this.getAvailableCandidates();
    const sorted = this.applyStrategy(candidates, ctx);

    for (const model of sorted) {
      const cb = getCircuitBreaker(model.id);
      if (await cb.isOpen()) continue;
      return model;
    }

    throw new NoAvailableModelError();
  }

  async executeWithFallback(
    ctx: RoutingContext,
    messages: ChatMessage[],
    options: CompletionOptions,
  ): Promise<ExecuteResult> {
    const candidates = await this.getAvailableCandidates();
    const sorted = this.applyStrategy(candidates, ctx);
    const attempts: string[] = [];

    for (const model of sorted) {
      const cb = getCircuitBreaker(model.id);

      if (await cb.isOpen()) {
        attempts.push(`${model.id}:circuit_open`);
        continue;
      }

      attempts.push(model.id);

      const response = await openRouterAdapter.complete(model.openrouterModelId, messages, options);

      if (response.success) {
        await cb.recordSuccess();
        setImmediate(() => modelRepository.updateAvgLatency(model.id, response.latencyMs));
        return { response, model, attempts };
      }

      await cb.recordFailure();
      logger.warn(
        { modelId: model.id, errorCode: response.error?.code, requestId: options.requestId },
        'Model başarısız, fallback deneniyor',
      );

      if (!response.error?.retryable) {
        throw new ProviderRequestError(response.error?.message ?? 'Provider hatası', model.provider);
      }

      const backoffMs = response.error.retryAfterMs ?? Math.min(200 * attempts.length, 2000);
      await new Promise((r) => setTimeout(r, backoffMs));
    }

    throw new NoAvailableModelError();
  }

  private async getAvailableCandidates(): Promise<ModelCandidate[]> {
    const now = Date.now();
    if (this.inMemoryCache.length && now - this.lastCacheRefresh < MODEL_CACHE_TTL_MS) {
      return this.inMemoryCache;
    }

    const cached = await redis.get(KEYS.modelCache());
    if (cached) {
      this.inMemoryCache = JSON.parse(cached) as ModelCandidate[];
      this.lastCacheRefresh = now;
      return this.inMemoryCache;
    }

    const models = await modelRepository.findAll(true);
    this.inMemoryCache = models;
    this.lastCacheRefresh = now;
    await redis.setex(KEYS.modelCache(), 30, JSON.stringify(models));
    return models;
  }

  invalidateCache() {
    this.inMemoryCache = [];
    this.lastCacheRefresh = 0;
    redis.del(KEYS.modelCache()).catch(() => null);
  }

  private applyStrategy(candidates: ModelCandidate[], ctx: RoutingContext): ModelCandidate[] {
    const healthy = candidates.filter((m) => m.healthStatus !== 'down');

    switch (ctx.strategy) {
      case 'cheapest':
        return cheapestStrategy(healthy);
      case 'fastest':
        return fastestStrategy(healthy);
      case 'priority':
        return priorityStrategy(healthy);
      case 'capability':
        return capabilityStrategy(healthy, ctx.capabilities ?? []);
      case 'auto':
      default:
        return autoStrategy(healthy, ctx.capabilities);
    }
  }
}

export const routingEngine = new RoutingEngine();
