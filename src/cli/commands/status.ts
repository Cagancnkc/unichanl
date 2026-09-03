import { readRuntime, isProcessAlive } from '../../utils/process.js';
import { loadConfig, providerConfiguredStatus } from '../../config/config-manager.js';
import { integrations } from '../../integrations/registry.js';
import { banner, section, line, dim } from '../ui/output.js';

export async function statusCommand(): Promise<void> {
  banner();
  section('Gateway');

  const rt = readRuntime();
  const cfg = loadConfig();

  if (rt && isProcessAlive(rt.pid)) {
    line('Status', '● RUNNING', true);
    line('Address', `${rt.host}:${rt.port}`);
    line('PID', String(rt.pid));
    line('Started', rt.startedAt);

    // Probe /health for freshness.
    try {
      const res = await fetch(`http://${rt.host}:${rt.port}/health`, { signal: AbortSignal.timeout(2000) });
      line('Health', res.ok ? 'ok' : `HTTP ${res.status}`, res.ok);
    } catch {
      line('Health', 'unreachable', false);
    }
  } else {
    line('Status', '○ STOPPED', false);
    if (rt && !isProcessAlive(rt.pid)) {
      dim(`  (stale runtime file for PID ${rt.pid})`);
    }
  }

  line('Routing', cfg.routing.default);

  section('Providers');
  const providers = providerConfiguredStatus();
  const anthropicConfigured = providers.anthropic;
  line(
    'Anthropic',
    anthropicConfigured ? 'CONFIGURED' : 'MISSING API KEY',
    anthropicConfigured,
  );
  line('  model', cfg.providers.anthropic.model);
  for (const [name, configured] of Object.entries(providers)) {
    if (name === 'anthropic') continue;
    line(name, configured ? 'CONFIGURED' : 'NOT CONFIGURED', configured);
  }

  section('Connected Tools');
  for (const integ of integrations) {
    const det = await integ.detect();
    if (!det.installed) {
      line(integ.displayName, 'NOT DETECTED', false);
      continue;
    }
    const snap = await integ.getConfiguration();
    const connected = snap?.isConfiguredForUnichanl ?? false;
    line(integ.displayName, connected ? 'CONNECTED' : 'DETECTED (not connected)', connected);
  }
  console.log('');
}
