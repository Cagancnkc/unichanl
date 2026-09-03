import argon2 from 'argon2';
import type { FastifyRequest } from 'fastify';
import { apiKeyRepository } from '../../db/repositories/apiKeyRepository.js';
import type { AuthenticatedUser } from '../../types/index.js';

export interface CloudAuthResult {
  ok: boolean;
  status?: number;
  message?: string;
  user?: AuthenticatedUser;
}

function extractKey(request: FastifyRequest): string | undefined {
  const h = request.headers;
  const fromXKey = h['x-api-key'];
  if (typeof fromXKey === 'string' && fromXKey.length > 0) return fromXKey;
  const auth = h.authorization;
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return undefined;
}

export async function checkCloudAuth(request: FastifyRequest): Promise<CloudAuthResult> {
  const provided = extractKey(request);
  if (!provided) return { ok: false, status: 401, message: 'Missing x-api-key or Authorization header.' };
  if (provided.length < 8) return { ok: false, status: 401, message: 'Invalid API key format.' };

  const prefix = provided.slice(0, 8);
  const candidates = await apiKeyRepository.findByPrefix(prefix);
  if (candidates.length === 0) return { ok: false, status: 401, message: 'Invalid API key.' };

  for (const record of candidates) {
    if (record.expiresAt && record.expiresAt.getTime() < Date.now()) continue;
    let matches = false;
    try {
      matches = await argon2.verify(record.keyHash, provided);
    } catch {
      matches = false;
    }
    if (!matches) continue;

    apiKeyRepository.updateLastUsed(record.id).catch(() => undefined);

    return {
      ok: true,
      user: {
        id: record.user.id,
        apiKeyId: record.id,
        email: record.user.email,
        plan: record.user.plan,
        tier: record.user.tier,
        rateLimit: record.rateLimit,
      },
    };
  }

  return { ok: false, status: 401, message: 'Invalid API key.' };
}
