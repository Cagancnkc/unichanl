import { loadConfig, sanitizeForDisplay, providerConfiguredStatus } from '../../config/config-manager.js';
import { configPath } from '../../config/paths.js';
import { banner, section, info } from '../ui/output.js';

export async function configShowCommand(): Promise<void> {
  banner();
  section(`Config (${configPath()})`);
  const cfg = loadConfig();
  info(JSON.stringify(sanitizeForDisplay(cfg), null, 2));
  section('Provider API keys (from environment)');
  info(JSON.stringify(providerConfiguredStatus(), null, 2));
}
