import { request } from "undici";
import type {
  Provider,
  ProviderChatCompletionInput,
  ProviderChatCompletionResult,
  StreamChunk,
} from "../../types/index.js";
import { ProviderRequestError } from "../../types/index.js";
import { mapHttpError } from "../provider.interface.js";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MAX_TOKENS = 4096;
const REQUEST_TIMEOUT_MS = 120_000;

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

function toAnthropicPayload(input: ProviderChatCompletionInput): {
  system: string | undefined;
  messages: AnthropicMessage[];
} {
  const systemParts: string[] = [];
  const messages: AnthropicMessage[] = [];
  for (const m of input.messages) {
    if (m.role === "system") {
      systemParts.push(m.content);
      continue;
    }
    if (m.role === "tool") {
      messages.push({ role: "user", content: `[tool result] ${m.content}` });
      continue;
    }
    messages.push({ role: m.role, content: m.content });
  }
  return {
    system: systemParts.length ? systemParts.join("\n\n") : undefined,
    messages,
  };
}

export class AnthropicProvider implements Provider {
  readonly name = "anthropic" as const;
  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.ANTHROPIC_API_KEY;
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  async chatCompletion(
    input: ProviderChatCompletionInput
  ): Promise<ProviderChatCompletionResult> {
    if (!this.apiKey) {
      throw new ProviderRequestError("Anthropic API key not configured", 401);
    }
    const started = Date.now();
    const { system, messages } = toAnthropicPayload(input);

    const body = {
      model: input.model,
      messages,
      max_tokens: input.max_tokens ?? DEFAULT_MAX_TOKENS,
      ...(system ? { system } : {}),
      ...(input.temperature != null ? { temperature: input.temperature } : {}),
      stream: false,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await request(ANTHROPIC_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const text = await res.body.text();
      if (res.statusCode >= 400) {
        let parsed: unknown = text;
        try {
          parsed = JSON.parse(text);
        } catch {
          /* keep raw */
        }
        throw mapHttpError(res.statusCode, parsed, "anthropic");
      }

      const parsed = JSON.parse(text) as {
        content: Array<{ type: string; text?: string }>;
        stop_reason?: string;
        usage?: { input_tokens?: number; output_tokens?: number };
        model?: string;
      };

      const content = (parsed.content ?? [])
        .filter((c) => c.type === "text" && typeof c.text === "string")
        .map((c) => c.text)
        .join("");

      return {
        provider: "anthropic",
        model: parsed.model ?? input.model,
        content,
        finishReason: parsed.stop_reason ?? "stop",
        usage: {
          promptTokens: parsed.usage?.input_tokens,
          completionTokens: parsed.usage?.output_tokens,
        },
        latencyMs: Date.now() - started,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  async *streamChatCompletion(
    input: ProviderChatCompletionInput
  ): AsyncIterable<StreamChunk> {
    if (!this.apiKey) {
      throw new ProviderRequestError("Anthropic API key not configured", 401);
    }
    const { system, messages } = toAnthropicPayload(input);
    const body = {
      model: input.model,
      messages,
      max_tokens: input.max_tokens ?? DEFAULT_MAX_TOKENS,
      ...(system ? { system } : {}),
      ...(input.temperature != null ? { temperature: input.temperature } : {}),
      stream: true,
    };

    const res = await request(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "text/event-stream",
        "x-api-key": this.apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
    });

    if (res.statusCode >= 400) {
      const text = await res.body.text();
      let parsed: unknown = text;
      try {
        parsed = JSON.parse(text);
      } catch {
        /* keep raw */
      }
      throw mapHttpError(res.statusCode, parsed, "anthropic");
    }

    let buffer = "";
    for await (const chunk of res.body) {
      buffer += chunk.toString("utf8");
      let idx;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const dataLine = frame
          .split("\n")
          .find((l) => l.startsWith("data: "));
        if (!dataLine) continue;
        const data = dataLine.slice(6).trim();
        if (!data) continue;
        try {
          const evt = JSON.parse(data) as {
            type: string;
            delta?: { type?: string; text?: string; stop_reason?: string };
          };
          if (
            evt.type === "content_block_delta" &&
            evt.delta?.type === "text_delta" &&
            typeof evt.delta.text === "string"
          ) {
            yield { delta: evt.delta.text };
          } else if (evt.type === "message_delta" && evt.delta?.stop_reason) {
            yield { delta: "", finishReason: evt.delta.stop_reason };
          } else if (evt.type === "message_stop") {
            yield { delta: "", finishReason: "stop" };
          }
        } catch {
          /* skip malformed frame */
        }
      }
    }
  }
}
