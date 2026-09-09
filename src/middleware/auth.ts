import argon2 from 'argon2';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { apiKeyRepository } from '../db/repositories/apiKeyRepository.js';
import { checkRateLimit } from '../cache/rateLimiter.js';
import { AppError, AuthError, RateLimitError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError('Authorization başlığı eksik. Bearer token gerekli.');
  }

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith('tkg_') || rawKey.length < 32) {
    throw new AuthError('Geçersiz API anahtarı formatı.');
  }

  const prefix = rawKey.slice(0, 8);

  let candidates: Awaited<ReturnType<typeof apiKeyRepository.findByPrefix>>;
  try {
    candidates = await apiKeyRepository.findByPrefix(prefix);
  } catch (err) {
    logger.error(
      { err, requestId: request.id, method: request.method, url: request.url },
      'authMiddleware: apiKey lookup failed',
    );
    throw new AppError(
      503,
      'AUTH_UNAVAILABLE',
      'Kimlik doğrulama servisi geçici olarak kullanılamıyor',
    );
  }

  let validKey: (typeof candidates)[0] | null = null;
  for (const candidate of candidates) {
    let matches = false;
    try {
      matches = await argon2.verify(candidate.keyHash, rawKey);
    } catch (err) {
      logger.warn(
        { err, requestId: request.id, candidateId: candidate.id },
        'argon2.verify threw for candidate — treating as no match',
      );
      continue;
    }
    if (matches && candidate.enabled) {
      validKey = candidate;
      break;
    }
  }

  if (!validKey) {
    throw new AuthError('Geçersiz veya devre dışı API anahtarı.');
  }

  if (!validKey.user) {
    logger.error(
      { requestId: request.id, apiKeyId: validKey.id, userId: validKey.userId },
      'API key has no linked user (broken FK)',
    );
    throw new AuthError('API anahtarı geçersiz kullanıcıya bağlı.');
  }

  if (validKey.expiresAt && validKey.expiresAt < new Date()) {
    throw new AuthError('API anahtarının süresi dolmuş.');
  }

  const { allowed, remaining, resetAt } = await checkRateLimit(validKey.id, validKey.rateLimit);

  reply.header('X-RateLimit-Limit', validKey.rateLimit);
  reply.header('X-RateLimit-Remaining', remaining);
  reply.header('X-RateLimit-Reset', resetAt);

  if (!allowed) {
    throw new RateLimitError(resetAt - Date.now());
  }

  request.user = {
    id: validKey.userId,
    apiKeyId: validKey.id,
    email: validKey.user.email,
    plan: validKey.user.plan,
    tier: validKey.user.tier,
    rateLimit: validKey.rateLimit,
  };

  setImmediate(() => apiKeyRepository.updateLastUsed(validKey!.id));
}
