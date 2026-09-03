import type { ModelCandidate } from '../types/index.js';

export function priorityStrategy(candidates: ModelCandidate[]): ModelCandidate[] {
  return [...candidates].sort((a, b) => b.priority - a.priority);
}

export function cheapestStrategy(candidates: ModelCandidate[]): ModelCandidate[] {
  return [...candidates].sort((a, b) => {
    const costA = a.inputCostPer1k + a.outputCostPer1k;
    const costB = b.inputCostPer1k + b.outputCostPer1k;
    return costA - costB;
  });
}

export function fastestStrategy(candidates: ModelCandidate[]): ModelCandidate[] {
  return [...candidates].sort((a, b) => a.avgLatencyMs - b.avgLatencyMs);
}

export function capabilityStrategy(candidates: ModelCandidate[], requiredTags: string[]): ModelCandidate[] {
  if (requiredTags.length === 0) return priorityStrategy(candidates);
  const filtered = candidates.filter((m) => requiredTags.every((tag) => m.capabilityTags.includes(tag)));
  return filtered.length > 0 ? priorityStrategy(filtered) : priorityStrategy(candidates);
}

export function autoStrategy(candidates: ModelCandidate[], capabilities?: string[]): ModelCandidate[] {
  if (capabilities && capabilities.length > 0) {
    return capabilityStrategy(candidates, capabilities);
  }
  return priorityStrategy(candidates);
}
