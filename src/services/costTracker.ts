import type { ModelCandidate, UsageStats } from '../types/index.js';

class CostTracker {
  calculateCost(model: ModelCandidate, usage: UsageStats): number {
    const inputCost = (usage.prompt_tokens / 1000) * model.inputCostPer1k;
    const outputCost = (usage.completion_tokens / 1000) * model.outputCostPer1k;
    return inputCost + outputCost;
  }
}

export const costTracker = new CostTracker();
