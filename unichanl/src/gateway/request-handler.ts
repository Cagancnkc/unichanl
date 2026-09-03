import type { FastifyReply, FastifyRequest } from "fastify";
import { nanoid } from "nanoid";
import { z } from "zod";
import type {
  InternalMessage,
  Provider,
  ProviderName,
} from "../types/index.js";
import {
  AllProvidersFailedError,
  NoProvidersAvailableError,
} from "../types/index.js";
import { loadConfig } from "../config/config-manager.js";
import { buildProviderChain } from "../router/router.js";
import {
  attemptStreamWithFallback,
  executeWithFallback,
} from "../fallback/fallback-engine.js";
import {
  appendAssistantMessage,
  appendUserMessage,
  getOrCreateSession,
} from "../session/session-manager.js";
import { buildContext } from "../session/context-builder.js";
import {
  toOpenAIJson,
  writeStreamHeaders,
  writeStreamChunk,
  writeStreamDone,
  writeStreamError,
} from "./response-handler.js";
import { childLogger } from "../utils/logger.js";

const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant", "tool"]),
  content: z.string(),
  name: z.string().optional(),
  tool_call_id: z.string().optional(),
});

const ChatCompletionSchema = z.object({
  model: z.string().min(1),
  messages: z.array(MessageSchema).min(1),
  stream: z.boolean().optional().default(false),
  temperature: z.number().optional(),
  max_tokens: z.number().int().positive().optional(),
  tools: z.array(z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function handleChatCompletion(
  req: FastifyRequest,
  reply: FastifyReply,
  providers: Map<ProviderName, Provider>
): Promise<void> {
  const requestId = `req_${nanoid(12)}`;
  const parseResult = ChatCompletionSchema.safeParse(req.body);
  if (!parseResult.success) {
    reply.code(400).send({
      error: {
        message: "Invalid request body",
        type: "invalid_request_error",
        code: "BAD_REQUEST",
        details: parseResult.error.flatten(),
      },
    });
    return;
  }
  const body = parseResult.data;

  const explicitSessionId =
    (req.headers["x-session-id"] as string | undefined) ??
    (body.metadata?.session_id as string | undefined);
  const session = getOrCreateSession(explicitSessionId ?? null);
  const log = childLogger({ request_id: requestId, session_id: session.id });
  log.info(
    { model: body.model, stream: body.stream, msg_count: body.messages.length },
    "REQUEST RECEIVED"
  );

  const messages: InternalMessage[] = body.messages.map((m) => ({
    role: m.role,
    content: m.content,
    name: m.name,
    tool_call_id: m.tool_call_id,
  }));

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (lastUser) appendUserMessage(session.id, lastUser.content);

  const fullContext = buildContext(session.id, messages);

  const config = loadConfig();
  let chain;
  try {
    chain = buildProviderChain(body.model, config, providers);
  } catch (err) {
    if (err instanceof NoProvidersAvailableError) {
      reply.code(503).send({
        error: {
          message: err.message,
          type: "gateway_error",
          code: "NO_PROVIDERS_AVAILABLE",
        },
      });
      return;
    }
    reply.code(400).send({
      error: {
        message: (err as Error).message,
        type: "invalid_request_error",
        code: "UNKNOWN_MODEL",
      },
    });
    return;
  }

  const ctx = {
    requestId,
    sessionId: session.id,
    messages: fullContext,
    stream: body.stream,
    temperature: body.temperature,
    max_tokens: body.max_tokens,
    tools: body.tools,
  };

  if (body.stream) {
    await handleStreaming(reply, ctx, chain, providers, body.model);
    return;
  }

  try {
    const result = await executeWithFallback(chain, ctx, providers);
    appendAssistantMessage(
      session.id,
      result.content,
      result.provider,
      result.model
    );
    reply
      .header("X-Unichanl-Request-Id", requestId)
      .header("X-Unichanl-Session-Id", session.id)
      .header("X-Unichanl-Provider", result.provider)
      .header("X-Unichanl-Model", result.model)
      .header("X-Unichanl-Fallback-Count", String(result.fallbackCount))
      .send(toOpenAIJson(result, body.model));
  } catch (err) {
    handleTerminalError(reply, requestId, err);
  }
}

async function handleStreaming(
  reply: FastifyReply,
  ctx: {
    requestId: string;
    sessionId: string;
    messages: InternalMessage[];
    stream: boolean;
    temperature?: number;
    max_tokens?: number;
    tools?: unknown[];
  },
  chain: ReturnType<typeof buildProviderChain>,
  providers: Map<ProviderName, Provider>,
  requestedModel: string
): Promise<void> {
  const log = childLogger({
    request_id: ctx.requestId,
    session_id: ctx.sessionId,
  });
  try {
    const { step, iterable } = await attemptStreamWithFallback(
      chain,
      ctx,
      providers
    );
    writeStreamHeaders(reply, {
      requestId: ctx.requestId,
      sessionId: ctx.sessionId,
      provider: step.provider,
      model: step.model,
    });

    const assembled: string[] = [];
    try {
      for await (const chunk of iterable) {
        if (chunk.delta) assembled.push(chunk.delta);
        writeStreamChunk(reply, {
          requestedModel,
          providerModel: step.model,
          delta: chunk.delta,
          finishReason: chunk.finishReason,
        });
      }
      writeStreamDone(reply);
      appendAssistantMessage(
        ctx.sessionId,
        assembled.join(""),
        step.provider,
        step.model
      );
    } catch (err) {
      log.error(
        { err, provider: step.provider },
        "STREAM INTERRUPTED after first chunk"
      );
      writeStreamError(reply, {
        code: "STREAM_INTERRUPTED",
        provider: step.provider,
        message: (err as Error).message,
      });
      writeStreamDone(reply);
      if (assembled.length > 0) {
        appendAssistantMessage(
          ctx.sessionId,
          assembled.join(""),
          step.provider,
          step.model
        );
      }
    } finally {
      reply.raw.end();
    }
  } catch (err) {
    handleTerminalError(reply, ctx.requestId, err);
  }
}

function handleTerminalError(
  reply: FastifyReply,
  requestId: string,
  err: unknown
): void {
  if (err instanceof AllProvidersFailedError) {
    reply.code(502).send({
      error: {
        message: err.message,
        type: "gateway_error",
        code: "ALL_PROVIDERS_FAILED",
        request_id: requestId,
        attempts: err.attempts,
      },
    });
    return;
  }
  const statusCode = (err as { statusCode?: number }).statusCode ?? 500;
  reply.code(statusCode).send({
    error: {
      message: (err as Error).message ?? "Internal error",
      type: "gateway_error",
      code: "INTERNAL_ERROR",
      request_id: requestId,
    },
  });
}
