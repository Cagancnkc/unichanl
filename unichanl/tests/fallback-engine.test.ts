import { describe, it, expect, beforeEach } from "vitest";
import { executeWithFallback } from "../src/fallback/fallback-engine.js";
import { setTestDb } from "../src/database/database.js";
import { insertSession, listRoutingEvents } from "../src/database/schema.js";
import {
  AllProvidersFailedError,
  ProviderRequestError,
  type ChainStep,
  type Provider,
  type ProviderChatCompletionInput,
  type ProviderChatCompletionResult,
  type ProviderName,
  type StreamChunk,
} from "../src/types/index.js";

class FakeProvider implements Provider {
  readonly name: ProviderName;
  constructor(
    name: ProviderName,
    private impl: () => Promise<ProviderChatCompletionResult>
  ) {
    this.name = name;
  }
  isAvailable() {
    return true;
  }
  async chatCompletion(_input: ProviderChatCompletionInput) {
    return this.impl();
  }
  async *streamChatCompletion(): AsyncIterable<StreamChunk> {
    yield { delta: "unused" };
  }
}

function successResult(
  provider: ProviderName,
  model: string
): ProviderChatCompletionResult {
  return {
    provider,
    model,
    content: `hello from ${provider}`,
    finishReason: "stop",
    usage: { promptTokens: 1, completionTokens: 2 },
    latencyMs: 1,
  };
}

const baseCtx = () => ({
  requestId: "req_test_" + Math.random().toString(36).slice(2, 8),
  sessionId: insertSession("sess_" + Math.random().toString(36).slice(2, 10)).id,
  messages: [{ role: "user" as const, content: "hi" }],
  stream: false,
});

beforeEach(() => {
  setTestDb();
});

describe("fallback-engine", () => {
  it("first provider succeeds → no fallback", async () => {
    const chain: ChainStep[] = [
      { provider: "anthropic", model: "primary" },
      { provider: "openai", model: "backup" },
    ];
    const providers = new Map<ProviderName, Provider>([
      ["anthropic", new FakeProvider("anthropic", async () => successResult("anthropic", "primary"))],
      ["openai", new FakeProvider("openai", async () => successResult("openai", "backup"))],
    ]);
    const ctx = baseCtx();
    const res = await executeWithFallback(chain, ctx, providers);
    expect(res.provider).toBe("anthropic");
    expect(res.fallbackCount).toBe(0);
    expect(listRoutingEvents(ctx.requestId)).toHaveLength(1);
  });

  it("429 on first → falls back to second", async () => {
    const chain: ChainStep[] = [
      { provider: "anthropic", model: "primary" },
      { provider: "openai", model: "backup" },
    ];
    const providers = new Map<ProviderName, Provider>([
      ["anthropic", new FakeProvider("anthropic", async () => {
        throw new ProviderRequestError("rate limited", 429);
      })],
      ["openai", new FakeProvider("openai", async () => successResult("openai", "backup"))],
    ]);
    const ctx = baseCtx();
    const res = await executeWithFallback(chain, ctx, providers);
    expect(res.provider).toBe("openai");
    expect(res.fallbackCount).toBe(1);
    const events = listRoutingEvents(ctx.requestId) as Array<{
      to_provider: string;
      success: number;
      reason: string;
    }>;
    expect(events).toHaveLength(2);
    expect(events[0].to_provider).toBe("anthropic");
    expect(events[0].success).toBe(0);
    expect(events[0].reason).toBe("RATE_LIMIT");
    expect(events[1].to_provider).toBe("openai");
    expect(events[1].success).toBe(1);
  });

  it("500 on first → falls back", async () => {
    const chain: ChainStep[] = [
      { provider: "anthropic", model: "primary" },
      { provider: "openai", model: "backup" },
    ];
    const providers = new Map<ProviderName, Provider>([
      ["anthropic", new FakeProvider("anthropic", async () => {
        throw new ProviderRequestError("boom", 500);
      })],
      ["openai", new FakeProvider("openai", async () => successResult("openai", "backup"))],
    ]);
    const res = await executeWithFallback(chain, baseCtx(), providers);
    expect(res.provider).toBe("openai");
  });

  it("401 on first → does NOT fall back (fatal)", async () => {
    const chain: ChainStep[] = [
      { provider: "anthropic", model: "primary" },
      { provider: "openai", model: "backup" },
    ];
    const providers = new Map<ProviderName, Provider>([
      ["anthropic", new FakeProvider("anthropic", async () => {
        throw new ProviderRequestError("nope", 401);
      })],
      ["openai", new FakeProvider("openai", async () => successResult("openai", "backup"))],
    ]);
    await expect(
      executeWithFallback(chain, baseCtx(), providers)
    ).rejects.toThrow(/nope/);
  });

  it("all providers fail → AllProvidersFailedError", async () => {
    const chain: ChainStep[] = [
      { provider: "anthropic", model: "a" },
      { provider: "openai", model: "b" },
    ];
    const providers = new Map<ProviderName, Provider>([
      ["anthropic", new FakeProvider("anthropic", async () => { throw new ProviderRequestError("rl", 429); })],
      ["openai", new FakeProvider("openai", async () => { throw new ProviderRequestError("boom", 500); })],
    ]);
    await expect(
      executeWithFallback(chain, baseCtx(), providers)
    ).rejects.toBeInstanceOf(AllProvidersFailedError);
  });

  it("same provider+model never retried within one request", async () => {
    let calls = 0;
    const chain: ChainStep[] = [
      { provider: "anthropic", model: "same" },
      { provider: "anthropic", model: "same" },
      { provider: "openai", model: "backup" },
    ];
    const providers = new Map<ProviderName, Provider>([
      ["anthropic", new FakeProvider("anthropic", async () => {
        calls++;
        throw new ProviderRequestError("rl", 429);
      })],
      ["openai", new FakeProvider("openai", async () => successResult("openai", "backup"))],
    ]);
    const res = await executeWithFallback(chain, baseCtx(), providers);
    expect(calls).toBe(1);
    expect(res.provider).toBe("openai");
  });
});
