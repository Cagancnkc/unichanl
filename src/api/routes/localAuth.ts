import type { FastifyRequest } from 'fastify';
import { readLocalApiKey } from '../../integrations/local-api-key.js';

export interface LocalAuthResult {
  ok: boolean;
  status?: number;
  message?: string;
}

export function checkLocalAuth(request: FastifyRequest): LocalAuthResult {
  const expected = readLocalApiKey();
  if (!expected) {
    return {
      ok: false,
      status: 500,
      message: 'Unichanl local API key not initialized. Run `unichanl setup` or `unichanl start` first.',
    };
  }
  const headers = request.headers;
  const provided =
    (headers['x-api-key'] as string | undefined) ??
    (typeof headers.authorization === 'string' && headers.authorization.startsWith('Bearer ')
      ? headers.authorization.slice(7).trim()
      : undefined);
  if (!provided) return { ok: false, status: 401, message: 'Missing x-api-key or Authorization header.' };
  if (provided !== expected) return { ok: false, status: 401, message: 'Invalid Unichanl local API key.' };
  return { ok: true };
}
