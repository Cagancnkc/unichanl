import type { ChainStep, UnichanlConfig } from "../types/index.js";

export function resolveModelChain(
  modelId: string,
  config: UnichanlConfig
): ChainStep[] {
  const chain = config.models[modelId];
  if (!chain || chain.length === 0) {
    throw new Error(`Unknown unichanl model: "${modelId}"`);
  }
  return [...chain];
}
