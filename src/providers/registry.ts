import type { Provider } from './provider.interface.js';
import { getAnthropicProvider } from './anthropic/provider.js';

// Phase 2: only Anthropic. Routing/fallback belongs to Phase 4.
export function getProvider(name = 'anthropic'): Provider {
  if (name === 'anthropic') return getAnthropicProvider();
  throw new Error(`Unknown provider: ${name}`);
}

let override: Provider | null = null;
export function __setProviderOverrideForTests(p: Provider | null): void {
  override = p;
}
export function getDefaultProvider(): Provider {
  return override ?? getAnthropicProvider();
}
