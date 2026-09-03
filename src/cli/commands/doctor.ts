import { loadConfig, providerConfiguredStatus } from '../../config/config-manager.js';
import { isPortAvailable, readRuntime, isProcessAlive } from '../../utils/process.js';
import { integrations } from '../../integrations/registry.js';
import { readLocalApiKey } from '../../integrations/local-api-key.js';
import { banner, section, line, dim, info } from '../ui/output.js';

const MIN_NODE_MAJOR = 18;

export async function doctorCommand(): Promise<void> {
  banner();
  info('UNICHANL DOCTOR');

  section('Runtime');
  const nodeMajor = parseInt(process.versions.node.split('.')[0] ?? '0', 10);
  line('Node.js', `${process.versions.node}`, nodeMajor >= MIN_NODE_MAJOR);

  const cfg = loadConfig();
  const rt = readRuntime();
  const gatewayRunning = !!rt && isProcessAlive(rt.pid);
  line('Gateway process', gatewayRunning ? 'running' : 'stopped', gatewayRunning);

  const portFree = await isPortAvailable(cfg.gateway.port, cfg.gateway.host);
  line(`Port ${cfg.gateway.port}`, gatewayRunning ? 'in use by unichanl' : portFree ? 'available' : 'in use (foreign)', gatewayRunning || portFree);

  const localKey = readLocalApiKey();
  line('Local API key', localKey ? 'present' : 'missing', !!localKey);

  section('Providers');
  const providers = providerConfiguredStatus();
  const anthropicOk = providers.anthropic;
  line('Anthropic API key', anthropicOk ? 'configured' : 'NOT configured (ANTHROPIC_API_KEY)', anthropicOk);
  const modelOk = !!cfg.providers.anthropic.model;
  line('Anthropic model', modelOk ? cfg.providers.anthropic.model : 'NOT configured', modelOk);
  line('Anthropic enabled', cfg.providers.anthropic.enabled ? 'yes' : 'no', cfg.providers.anthropic.enabled);
  for (const [name, configured] of Object.entries(providers)) {
    if (name === 'anthropic') continue;
    line(name, configured ? 'API key set' : 'API key NOT set', configured);
  }

  section('Tool integrations');
  for (const integ of integrations) {
    const det = await integ.detect();
    const can = await integ.canConfigureGateway();
    if (!det.installed) {
      line(integ.displayName, `not detected (${det.reason ?? ''})`, false);
      continue;
    }
    line(integ.displayName, det.version ? `installed ${det.version}` : 'installed');
    if (!can.supported) {
      dim(`  adapter unsupported: ${can.reason}`);
      continue;
    }
    const snap = await integ.getConfiguration();
    const connected = snap?.isConfiguredForUnichanl ?? false;
    line(`  connection`, connected ? 'configured for Unichanl' : 'not configured', connected);
    if (connected && gatewayRunning && localKey) {
      const gatewayUrl = `http://${cfg.gateway.host}:${cfg.gateway.port}`;
      const val = await integ.validate(gatewayUrl, localKey);
      line(`  validation`, val.message, val.ok);
    }
  }
  console.log('');
}
