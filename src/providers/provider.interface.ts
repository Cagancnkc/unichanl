// Provider abstraction for Phase 2. The gateway route contains no
// provider-specific logic — it only speaks this interface.

export interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: OpenAIChatMessage[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stop?: string | string[];
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: { role: 'assistant'; content: string };
    finish_reason: 'stop' | 'length' | 'content_filter' | 'tool_calls' | string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatCompletionChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: { role?: 'assistant'; content?: string };
    finish_reason?: 'stop' | 'length' | 'content_filter' | 'tool_calls' | null | string;
  }>;
}

export interface AvailabilityResult {
  ok: boolean;
  reason?: string;
}

export interface ProviderCallOptions {
  requestId: string;
  signal: AbortSignal;
}

export interface Provider {
  readonly name: string;
  isAvailable(): Promise<AvailabilityResult>;
  chatCompletion(
    req: ChatCompletionRequest,
    opts: ProviderCallOptions,
  ): Promise<ChatCompletionResponse>;
  streamChatCompletion(
    req: ChatCompletionRequest,
    opts: ProviderCallOptions,
  ): AsyncIterable<ChatCompletionChunk>;
}

export class ProviderError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}
