import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { configPath } from './paths.js';

export interface AnthropicProviderConfig {
  enabled: boolean;
  model: string;
  timeoutMs: number;
}

export interface ProvidersConfig {
  anthropic: AnthropicProviderConfig;
}

export interface UnichanlConfig {
  gateway: {
    host: string;
    port: number;
  };
  routing: {
    default: string;
  };
  providers: ProvidersConfig;
  integrations: Record<string, { enabled: boolean; configuredAt?: string }>;
}

const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-5';

function defaultConfig(): UnichanlConfig {
  return {
    gateway: { host: '127.0.0.1', port: 20128 },
    routing: { default: 'unichanl-auto' },
    providers: {
      anthropic: {
        enabled: true,
        model: process.env.ANTHROPIC_MODEL ?? DEFAULT_ANTHROPIC_MODEL,
        timeoutMs: 60_000,
      },
    },
    integrations: {},
  };
}

export function loadConfig(): UnichanlConfig {
  const file = configPath();
  const defaults = defaultConfig();
  if (!existsSync(file)) {
    saveConfig(defaults);
    return defaults;
  }
  try {
    const raw = readFileSync(file, 'utf8');
    const parsed = JSON.parse(raw) as Partial<UnichanlConfig>;
    const parsedAnthropic = parsed.providers?.anthropic ?? {};
    return {
      gateway: { ...defaults.gateway, ...(parsed.gateway ?? {}) },
      routing: { ...defaults.routing, ...(parsed.routing ?? {}) },
      providers: {
        anthropic: { ...defaults.providers.anthropic, ...parsedAnthropic },
      },
      integrations: { ...(parsed.integrations ?? {}) },
    };
  } catch {
    return defaults;
  }
}

export function saveConfig(cfg: UnichanlConfig): void {
  writeFileSync(configPath(), JSON.stringify(cfg, null, 2), 'utf8');
}

export function updateIntegration(
  name: string,
  patch: { enabled?: boolean; configuredAt?: string },
): void {
  const cfg = loadConfig();
  cfg.integrations[name] = { ...(cfg.integrations[name] ?? { enabled: false }), ...patch };
  saveConfig(cfg);
}

const REDACT_KEYS = /api[_-]?key|token|secret|password|authorization/i;

export function sanitizeForDisplay(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sanitizeForDisplay);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    if (REDACT_KEYS.test(k) && typeof v === 'string') {
      out[k] = v.length > 6 ? `${v.slice(0, 3)}***${v.slice(-3)}` : '***';
    } else {
      out[k] = sanitizeForDisplay(v);
    }
  }
  return out;
}

export function providerConfiguredStatus(): Record<string, boolean> {
  return {
    openrouter: !!process.env.OPENROUTER_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    google: !!process.env.GOOGLE_API_KEY,
  };
}
