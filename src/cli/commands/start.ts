import 'dotenv/config';
import { startGateway } from '../../gateway/lifecycle.js';
import { loadConfig } from '../../config/config-manager.js';
import { writeRuntime, clearRuntime, isPortAvailable } from '../../utils/process.js';
import { ensureLocalApiKey } from '../../integrations/local-api-key.js';
import { banner, ok, fail, info, dim } from '../ui/output.js';

export interface StartOpts {
  host?: string;
  port?: number;
}

export async function startCommand(opts: StartOpts = {}): Promise<void> {
  const cfg = loadConfig();
  const host = opts.host ?? cfg.gateway.host;
  const port = opts.port ?? cfg.gateway.port;

  banner();

  const available = await isPortAvailable(port, host);
  if (!available) {
    fail(`Port ${port} on ${host} is already in use.`);
    dim('Another `unichanl start` may already be running. Try `unichanl status` or `unichanl stop`.');
    process.exit(1);
  }

  ensureLocalApiKey();

  const gateway = await startGateway({ host, port });

  writeRuntime({
    pid: process.pid,
    host,
    port,
    startedAt: new Date().toISOString(),
  });

  ok('Gateway running');
  info('');
  info(`  Address:   http://${host}:${port}`);
  info(`  Routing:   ${cfg.routing.default}`);
  info(`  Providers: ${process.env.OPENROUTER_API_KEY ? 'OpenRouter (configured)' : 'none (set OPENROUTER_API_KEY)'}`);
  info('');
  dim('Press Ctrl+C to stop.');

  const shutdown = async (signal: string) => {
    dim(`\nReceived ${signal}, stopping gateway...`);
    await gateway.stop();
    clearRuntime();
    ok('Stopped');
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}
