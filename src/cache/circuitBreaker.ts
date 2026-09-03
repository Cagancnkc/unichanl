import type { Redis } from 'ioredis';
import { redis, KEYS } from './redis.js';

const FAILURE_THRESHOLD = 5;
const RECOVERY_TIMEOUT_MS = 30_000;

interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureAt: number | null;
  nextRetryAt: number | null;
}

class CircuitBreaker {
  constructor(
    private readonly redisClient: Redis,
    private readonly modelId: string,
  ) {}

  private key() {
    return KEYS.circuitBreaker(this.modelId);
  }

  async getState(): Promise<CircuitBreakerState> {
    const raw = await this.redisClient.hgetall(this.key());
    if (!raw.state) {
      return { state: 'closed', failureCount: 0, lastFailureAt: null, nextRetryAt: null };
    }
    return {
      state: raw.state as CircuitBreakerState['state'],
      failureCount: parseInt(raw.failureCount ?? '0'),
      lastFailureAt: raw.lastFailureAt ? parseInt(raw.lastFailureAt) : null,
      nextRetryAt: raw.nextRetryAt ? parseInt(raw.nextRetryAt) : null,
    };
  }

  async isOpen(): Promise<boolean> {
    const state = await this.getState();
    if (state.state === 'closed') return false;
    if (state.state === 'open') {
      const now = Date.now();
      if (state.nextRetryAt && now >= state.nextRetryAt) {
        await this.transitionTo('half-open');
        return false;
      }
      return true;
    }
    return false;
  }

  async recordSuccess(): Promise<void> {
    const state = await this.getState();
    if (state.state === 'half-open' || state.state === 'open') {
      await this.transitionTo('closed');
    } else {
      await this.redisClient.hset(this.key(), 'failureCount', '0');
    }
  }

  async recordFailure(): Promise<void> {
    const newCount = await this.redisClient.hincrby(this.key(), 'failureCount', 1);
    await this.redisClient.hset(this.key(), 'lastFailureAt', Date.now().toString());
    if (newCount >= FAILURE_THRESHOLD) {
      await this.transitionTo('open');
    }
    await this.redisClient.expire(this.key(), 300);
  }

  private async transitionTo(state: CircuitBreakerState['state']): Promise<void> {
    const updates: Record<string, string> = { state };
    if (state === 'open') {
      updates.nextRetryAt = (Date.now() + RECOVERY_TIMEOUT_MS).toString();
    } else if (state === 'closed') {
      updates.failureCount = '0';
      updates.nextRetryAt = '';
    }
    await this.redisClient.hset(this.key(), updates);
  }
}

export function getCircuitBreaker(modelId: string): CircuitBreaker {
  return new CircuitBreaker(redis, modelId);
}
