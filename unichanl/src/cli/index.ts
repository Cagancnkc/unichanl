#!/usr/bin/env node
import { cac } from "cac";
import { startCommand } from "./commands/start.js";
import { statusCommand } from "./commands/status.js";
import { configShowCommand } from "./commands/config.js";

const cli = cac("unichanl");

cli
  .command("start", "Start the local Unichanl gateway")
  .option("--host <host>", "Bind host (default 127.0.0.1)")
  .option("--port <port>", "Bind port (default 20128)")
  .action(async (opts: { host?: string; port?: string }) => {
    await startCommand({
      host: opts.host,
      port: opts.port ? Number(opts.port) : undefined,
    });
  });

cli
  .command("status", "Show gateway + provider status")
  .action(async () => {
    await statusCommand();
  });

cli
  .command("config show", "Print the current configuration")
  .action(() => {
    configShowCommand();
  });

cli.help();
cli.version("0.1.0");

cli.parse();

if (!cli.matchedCommand && process.argv.length <= 2) {
  cli.outputHelp();
}
