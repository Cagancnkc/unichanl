import type {
  Provider,
  ProviderChatCompletionInput,
  ProviderChatCompletionResult,
  StreamChunk,
} from "../../types/index.js";

/**
 * MVP scaffold. `isAvailable()` returns true only when GOOGLE_API_KEY is set;
 * the router filters unavailable providers so this stub is never called
 * in the default configuration.
 *
 * If a key is present but this stub is invoked, we throw a clearly-worded
 * error that the classifier will treat as NOT_IMPLEMENTED (non-fallbackable)
 * so the caller sees an honest failure instead of silent degradation.
 */
export class GoogleProvider implements Provider {
  readonly name = "google" as const;
  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.GOOGLE_API_KEY;
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  async chatCompletion(
    _input: ProviderChatCompletionInput
  ): Promise<ProviderChatCompletionResult> {
    throw new Error(
      "Google adapter not implemented in MVP. Remove google from your model chains or wait for v0.2."
    );
  }

  async *streamChatCompletion(
    _input: ProviderChatCompletionInput
  ): AsyncIterable<StreamChunk> {
    throw new Error(
      "Google adapter not implemented in MVP. Remove google from your model chains or wait for v0.2."
    );
  }
}
