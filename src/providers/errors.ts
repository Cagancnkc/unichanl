import type { ProviderName } from '../registry/model.types.js';

export type ErrorCategory =
  | 'AUTH'
  | 'INVALID_REQUEST'
  | 'RATE_LIMIT'
  | 'QUOTA'
  | 'TIMEOUT'
  | 'NETWORK'
  | 'PROVIDER_SERVER_ERROR'
  | 'PROVIDER_UNAVAILABLE'
  | 'CANCELLED'
  | 'UNKNOWN';

export class CategorizedProviderError extends Error {
  constructor(
    public readonly category: ErrorCategory,
    public readonly providerName: ProviderName | string,
    public readonly status: number | undefined,
    message: string,
    public readonly retryAfterSec?: number,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'CategorizedProviderError';
  }
}

interface ClassifyInput {
  status?: number;
  code?: string;
  name?: string;
  message?: string;
  retryAfterSec?: number;
}

export function classifyError(
  err: unknown,
  providerName: ProviderName | string,
): CategorizedProviderError {
  if (err instanceof CategorizedProviderError) return err;

  const e = normalize(err);
  const category = deriveCategory(e);
  return new CategorizedProviderError(
    category,
    providerName,
    e.status,
    e.message ?? category,
    e.retryAfterSec,
    err,
  );
}

function normalize(err: unknown): ClassifyInput {
  if (err && typeof err === 'object') {
    const anyErr = err as Record<string, unknown>;
    return {
      status: typeof anyErr.status === 'number' ? anyErr.status : undefined,
      code: typeof anyErr.code === 'string' ? anyErr.code : undefined,
      name: typeof anyErr.name === 'string' ? anyErr.name : undefined,
      message: typeof anyErr.message === 'string' ? anyErr.message : undefined,
      retryAfterSec:
        typeof anyErr.retryAfterSec === 'number' ? anyErr.retryAfterSec : undefined,
    };
  }
  return { message: String(err) };
}

function deriveCategory(e: ClassifyInput): ErrorCategory {
  if (e.name === 'AbortError' || e.code === 'ABORT_ERR') return 'CANCELLED';
  if (e.name === 'TimeoutError' || e.code === 'UND_ERR_CONNECT_TIMEOUT' || e.code === 'ETIMEDOUT')
    return 'TIMEOUT';

  const networkCodes = new Set([
    'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN',
    'EPIPE', 'UND_ERR_SOCKET', 'UND_ERR_CLOSED',
  ]);
  if (e.code && networkCodes.has(e.code)) return 'NETWORK';

  const status = e.status;
  if (status === undefined) return 'UNKNOWN';
  if (status === 401 || status === 403) return 'AUTH';
  if (status === 400 || status === 404 || status === 422) return 'INVALID_REQUEST';
  if (status === 429) {
    const msg = (e.message ?? '').toLowerCase();
    if (msg.includes('quota') || msg.includes('credit') || msg.includes('billing'))
      return 'QUOTA';
    return 'RATE_LIMIT';
  }
  if (status === 402) return 'QUOTA';
  if (status === 408 || status === 504) return 'TIMEOUT';
  if (status === 503) return 'PROVIDER_UNAVAILABLE';
  if (status >= 500) return 'PROVIDER_SERVER_ERROR';
  return 'UNKNOWN';
}
