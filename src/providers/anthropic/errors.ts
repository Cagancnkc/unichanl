import Anthropic from '@anthropic-ai/sdk';
import { ProviderError } from '../provider.interface.js';

export function normalizeAnthropicError(err: unknown): ProviderError {
  if (err instanceof ProviderError) return err;

  if (err instanceof Anthropic.APIUserAbortError) {
    return new ProviderError(499, 'ANTHROPIC_ABORTED', 'Request aborted');
  }
  if (err instanceof Anthropic.APIConnectionTimeoutError) {
    return new ProviderError(504, 'ANTHROPIC_TIMEOUT', 'Anthropic request timed out');
  }
  if (err instanceof Anthropic.AuthenticationError) {
    return new ProviderError(401, 'ANTHROPIC_AUTH_ERROR', 'Anthropic authentication failed');
  }
  if (err instanceof Anthropic.BadRequestError) {
    return new ProviderError(400, 'ANTHROPIC_INVALID_REQUEST', safeMsg(err, 'Invalid request'));
  }
  if (err instanceof Anthropic.PermissionDeniedError) {
    return new ProviderError(403, 'ANTHROPIC_PERMISSION_DENIED', 'Permission denied');
  }
  if (err instanceof Anthropic.NotFoundError) {
    return new ProviderError(404, 'ANTHROPIC_NOT_FOUND', safeMsg(err, 'Resource not found'));
  }
  if (err instanceof Anthropic.RateLimitError) {
    return new ProviderError(429, 'ANTHROPIC_RATE_LIMIT', 'Anthropic rate limit exceeded');
  }
  if (err instanceof Anthropic.InternalServerError) {
    return new ProviderError(502, 'ANTHROPIC_SERVER_ERROR', 'Anthropic server error');
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return new ProviderError(502, 'ANTHROPIC_NETWORK_ERROR', 'Failed to reach Anthropic');
  }
  if (err instanceof Anthropic.APIError) {
    const status = typeof err.status === 'number' ? err.status : 502;
    return new ProviderError(status, 'ANTHROPIC_API_ERROR', safeMsg(err, 'Anthropic API error'));
  }

  if (err instanceof Error && err.name === 'AbortError') {
    return new ProviderError(499, 'ANTHROPIC_ABORTED', 'Request aborted');
  }

  return new ProviderError(502, 'ANTHROPIC_UNKNOWN', 'Unknown provider error');
}

function safeMsg(err: Error, fallback: string): string {
  // Never surface headers, url, or the API key. Just the model-safe message.
  const msg = err.message ?? fallback;
  return typeof msg === 'string' && msg.length > 0 ? msg.slice(0, 500) : fallback;
}
