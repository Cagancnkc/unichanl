import { describe, it, expect } from "vitest";
import { buildProviderChain } from "../src/router/router.js";
import { DEFAULT_CONFIG } from "../src/config/models.js";
import {
  NoProvidersAvailableError,
  type Provider,
  type ProviderName,
  type ProviderChatCompletionInput,
  type ProviderChatCompletionResult,
  type StreamChunk,
} from "../src/types/index.js";

function makeProvider(name: ProviderName, available: boolean): Provider {
  return {
    name,
    isAvailable: () => available,
    async chatCompletion(_i: ProviderChatCompletionInput): Promise<ProviderChatCompletionResult> {
      return { provider: name, model: "x", content: "", finishReason: "stop", latencyMs: 0 };
    },
    async *streamChatCompletion(): AsyncIterable<StreamChunk> {
      yield { delta: "" };
    },
  };
}

describe("router", () => {
  it("resolves unichanl-auto to full chain when all available", () => {
    const providers = new Map<ProviderName, Provider>([
      ["anthropic", makeProvider("anthropic", true)],
      ["openai", makeProvider("openai", true)],
      ["google", makeProvider("google", true)],
    ]);
    const chain = buildProviderChain("unichanl-auto", DEFAULT_CONFIG, providers);
    expect(chain).toHaveLength(3);
    expect(chain[0].provider).toBe("anthropic");
  });

  it("filters out unavailable providers", () => {
    const providers = new Map<ProviderName, Provider>([
      ["anthropic", makeProvider("anthropic", false)],
      ["openai", makeProvider("openai", true)],
      ["google", makeProvider("google", false)],
    ]);
    const chain = buildProviderChain("unichanl-auto", DEFAULT_CONFIG, providers);
    expect(chain).toHaveLength(1);
    expect(chain[0].provider).toBe("openai");
  });

  it("throws NoProvidersAvailableError when nothing available", () => {
    const providers = new Map<ProviderName, Provider>([
      ["anthropic", makeProvider("anthropic", false)],
      ["openai", makeProvider("openai", false)],
      ["google", makeProvider("google", false)],
    ]);
    expect(() => buildProviderChain("unichanl-auto", DEFAULT_CONFIG, providers)).toThrow(
      NoProvidersAvailableError
    );
  });

  it("unknown model throws", () => {
    const providers = new Map<ProviderName, Provider>();
    expect(() => buildProviderChain("nope-model", DEFAULT_CONFIG, providers)).toThrow(
      /Unknown unichanl model/
    );
  });
});
