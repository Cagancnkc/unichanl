import { Redis } from 'ioredis';
import { logger } from '../utils/logger.js';

export const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  retryStrategy: (times: number) => Math.min(times * 100, 3000),
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
});

redis.on('error', (err: Error) => logger.error({ err }, 'Redis hatası'));
redis.on('ready', () => logger.info('Redis bağlantısı hazır'));
redis.on('reconnecting', () => logger.warn('Redis yeniden bağlanıyor'));

export const KEYS = {
  rateLimit: (keyId: string) => `rl:${keyId}`,
  circuitBreaker: (modelId: string) => `cb:${modelId}`,
  modelCache: () => 'models:all',
  apiKeyCache: (prefix: string) => `ak:${prefix}`,
  sessionCtx: (sessionId: string) => `sess:${sessionId}`,
} as const;
