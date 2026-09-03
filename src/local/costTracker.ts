import type { ModelMetadata } from '../registry/model.types.js';
import type { UsageStats } from '../types/index.js';

export interface CostBreakdown {
  inputUsd: number;
  outputUsd: number;
  totalUsd: number;
}

export function computeCost(model: ModelMetadata, usage?: UsageStats): CostBreakdown {
  const promptTokens = usage?.prompt_tokens ?? 0;
  const completionTokens = usage?.completion_tokens ?? 0;
  const inputUsd = (promptTokens / 1_000_000) * model.cost.inputPerMTokUsd;
  const outputUsd = (completionTokens / 1_000_000) * model.cost.outputPerMTokUsd;
  return {
    inputUsd,
    outputUsd,
    totalUsd: inputUsd + outputUsd,
  };
}
