export type ProviderName = 'nvidia' | 'openrouter';

export type AvailabilityState =
  | 'AVAILABLE'
  | 'DEGRADED'
  | 'COOLDOWN'
  | 'RATE_LIMITED'
  | 'UNAVAILABLE'
  | 'DISABLED';

export interface Capabilities {
  streaming: boolean;
  toolCalling: boolean;
  vision: boolean;
  jsonMode: boolean;
  reasoning: boolean;
  anthropicCompat: boolean;
}

export interface CostModel {
  inputPerMTokUsd: number;
  outputPerMTokUsd: number;
}

export interface HealthSnapshot {
  successRate: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  consecutiveFailures: number;
  lastError?: { category: string; at: string; message: string };
  cooldownUntil?: string;
  rateLimitResetAt?: string;
  windowSize: number;
  updatedAt: string;
}

export interface ModelMetadata {
  id: string;
  providerName: ProviderName;
  providerModelId: string;
  displayName: string;
  contextWindow: number;
  maxOutputTokens: number;
  capabilities: Capabilities;
  cost: CostModel;
  tags: string[];
  enabled: boolean;
  availability: AvailabilityState;
  health: HealthSnapshot;
}

export function emptyHealth(): HealthSnapshot {
  return {
    successRate: 1,
    avgLatencyMs: 0,
    p95LatencyMs: 0,
    consecutiveFailures: 0,
    windowSize: 0,
    updatedAt: new Date(0).toISOString(),
  };
}
