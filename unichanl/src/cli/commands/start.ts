import "dotenv/config";
import { loadConfig } from "../../config/config-manager.js";
import { AnthropicProvider } from "../../providers/anthropic/anthropic.provider.js";
import { OpenAIProvider } from "../../providers/openai/openai.provider.js";
import { GoogleProvider } from "../../providers/google/google.provider.js";
import type { Provider } from "../../types/index.js";
import { startServer } from "../../server/server.js";
import { getDb, closeDb } from "../../database/database.js";
import { logger } from "../../utils/logger.js";

export async function startCommand(opts: {
  host?: string;
  port?: number;
}): Promise<void> {
  const cfg = loadConfig();
  const host = opts.host ?? cfg.gateway.host;
  const port = opts.port ?? cfg.gateway.port;

  getDb();

  const providers: Provider[] = [
    new AnthropicProvider(),
    new OpenAIProvider(),
    new GoogleProvider(),
  ];

  printBanner(host, port, providers);

  const app = await startServer({ providers, host, port });

  const shutdown = async (sig: string) => {
    logger.info({ sig }, "shutting down");
    try {
      await app.close();
      closeDb();
    } finally {
      process.exit(0);
    }
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

function printBanner(host: string, port: number, providers: Provider[]): void {
  const lines = [
    "",
    "  UNICHANL — local AI gateway",
    "  Your model can change. Your work doesn't have to.",
    "",
    `  Gateway     http://${host}:${port}`,
    `  OpenAI-compat endpoint  POST /v1/chat/completions`,
    "",
    "  Providers",
  ];
  for (const p of providers) {
    lines.push(
      `    ${p.name.padEnd(12)} ${p.isAvailable() ? "CONFIGURED" : "NOT CONFIGURED"}`
    );
  }
  lines.push("");
  process.stdout.write(lines.join("\n") + "\n");
}
