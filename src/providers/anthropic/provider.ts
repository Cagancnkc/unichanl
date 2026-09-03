import Anthropic from '@anthropic-ai/sdk';
import { loadConfig } from '../../config/config-manager.js';
import { logger } from '../../utils/logger.js';
import {
  type AvailabilityResult,
  type ChatCompletionChunk,
  type ChatCompletionRequest,
  type ChatCompletionResponse,
  type Provider,
  type ProviderCallOptions,
  ProviderError,
} from '../provider.interface.js';
import { normalizeAnthropicError } from './errors.js';
import {
  anthropicResponseToOpenAI,
  anthropicStreamToOpenAI,
  openAIRequestToAnthropic,
} from './translate.js';

const CLIENT_FACING_MODEL_ALIAS = 'unichanl-auto';

export interface AnthropicProviderOptions {
  clientFactory?: (apiKey: string) => Anthropic;
}

export class AnthropicProvider implements Provider {
  public readonly name = 'anthropic';
  private client: Anthropic | null = null;

  constructor(private readonly opts: AnthropicProviderOptions = {}) {}

  private getConfig(): { enabled: boolean; model: string; timeoutMs: number } {
    const cfg = loadConfig();
    return cfg.providers.anthropic;
  }

  private resolveUpstreamModel(requested: string): string {
    if (!requested || requested === CLIENT_FACING_MODEL_ALIAS) return this.getConfig().model;
    if (requested.startsWith('claude-')) return requested;
    return this.getConfig().model;
  }

  private getClient(): Anthropic {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new ProviderError(
        401,
        'ANTHROPIC_AUTH_ERROR',
        'ANTHROPIC_API_KEY is not configured',
      );
    }
    if (this.client) return this.client;
    const factory = this.opts.clientFactory ?? ((k: string) => new Anthropic({ apiKey: k }));
    this.client = factory(key);
    return this.client;
  }

  async isAvailable(): Promise<AvailabilityResult> {
    const cfg = this.getConfig();
    if (!cfg.enabled) return { ok: false, reason: 'provider disabled in config' };
    if (!process.env.ANTHROPIC_API_KEY) return { ok: false, reason: 'ANTHROPIC_API_KEY missing' };
    if (!cfg.model) return { ok: false, reason: 'no model configured' };
    return { ok: true };
  }

  private buildTimeoutSignal(externalSignal: AbortSignal, timeoutMs: number): {
    signal: AbortSignal;
    cleanup: () => void;
    isTimeout: () => boolean;
  } {
    const controller = new AbortController();
    let timedOut = false;
    const t = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    const onExternalAbort = () => controller.abort();
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    return {
      signal: controller.signal,
      cleanup: () => {
        clearTimeout(t);
        externalSignal.removeEventListener('abort', onExternalAbort);
      },
      isTimeout: () => timedOut,
    };
  }

  async chatCompletion(
    req: ChatCompletionRequest,
    opts: ProviderCallOptions,
  ): Promise<ChatCompletionResponse> {
    const cfg = this.getConfig();
    const upstreamModel = this.resolveUpstreamModel(req.model);
    const params = openAIRequestToAnthropic(req, upstreamModel);
    const clientFacingModel = req.model || CLIENT_FACING_MODEL_ALIAS;
    const client = this.getClient();

    const { signal, cleanup, isTimeout } = this.buildTimeoutSignal(opts.signal, cfg.timeoutMs);
    const started = Date.now();
    logger.info(
      { requestId: opts.requestId, provider: 'anthropic', upstreamModel },
      'anthropic request started',
    );

    try {
      const res = await client.messages.create(params as Anthropic.MessageCreateParamsNonStreaming, {
        signal,
      });
      logger.info(
        {
          requestId: opts.requestId,
          provider: 'anthropic',
          upstreamModel,
          latencyMs: Date.now() - started,
          promptTokens: res.usage?.input_tokens,
          completionTokens: res.usage?.output_tokens,
          finishReason: res.stop_reason,
        },
        'anthropic request completed',
      );
      return anthropicResponseToOpenAI(res, clientFacingModel);
    } catch (err) {
      if (isTimeout()) {
        logger.warn({ requestId: opts.requestId, provider: 'anthropic' }, 'anthropic request timeout');
        throw new ProviderError(504, 'ANTHROPIC_TIMEOUT', 'Anthropic request timed out');
      }
      const perr = normalizeAnthropicError(err);
      logger.warn(
        {
          requestId: opts.requestId,
          provider: 'anthropic',
          code: perr.code,
          status: perr.status,
        },
        'anthropic request failed',
      );
      throw perr;
    } finally {
      cleanup();
    }
  }

  async *streamChatCompletion(
    req: ChatCompletionRequest,
    opts: ProviderCallOptions,
  ): AsyncIterable<ChatCompletionChunk> {
    const cfg = this.getConfig();
    const upstreamModel = this.resolveUpstreamModel(req.model);
    const params = openAIRequestToAnthropic(req, upstreamModel);
    const clientFacingModel = req.model || CLIENT_FACING_MODEL_ALIAS;
    const client = this.getClient();

    const { signal, cleanup, isTimeout } = this.buildTimeoutSignal(opts.signal, cfg.timeoutMs);
    const started = Date.now();
    logger.info(
      { requestId: opts.requestId, provider: 'anthropic', upstreamModel, stream: true },
      'anthropic stream started',
    );

    let stream: Awaited<ReturnType<typeof client.messages.create>> | null = null;
    try {
      stream = await client.messages.create(
        { ...(params as Anthropic.MessageCreateParamsStreaming), stream: true },
        { signal },
      );
    } catch (err) {
      cleanup();
      if (isTimeout()) throw new ProviderError(504, 'ANTHROPIC_TIMEOUT', 'Anthropic request timed out');
      throw normalizeAnthropicError(err);
    }

    try {
      // stream is a Stream<RawMessageStreamEvent> — async iterable
      for await (const chunk of anthropicStreamToOpenAI(
        stream as AsyncIterable<Anthropic.MessageStreamEvent>,
        clientFacingModel,
      )) {
        yield chunk;
      }
      logger.info(
        {
          requestId: opts.requestId,
          provider: 'anthropic',
          upstreamModel,
          latencyMs: Date.now() - started,
        },
        'anthropic stream completed',
      );
    } catch (err) {
      if (isTimeout()) throw new ProviderError(504, 'ANTHROPIC_TIMEOUT', 'Anthropic stream timed out');
      throw normalizeAnthropicError(err);
    } finally {
      cleanup();
    }
  }
}

let singleton: AnthropicProvider | null = null;
export function getAnthropicProvider(): AnthropicProvider {
  if (!singleton) singleton = new AnthropicProvider();
  return singleton;
}

export function __setAnthropicProviderForTests(p: AnthropicProvider | null): void {
  singleton = p;
}
