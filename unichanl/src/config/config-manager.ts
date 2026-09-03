import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { DEFAULT_CONFIG } from "./models.js";
import type { UnichanlConfig } from "../types/index.js";
import { logger } from "../utils/logger.js";

const ChainStepSchema = z.object({
  provider: z.enum(["anthropic", "openai", "google", "mock"]),
  model: z.string().min(1),
});

const ConfigSchema = z.object({
  gateway: z.object({
    host: z.string().min(1),
    port: z.number().int().positive(),
  }),
  routing: z.object({
    default: z.string().min(1),
  }),
  models: z.record(z.string(), z.array(ChainStepSchema).min(1)),
});

export function unichanlDir(): string {
  return join(homedir(), ".unichanl");
}

export function configPath(): string {
  return join(unichanlDir(), "config.json");
}

export function ensureUnichanlDir(): void {
  const dir = unichanlDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

let cached: UnichanlConfig | null = null;

export function loadConfig(): UnichanlConfig {
  if (cached) return cached;

  ensureUnichanlDir();
  const path = configPath();

  if (!existsSync(path)) {
    writeFileSync(path, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf8");
    logger.info({ path }, "Created default config");
    cached = applyEnvOverrides(DEFAULT_CONFIG);
    return cached;
  }

  try {
    const raw = readFileSync(path, "utf8");
    const parsed = ConfigSchema.parse(JSON.parse(raw));
    cached = applyEnvOverrides(parsed);
    return cached;
  } catch (err) {
    logger.error({ err, path }, "Failed to load config, using defaults");
    cached = applyEnvOverrides(DEFAULT_CONFIG);
    return cached;
  }
}

function applyEnvOverrides(cfg: UnichanlConfig): UnichanlConfig {
  const host = process.env.UNICHANL_HOST ?? cfg.gateway.host;
  const port = process.env.UNICHANL_PORT
    ? Number(process.env.UNICHANL_PORT)
    : cfg.gateway.port;
  return {
    ...cfg,
    gateway: { host, port },
  };
}

export function resetConfigCache(): void {
  cached = null;
}
