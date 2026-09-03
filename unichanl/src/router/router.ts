import type {
  ChainStep,
  Provider,
  ProviderName,
  UnichanlConfig,
} from "../types/index.js";
import { NoProvidersAvailableError } from "../types/index.js";
import { resolveModelChain } from "./model-selector.js";

export function buildProviderChain(
  modelId: string,
  config: UnichanlConfig,
  providers: Map<ProviderName, Provider>
): ChainStep[] {
  const rawChain = resolveModelChain(modelId, config);
  const filtered = rawChain.filter((step) => {
    const p = providers.get(step.provider);
    return p != null && p.isAvailable();
  });
  if (filtered.length === 0) {
    throw new NoProvidersAvailableError(modelId);
  }
  return filtered;
}
