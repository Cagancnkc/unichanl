/**
 * The spec's SECOND success criterion: real HTTP request to the gateway,
 * primary provider returns 429, gateway falls back to secondary, client
 * receives an OpenAI-shape response with real content. All routing events
 * are persisted to SQLite.
 *
 * We inject two fake providers so no API credits are spent.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildServer } from "../../src/server/server.js";
import { setTestDb } from "../../src/database/database.js";
import { listRoutingEvents, listMessages } from "../../src/database/schema.js";
import {
  ProviderRequestError,
  type Provider,
  type ProviderChatCompletionInput,
  type ProviderChatCompletionResult,
  type ProviderName,
  type StreamChunk,
} from "../../src/types/index.js";

class AlwaysFailProvider implements Provider {
  readonly name: ProviderName;
  constructor(name: ProviderName) {
    this.name = name;
  }
  isAvailable() {
    return true;
  }
  async chatCompletion(
    _input: ProviderChatCompletionInput
  ): Promise<ProviderChatCompletionResult> {
    throw new ProviderRequestError(`${this.name} rate limited`, 429);
  }
  async *streamChatCompletion(): AsyncIterable<StreamChunk> {
    throw new ProviderRequestError(`${this.name} rate limited`, 429);
  }
}

class AlwaysSuccessProvider implements Provider {
  readonly name: ProviderName;
  constructor(name: ProviderName) {
    this.name = name;
  }
  isAvailable() {
    return true;
  }
  async chatCompletion(
    input: ProviderChatCompletionInput
  ): Promise<ProviderChatCompletionResult> {
    const lastUser = [...input.messages].reverse().find((m) => m.role === "user");
    return {
      provider: this.name,
      model: input.model,
      content: `pong: ${lastUser?.content ?? ""}`,
      finishReason: "stop",
      usage: { promptTokens: 1, completionTokens: 3 },
      latencyMs: 1,
    };
  }
  async *streamChatCompletion(
    input: ProviderChatCompletionInput
  ): AsyncIterable<StreamChunk> {
    const lastUser = [...input.messages].reverse().find((m) => m.role === "user");
    for (const ch of `pong: ${lastUser?.content ?? ""}`) yield { delta: ch };
    yield { delta: "", finishReason: "stop" };
  }
}

let app: FastifyInstance;

beforeEach(async () => {
  setTestDb();
  app = await buildServer({
    providers: [
      new AlwaysFailProvider("anthropic"),
      new AlwaysSuccessProvider("openai"),
      new AlwaysFailProvider("google"),
    ],
  });
  await app.ready();
});

afterEach(async () => {
  await app.close();
});

describe("integration: POST /v1/chat/completions", () => {
  it("SECOND SUCCESS CRITERION: 429 on anthropic → openai fallback returns real response", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      headers: { "content-type": "application/json", "x-session-id": "sess_it_1" },
      payload: {
        model: "unichanl-auto",
        messages: [{ role: "user", content: "Say hello" }],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      choices: Array<{ message: { content: string } }>;
      unichanl: { provider: string; fallback_count: number };
    };
    expect(body.choices[0].message.content).toBe("pong: Say hello");
    expect(body.unichanl.provider).toBe("openai");
    expect(body.unichanl.fallback_count).toBe(1);

    // Verify routing events persisted
    const events = listRoutingEvents(res.headers["x-unichanl-request-id"] as string) as Array<{
      to_provider: string;
      success: number;
      reason: string;
    }>;
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ to_provider: "anthropic", success: 0, reason: "RATE_LIMIT" });
    expect(events[1]).toMatchObject({ to_provider: "openai", success: 1, reason: "fallback" });

    // Verify session messages persisted
    const msgs = listMessages("sess_it_1", 100);
    expect(msgs.map((m) => m.role)).toEqual(["user", "assistant"]);
    expect(msgs[0].content).toBe("Say hello");
    expect(msgs[1].content).toBe("pong: Say hello");
  });

  it("returns OpenAI-shape body on success", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      headers: { "content-type": "application/json" },
      payload: {
        model: "unichanl-auto",
        messages: [{ role: "user", content: "test" }],
      },
    });
    const body = res.json() as Record<string, unknown>;
    expect(body).toMatchObject({
      object: "chat.completion",
      model: "unichanl-auto",
    });
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("usage");
    expect(body).toHaveProperty("choices");
  });

  it("rejects malformed body with 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      headers: { "content-type": "application/json" },
      payload: { model: "unichanl-auto" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ error: { code: "BAD_REQUEST" } });
  });

  it("GET /health works", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.json()).toEqual({
      status: "ok",
      service: "unichanl",
      gateway: "running",
    });
  });

  it("GET /v1/models lists 3 unichanl models", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/models" });
    const body = res.json() as { data: Array<{ id: string }> };
    expect(body.data.map((d) => d.id).sort()).toEqual([
      "unichanl-auto",
      "unichanl-fast",
      "unichanl-primary",
    ]);
  });
});
