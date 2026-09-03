import { loadConfig, configPath } from "../../config/config-manager.js";

export function configShowCommand(): void {
  const cfg = loadConfig();
  process.stdout.write(`# ${configPath()}\n${JSON.stringify(cfg, null, 2)}\n`);
}
