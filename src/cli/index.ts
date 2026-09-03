import 'dotenv/config';
import { Command } from 'commander';
import { startCommand } from './commands/start.js';
import { stopCommand } from './commands/stop.js';
import { statusCommand } from './commands/status.js';
import { setupCommand } from './commands/setup.js';
import { doctorCommand } from './commands/doctor.js';
import { loginCommand, logoutCommand } from './commands/login.js';
import { configShowCommand } from './commands/config.js';
import { disconnectCommand } from './commands/disconnect.js';

const program = new Command();

program
  .name('unichanl')
  .description('Unichanl — local AI gateway and routing layer for developers')
  .version('0.1.0');

program
  .command('start')
  .description('Start the Unichanl local gateway (foreground)')
  .option('--host <host>', 'Bind host (default 127.0.0.1)')
  .option('--port <port>', 'Bind port (default 20128)', (v) => parseInt(v, 10))
  .action(async (opts: { host?: string; port?: number }) => {
    await startCommand(opts);
  });

program
  .command('stop')
  .description('Stop a running Unichanl gateway')
  .action(async () => {
    await stopCommand();
  });

program
  .command('status')
  .description('Show gateway + provider + tool status')
  .action(async () => {
    await statusCommand();
  });

program
  .command('setup')
  .description('Detect installed AI coding tools and configure them to use the local gateway')
  .action(async () => {
    await setupCommand();
  });

program
  .command('doctor')
  .description('Diagnose installation problems')
  .action(async () => {
    await doctorCommand();
  });

program
  .command('login')
  .description('Log in to Unichanl (local dev mode in this release)')
  .action(async () => {
    await loginCommand();
  });

program
  .command('logout')
  .description('Log out of Unichanl')
  .action(async () => {
    await logoutCommand();
  });

const config = program.command('config').description('Manage local Unichanl configuration');
config
  .command('show')
  .description('Show sanitized local configuration')
  .action(async () => {
    await configShowCommand();
  });

program
  .command('disconnect <tool>')
  .description('Restore a tool\'s original configuration and remove Unichanl-managed keys')
  .action(async (tool: string) => {
    await disconnectCommand(tool);
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  const msg = err instanceof Error ? err.stack ?? err.message : String(err);
  console.error(msg);
  process.exit(1);
});
