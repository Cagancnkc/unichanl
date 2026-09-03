import { redis, KEYS } from './redis.js';

export async function checkRateLimit(
  apiKeyId: string,
  limitPerMinute: number,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const key = KEYS.rateLimit(apiKeyId);
  const now = Date.now();
  const windowStart = now - 60_000;

  const pipe = redis.pipeline();
  pipe.zremrangebyscore(key, '-inf', windowStart);
  pipe.zadd(key, now, `${now}-${Math.random()}`);
  pipe.zcard(key);
  pipe.expire(key, 61);

  const results = await pipe.exec();
  const count = (results?.[2]?.[1] as number) ?? 0;

  return {
    allowed: count <= limitPerMinute,
    remaining: Math.max(0, limitPerMinute - count),
    resetAt: now + 60_000,
  };
}
