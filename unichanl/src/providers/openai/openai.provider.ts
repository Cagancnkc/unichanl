import { request } from "undici";
import type {
  Provider,
  ProviderChatCompletionInput,
  ProviderChatCompletionResult,
  StreamChunk,
} from "../../types/index.js";
import { ProviderRequestError } from "../../types/index.js";
import { mapHttpError } from "../provider.interface.js";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 120_000;

interface OpenAIMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
}

function toOpenAIMessages(
  input: ProviderChatCompletionInput
): OpenAIMessage[] {
  return input.messages.map((m) => ({
    role: m.role,
    content: m.content,
    ...(m.name ? { name: m.name } : {}),
    ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
  }));
}

export class OpenAIProvider implements Provider {
  readonly name = "openai" as const;
  private apiKey: string | undefined;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl = OPENAI_URL) {
    this.apiKey = apiKey ?? process.env.OPENAI_API_KEY;
    this.baseUrl = baseUrl;
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  async chatCompletion(
    input: ProviderChatCompletionInput
  ): Promise<ProviderChatCompletionResult> {
    if (!this.apiKey) {
      throw new ProviderRequestError("OpenAI API key not configured", 401);
    }
    const started = Date.now();
    const body = {
      model: input.model,
      messages: toOpenAIMessages(input),
      ...(input.temperature != null ? { temperature: input.temperature } : {}),
      ...(input.max_tokens != null ? { max_tokens: input.max_tokens } : {}),
      stream: false,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await request(this.baseUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
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
        throw mapHttpError(res.statusCode, parsed, "openai");
      }
      const parsed = JSON.parse(text) as {
        model?: string;
        choices?: Array<{
          message?: { content?: string };
          finish_reason?: string;
        }>;
        usage?: {
          prompt_tokens?: number;
          completion_tokens?: number;
        };
      };

      const choice = parsed.choices?.[0];
      return {
        provider: "openai",
        model: parsed.model ?? input.model,
        content: choice?.message?.content ?? "",
        finishReason: choice?.finish_reason ?? "stop",
        usage: {
          promptTokens: parsed.usage?.prompt_tokens,
          completionTokens: parsed.usage?.completion_tokens,
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
      throw new ProviderRequestError("OpenAI API key not configured", 401);
    }
    const body = {
      model: input.model,
      messages: toOpenAIMessages(input),
      ...(input.temperature != null ? { temperature: input.temperature } : {}),
      ...(input.max_tokens != null ? { max_tokens: input.max_tokens } : {}),
      stream: true,
    };

    const res = await request(this.baseUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.apiKey}`,
        accept: "text/event-stream",
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
      throw mapHttpError(res.statusCode, parsed, "openai");
    }

    let buffer = "";
    for await (const chunk of res.body) {
      buffer += chunk.toString("utf8");
      let idx;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        for (const line of frame.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            yield { delta: "", finishReason: "stop" };
            return;
          }
          if (!data) continue;
          try {
            const evt = JSON.parse(data) as {
              choices?: Array<{
                delta?: { content?: string };
                finish_reason?: string | null;
              }>;
            };
            const choice = evt.choices?.[0];
            const delta = choice?.delta?.content;
            if (typeof delta === "string" && delta.length > 0) {
              yield { delta };
            }
            if (choice?.finish_reason) {
              yield { delta: "", finishReason: choice.finish_reason };
            }
          } catch {
            /* skip malformed */
          }
        }
      }
    }
  }
}
