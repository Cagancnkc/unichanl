export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
  session_id?: string;
  routing_strategy?: RoutingStrategy;
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: 'stop' | 'length' | 'content_filter' | null;
}

export interface UsageStats {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: UsageStats;
}

export interface StreamDelta {
  role?: string;
  content?: string;
}

export interface StreamChoice {
  index: number;
  delta: StreamDelta;
  finish_reason: string | null;
}

export interface StreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: StreamChoice[];
}

export type RoutingStrategy = 'auto' | 'priority' | 'cheapest' | 'fastest' | 'capability';

export interface RoutingContext {
  requestedModel: string;
  strategy: RoutingStrategy;
  capabilities?: string[];
  userId: string;
  sessionId?: string;
}

export interface ModelCandidate {
  id: string;
  openrouterModelId: string;
  provider: string;
  displayName: string;
  capabilityTags: string[];
  inputCostPer1k: number;
  outputCostPer1k: number;
  priority: number;
  avgLatencyMs: number;
  healthStatus: 'healthy' | 'degraded' | 'down';
}

export interface ProviderError {
  code: 'rate_limited' | 'model_unavailable' | 'context_too_long' | 'upstream_error' | 'timeout';
  message: string;
  retryable: boolean;
  retryAfterMs?: number;
}

export interface ProviderResponse {
  success: boolean;
  data?: ChatCompletionResponse;
  error?: ProviderError;
  latencyMs: number;
  tokensUsed?: UsageStats;
}

export interface AuthenticatedUser {
  id: string;
  apiKeyId: string;
  email: string;
  plan: string;
  tier: string;
  rateLimit: number;
}

export interface UsageRecordInput {
  requestId: string;
  userId: string;
  apiKeyId: string;
  sessionId?: string;
  modelId: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  totalCostUsd: number;
  latencyMs: number;
  routingStrategy: string;
  wasFailover: boolean;
  httpStatus: number;
}
