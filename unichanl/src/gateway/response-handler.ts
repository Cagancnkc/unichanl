import type { FastifyReply } from "fastify";
import { nanoid } from "nanoid";
import type { InternalResponse } from "../types/index.js";

export function toOpenAIJson(
  result: InternalResponse,
  requestedModel: string
): unknown {
  return {
    id: `chatcmpl-${nanoid(16)}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: requestedModel,
    system_fingerprint: `unichanl:${result.provider}:${result.model}`,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: result.content },
        finish_reason: result.finishReason,
      },
    ],
    usage: {
      prompt_tokens: result.usage?.promptTokens ?? 0,
      completion_tokens: result.usage?.completionTokens ?? 0,
      total_tokens:
        (result.usage?.promptTokens ?? 0) +
        (result.usage?.completionTokens ?? 0),
    },
    unichanl: {
      request_id: result.requestId,
      session_id: result.sessionId,
      provider: result.provider,
      upstream_model: result.model,
      fallback_count: result.fallbackCount,
      latency_ms: result.latencyMs,
    },
  };
}

export interface StreamHeaders {
  requestId: string;
  sessionId: string;
  provider: string;
  model: string;
}

export function writeStreamHeaders(
  reply: FastifyReply,
  h: StreamHeaders
): void {
  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Unichanl-Request-Id": h.requestId,
    "X-Unichanl-Session-Id": h.sessionId,
    "X-Unichanl-Provider": h.provider,
    "X-Unichanl-Model": h.model,
  });
}

export interface StreamChunkFrame {
  requestedModel: string;
  providerModel: string;
  delta: string;
  finishReason?: string;
}

const streamIds = new WeakMap<FastifyReply, string>();

function getStreamId(reply: FastifyReply): string {
  let id = streamIds.get(reply);
  if (!id) {
    id = `chatcmpl-${nanoid(16)}`;
    streamIds.set(reply, id);
  }
  return id;
}

export function writeStreamChunk(
  reply: FastifyReply,
  frame: StreamChunkFrame
): void {
  const payload = {
    id: getStreamId(reply),
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    model: frame.requestedModel,
    choices: [
      {
        index: 0,
        delta: frame.delta ? { content: frame.delta } : {},
        finish_reason: frame.finishReason ?? null,
      },
    ],
  };
  reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export function writeStreamError(
  reply: FastifyReply,
  err: { code: string; provider: string; message: string }
): void {
  reply.raw.write(
    `data: ${JSON.stringify({ error: { ...err, type: "gateway_error" } })}\n\n`
  );
}

export function writeStreamDone(reply: FastifyReply): void {
  reply.raw.write(`data: [DONE]\n\n`);
}
