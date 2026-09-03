import inquirer from 'inquirer';
import { integrations } from '../../integrations/registry.js';
import { loadConfig, updateIntegration } from '../../config/config-manager.js';
import { ensureLocalApiKey } from '../../integrations/local-api-key.js';
import { readRuntime, isProcessAlive } from '../../utils/process.js';
import { banner, section, ok, fail, warn, dim, info } from '../ui/output.js';

export async function setupCommand(): Promise<void> {
  banner();
  info('UNICHANL SETUP');
  info('');
  info('Scanning your development environment...');
  info('');

  const detected: Array<{ name: string; displayName: string; installed: boolean; supported: boolean; reason?: string }> = [];

  for (const integ of integrations) {
    const det = await integ.detect();
    const can = await integ.canConfigureGateway();
    const label = integ.displayName.padEnd(20);
    if (det.installed && can.supported) {
      console.log(`  ✓ ${label} detected`);
    } else if (det.installed && !can.supported) {
      console.log(`  ⚠ ${label} detected (integration not yet verified: ${can.reason ?? ''})`);
    } else {
      console.log(`  ✗ ${label} not detected`);
    }
    detected.push({
      name: integ.name,
      displayName: integ.displayName,
      installed: det.installed,
      supported: can.supported,
      reason: can.reason,
    });
  }

  const choices = detected
    .filter((d) => d.installed && d.supported)
    .map((d) => ({ name: d.displayName, value: d.name, checked: true }));

  if (choices.length === 0) {
    console.log('');
    warn('No verified, installed tools available to configure.');
    dim('Only Claude Code has a verified adapter in this release. Install it and re-run.');
    return;
  }

  console.log('');
  const answers = await inquirer.prompt<{ picks: string[] }>([
    {
      type: 'checkbox',
      name: 'picks',
      message: 'Which tools would you like to connect?',
      choices,
      validate: (v: readonly string[]) => (v.length ? true : 'Pick at least one.'),
    },
  ]);

  const cfg = loadConfig();
  const gatewayUrl = `http://${cfg.gateway.host}:${cfg.gateway.port}`;
  const localKey = ensureLocalApiKey();

  const rt = readRuntime();
  if (!rt || !isProcessAlive(rt.pid)) {
    warn('Unichanl gateway is not currently running.');
    dim(`Setup will still configure your tools, but validation will fail until you run \`unichanl start\`.`);
  }

  console.log('');
  section('Configuring');

  for (const pick of answers.picks) {
    const integ = integrations.find((i) => i.name === pick)!;
    console.log('');
    info(`> ${integ.displayName}`);
    try {
      const backup = await integ.backupConfiguration();
      if (backup) ok(`Backup created at ${backup.backupPath}`);
      else dim('  (no pre-existing config to back up)');

      const cfgResult = await integ.configureGateway(gatewayUrl, localKey);
      if (cfgResult.ok) ok(cfgResult.message);
      else {
        fail(cfgResult.message);
        continue;
      }

      const val = await integ.validate(gatewayUrl, localKey);
      if (val.ok) ok(`Connection validated: ${val.message}`);
      else warn(`Validation warning: ${val.message}`);

      updateIntegration(integ.name, { enabled: true, configuredAt: new Date().toISOString() });
    } catch (err) {
      fail(`Failed to configure ${integ.displayName}: ${(err as Error).message}`);
    }
  }

  console.log('');
  ok('Setup complete.');
  info('');
  info(`  Gateway address:  ${gatewayUrl}`);
  info(`  Routing:          ${cfg.routing.default}`);
  info('');
  dim('If the gateway was not running, start it now with `unichanl start`.');
}
