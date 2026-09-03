import type {
  Provider,
  ProviderChatCompletionInput,
  ProviderChatCompletionResult,
  StreamChunk,
} from "../types/index.js";

export interface MockProviderOptions {
  behavior?: "success" | "throw";
  throwError?: Error;
  delayMs?: number;
}

export class MockProvider implements Provider {
  readonly name = "mock" as const;
  private opts: Required<Omit<MockProviderOptions, "throwError">> & {
    throwError?: Error;
  };

  constructor(opts: MockProviderOptions = {}) {
    this.opts = {
      behavior: opts.behavior ?? "success",
      delayMs: opts.delayMs ?? 0,
      throwError: opts.throwError,
    };
  }

  isAvailable(): boolean {
    return true;
  }

  async chatCompletion(
    input: ProviderChatCompletionInput
  ): Promise<ProviderChatCompletionResult> {
    const start = Date.now();
    if (this.opts.delayMs > 0) {
      await new Promise((r) => setTimeout(r, this.opts.delayMs));
    }
    if (this.opts.behavior === "throw") {
      throw this.opts.throwError ?? new Error("mock provider forced error");
    }
    const lastUser = [...input.messages].reverse().find((m) => m.role === "user");
    const echo = lastUser?.content ?? "";
    return {
      provider: "mock",
      model: input.model,
      content: `mock: ${echo}`,
      finishReason: "stop",
      usage: { promptTokens: echo.length, completionTokens: echo.length + 5 },
      latencyMs: Date.now() - start,
    };
  }

  async *streamChatCompletion(
    input: ProviderChatCompletionInput
  ): AsyncIterable<StreamChunk> {
    if (this.opts.behavior === "throw") {
      throw this.opts.throwError ?? new Error("mock provider forced error");
    }
    const lastUser = [...input.messages].reverse().find((m) => m.role === "user");
    const text = `mock: ${lastUser?.content ?? ""}`;
    for (const ch of text) {
      yield { delta: ch };
    }
    yield { delta: "", finishReason: "stop" };
  }
}
