import type {
  ChainStep,
  InternalMessage,
  InternalResponse,
  Provider,
  ProviderChatCompletionInput,
  ProviderName,
  StreamChunk,
} from "../types/index.js";
import { AllProvidersFailedError } from "../types/index.js";
import { classifyError } from "./error-classifier.js";
import { childLogger } from "../utils/logger.js";
import { recordRoutingEvent } from "../database/schema.js";

export interface FallbackContext {
  requestId: string;
  sessionId: string;
  messages: InternalMessage[];
  stream: boolean;
  temperature?: number;
  max_tokens?: number;
  tools?: unknown[];
}

export interface FallbackAttempt {
  provider: ProviderName;
  model: string;
  error: string;
  errorType: string;
}

export async function executeWithFallback(
  chain: ChainStep[],
  ctx: FallbackContext,
  providers: Map<ProviderName, Provider>
): Promise<InternalResponse> {
  const log = childLogger({
    request_id: ctx.requestId,
    session_id: ctx.sessionId,
  });
  const attempted = new Set<string>();
  const attempts: FallbackAttempt[] = [];
  let previous: ChainStep | null = null;

  for (let i = 0; i < chain.length; i++) {
    const step = chain[i];
    const key = `${step.provider}:${step.model}`;
    if (attempted.has(key)) continue;
    attempted.add(key);

    const provider = providers.get(step.provider);
    if (!provider) {
      attempts.push({
        provider: step.provider,
        model: step.model,
        error: "provider not registered",
        errorType: "NOT_CONFIGURED",
      });
      continue;
    }

    const input: ProviderChatCompletionInput = {
      requestId: ctx.requestId,
      messages: ctx.messages,
      model: step.model,
      stream: false,
      temperature: ctx.temperature,
      max_tokens: ctx.max_tokens,
      tools: ctx.tools,
    };

    const started = Date.now();
    log.info(
      { provider: step.provider, model: step.model, attempt: i + 1 },
      "ROUTING"
    );

    try {
      const result = await provider.chatCompletion(input);
      const latency = Date.now() - started;
      recordRoutingEvent({
        sessionId: ctx.sessionId,
        requestId: ctx.requestId,
        fromProvider: previous?.provider ?? null,
        fromModel: previous?.model ?? null,
        toProvider: step.provider,
        toModel: step.model,
        reason: previous ? "fallback" : "initial",
        success: true,
        latencyMs: latency,
      });
      log.info(
        { provider: step.provider, model: step.model, latency_ms: latency },
        "SUCCESS"
      );
      return {
        requestId: ctx.requestId,
        sessionId: ctx.sessionId,
        provider: result.provider,
        model: result.model,
        content: result.content,
        finishReason: result.finishReason,
        usage: result.usage,
        fallbackCount: attempts.length,
        latencyMs: latency,
      };
    } catch (err) {
      const classified = classifyError(err);
      const latency = Date.now() - started;
      recordRoutingEvent({
        sessionId: ctx.sessionId,
        requestId: ctx.requestId,
        fromProvider: previous?.provider ?? null,
        fromModel: previous?.model ?? null,
        toProvider: step.provider,
        toModel: step.model,
        reason: classified.type,
        success: false,
        latencyMs: latency,
      });
      log.warn(
        {
          provider: step.provider,
          model: step.model,
          error_type: classified.type,
          fallbackable: classified.fallbackable,
          status: classified.statusCode,
        },
        "FAILURE"
      );
      attempts.push({
        provider: step.provider,
        model: step.model,
        error: classified.originalMessage,
        errorType: classified.type,
      });
      previous = step;

      if (!classified.fallbackable) {
        log.error({ error_type: classified.type }, "FATAL — not fallbackable");
        throw err;
      }

      if (i < chain.length - 1) {
        log.info(
          { next_provider: chain[i + 1].provider, next_model: chain[i + 1].model },
          "FALLBACK"
        );
      }
    }
  }

  log.error({ attempts }, "All providers exhausted");
  throw new AllProvidersFailedError(attempts);
}

export interface StreamAttemptResult {
  step: ChainStep;
  iterable: AsyncIterable<StreamChunk>;
  attempts: FallbackAttempt[];
}

/**
 * Pre-first-chunk fallback for streaming. We invoke the provider's stream
 * generator and pull the first chunk. If it throws before the first chunk,
 * we advance to the next provider. Once the first chunk is yielded, that
 * provider is committed for the remainder of the stream.
 */
export async function attemptStreamWithFallback(
  chain: ChainStep[],
  ctx: FallbackContext,
  providers: Map<ProviderName, Provider>
): Promise<StreamAttemptResult> {
  const log = childLogger({
    request_id: ctx.requestId,
    session_id: ctx.sessionId,
  });
  const attempted = new Set<string>();
  const attempts: FallbackAttempt[] = [];
  let previous: ChainStep | null = null;

  for (const step of chain) {
    const key = `${step.provider}:${step.model}`;
    if (attempted.has(key)) continue;
    attempted.add(key);

    const provider = providers.get(step.provider);
    if (!provider) continue;

    const input: ProviderChatCompletionInput = {
      requestId: ctx.requestId,
      messages: ctx.messages,
      model: step.model,
      stream: true,
      temperature: ctx.temperature,
      max_tokens: ctx.max_tokens,
      tools: ctx.tools,
    };

    log.info(
      { provider: step.provider, model: step.model },
      "STREAM ROUTING"
    );
    const started = Date.now();

    try {
      const iterator = provider.streamChatCompletion(input)[Symbol.asyncIterator]();
      const first = await iterator.next();
      const latency = Date.now() - started;
      recordRoutingEvent({
        sessionId: ctx.sessionId,
        requestId: ctx.requestId,
        fromProvider: previous?.provider ?? null,
        fromModel: previous?.model ?? null,
        toProvider: step.provider,
        toModel: step.model,
        reason: previous ? "fallback" : "initial",
        success: true,
        latencyMs: latency,
      });
      const combined: AsyncIterable<StreamChunk> = {
        [Symbol.asyncIterator]() {
          let emittedFirst = false;
          return {
            async next(): Promise<IteratorResult<StreamChunk>> {
              if (!emittedFirst) {
                emittedFirst = true;
                return first;
              }
              return iterator.next();
            },
            async return(value?: unknown): Promise<IteratorResult<StreamChunk>> {
              if (iterator.return) return iterator.return(value);
              return { done: true, value: undefined as unknown as StreamChunk };
            },
          };
        },
      };
      return { step, iterable: combined, attempts };
    } catch (err) {
      const classified = classifyError(err);
      const latency = Date.now() - started;
      recordRoutingEvent({
        sessionId: ctx.sessionId,
        requestId: ctx.requestId,
        fromProvider: previous?.provider ?? null,
        fromModel: previous?.model ?? null,
        toProvider: step.provider,
        toModel: step.model,
        reason: classified.type,
        success: false,
        latencyMs: latency,
      });
      log.warn(
        { provider: step.provider, error_type: classified.type },
        "STREAM FAILURE (pre-first-chunk)"
      );
      attempts.push({
        provider: step.provider,
        model: step.model,
        error: classified.originalMessage,
        errorType: classified.type,
      });
      previous = step;
      if (!classified.fallbackable) throw err;
    }
  }

  throw new AllProvidersFailedError(attempts);
}
