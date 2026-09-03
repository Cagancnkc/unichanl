export type Role = "system" | "user" | "assistant" | "tool";

export interface InternalMessage {
  role: Role;
  content: string;
  name?: string;
  tool_call_id?: string;
}

export interface InternalRequest {
  requestId: string;
  sessionId: string;
  model: string;
  messages: InternalMessage[];
  stream: boolean;
  tools?: unknown[];
  temperature?: number;
  max_tokens?: number;
  metadata?: Record<string, unknown>;
}

export interface InternalResponse {
  requestId: string;
  sessionId: string;
  provider: ProviderName;
  model: string;
  content: string;
  finishReason: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
  };
  fallbackCount: number;
  latencyMs: number;
}

export type ProviderName = "anthropic" | "openai" | "google" | "mock";

export type ClassifiedErrorType =
  | "RATE_LIMIT"
  | "QUOTA"
  | "TIMEOUT"
  | "SERVER_ERROR"
  | "CONNECTION"
  | "AUTH"
  | "BAD_REQUEST"
  | "NOT_IMPLEMENTED"
  | "UNKNOWN";

export interface ClassifiedError {
  type: ClassifiedErrorType;
  retryable: boolean;
  fallbackable: boolean;
  originalMessage: string;
  statusCode?: number;
}

export interface ProviderChatCompletionInput {
  requestId: string;
  messages: InternalMessage[];
  model: string;
  stream: boolean;
  temperature?: number;
  max_tokens?: number;
  tools?: unknown[];
}

export interface ProviderChatCompletionResult {
  provider: ProviderName;
  model: string;
  content: string;
  finishReason: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
  };
  latencyMs: number;
}

export interface StreamChunk {
  delta: string;
  finishReason?: string;
}

export interface Provider {
  readonly name: ProviderName;
  isAvailable(): boolean;
  chatCompletion(
    input: ProviderChatCompletionInput
  ): Promise<ProviderChatCompletionResult>;
  streamChatCompletion(
    input: ProviderChatCompletionInput
  ): AsyncIterable<StreamChunk>;
}

export interface ChainStep {
  provider: ProviderName;
  model: string;
}

export interface UnichanlConfig {
  gateway: {
    host: string;
    port: number;
  };
  routing: {
    default: string;
  };
  models: Record<string, ChainStep[]>;
}

export class ProviderRequestError extends Error {
  readonly statusCode?: number;
  readonly body?: unknown;
  constructor(message: string, statusCode?: number, body?: unknown) {
    super(message);
    this.name = "ProviderRequestError";
    this.statusCode = statusCode;
    this.body = body;
  }
}

export class AllProvidersFailedError extends Error {
  readonly attempts: Array<{
    provider: ProviderName;
    model: string;
    error: string;
  }>;
  constructor(attempts: AllProvidersFailedError["attempts"]) {
    super("All configured fallback providers failed.");
    this.name = "AllProvidersFailedError";
    this.attempts = attempts;
  }
}

export class NoProvidersAvailableError extends Error {
  constructor(model: string) {
    super(`No configured providers are available for model "${model}".`);
    this.name = "NoProvidersAvailableError";
  }
}
