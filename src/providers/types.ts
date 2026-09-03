import type { ChatMessage, ProviderResponse, StreamChunk } from '../types/index.js';

export interface CompletionOptions {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stop?: string | string[];
  requestId: string;
  timeoutMs?: number;
}

export interface InferenceProvider {
  name: string;
  complete(model: string, messages: ChatMessage[], options: CompletionOptions): Promise<ProviderResponse>;
  stream(model: string, messages: ChatMessage[], options: CompletionOptions): AsyncGenerator<StreamChunk, void, unknown>;
}
