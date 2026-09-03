import type { ChatMessage, ChatCompletionResponse, ProviderResponse, StreamChunk } from '../types/index.js';
import type { InferenceProvider, CompletionOptions } from './types.js';
import { logger } from '../utils/logger.js';

const NVIDIA_BASE = process.env.NVIDIA_API_BASE ?? 'https://integrate.api.nvidia.com/v1';
const DEFAULT_TIMEOUT_MS = 30_000;

function buildHeaders(requestId: string): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Request-ID': requestId,
  };
}

class NvidiaAdapter implements InferenceProvider {
  name = 'nvidia';

  async complete(
    model: string,
    messages: ChatMessage[],
    options: CompletionOptions,
  ): Promise<ProviderResponse> {
    const startTime = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(`${NVIDIA_BASE}/chat/completions`, {
        method: 'POST',
        headers: buildHeaders(options.requestId),
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          temperature: options.temperature,
          max_tokens: options.max_tokens,
          top_p: options.top_p,
          stop: options.stop,
        }),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startTime;
      if (!response.ok) return this.handleErrorResponse(response, latencyMs);

      const data = (await response.json()) as ChatCompletionResponse;
      return { success: true, data, latencyMs, tokensUsed: data.usage };
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      if ((err as Error).name === 'AbortError') {
        return {
          success: false,
          latencyMs,
          error: { code: 'timeout', message: 'NVIDIA isteği zaman aşımına uğradı', retryable: true, retryAfterMs: 1000 },
        };
      }
      logger.error({ err, model, requestId: options.requestId }, 'NVIDIA fetch hatası');
      return {
        success: false,
        latencyMs,
        error: { code: 'upstream_error', message: (err as Error).message, retryable: true },
      };
    } finally {
      clearTimeout(timer);
    }
  }

  async *stream(
    model: string,
    messages: ChatMessage[],
    options: CompletionOptions,
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(`${NVIDIA_BASE}/chat/completions`, {
        method: 'POST',
        headers: buildHeaders(options.requestId),
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          temperature: options.temperature,
          max_tokens: options.max_tokens,
          top_p: options.top_p,
          stop: options.stop,
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const body = await response.text().catch(() => '');
        throw new Error(`NVIDIA ${response.status}: ${body}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') return;
          try {
            yield JSON.parse(data) as StreamChunk;
          } catch {
            // SSE satırı ayrıştırılamadı
          }
        }
      }
    } finally {
      clearTimeout(timer);
    }
  }

  private async handleErrorResponse(response: Response, latencyMs: number): Promise<ProviderResponse> {
    let body: { error?: { message?: string } } = {};
    try {
      body = (await response.json()) as { error?: { message?: string } };
    } catch {
      // yoksay
    }

    type ErrorCode = 'rate_limited' | 'model_unavailable' | 'context_too_long' | 'upstream_error' | 'timeout';
    const codeMap: Record<number, ErrorCode> = {
      429: 'rate_limited',
      503: 'model_unavailable',
      400: 'context_too_long',
    };

    const retryAfterHeader = response.headers.get('retry-after');

    return {
      success: false,
      latencyMs,
      error: {
        code: codeMap[response.status] ?? 'upstream_error',
        message: body.error?.message ?? `HTTP ${response.status}`,
        retryable: [429, 503, 500, 502].includes(response.status),
        retryAfterMs: retryAfterHeader ? parseInt(retryAfterHeader) * 1000 : undefined,
      },
    };
  }
}

export const nvidiaAdapter = new NvidiaAdapter();
