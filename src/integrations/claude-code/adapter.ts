import { existsSync } from 'node:fs';
import type {
  BackupResult,
  CanConfigureResult,
  ConfigurationResult,
  ToolConfigurationSnapshot,
  ToolIntegration,
  ValidationResult,
  DetectionResult,
} from '../integration.interface.js';
import { detectClaudeCode } from './detector.js';
import { claudeSettingsPath, readClaudeSettings, writeClaudeSettings, UNICHANL_MARKER_KEY } from './config.js';
import { backupFile, restoreLatest } from '../../utils/backup.js';

const TOOL = 'claude-code';

// Claude Code respects env vars declared under `env` in ~/.claude/settings.json.
// Setting ANTHROPIC_BASE_URL redirects all API traffic to a custom endpoint.
// Setting ANTHROPIC_AUTH_TOKEN provides the Authorization header value.
// This is the officially documented mechanism.
const KEYS_WE_MANAGE = ['ANTHROPIC_BASE_URL', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_MODEL'];

export class ClaudeCodeIntegration implements ToolIntegration {
  readonly name = TOOL;
  readonly displayName = 'Claude Code';

  async detect(): Promise<DetectionResult> {
    return detectClaudeCode();
  }

  async getConfiguration(): Promise<ToolConfigurationSnapshot | null> {
    const p = claudeSettingsPath();
    if (!existsSync(p)) {
      return { raw: {}, configPath: p, isConfiguredForUnichanl: false };
    }
    const raw = readClaudeSettings();
    const env = (raw.env ?? {}) as Record<string, string>;
    const isConfiguredForUnichanl =
      typeof env.ANTHROPIC_BASE_URL === 'string' && env.ANTHROPIC_BASE_URL.includes('127.0.0.1');
    return { raw, configPath: p, isConfiguredForUnichanl };
  }

  async canConfigureGateway(): Promise<CanConfigureResult> {
    return { supported: true };
  }

  async backupConfiguration(): Promise<BackupResult | null> {
    const meta = backupFile(claudeSettingsPath(), TOOL);
    return meta
      ? { backupPath: meta.backupPath, originalPath: meta.originalPath, timestamp: meta.timestamp }
      : null;
  }

  async configureGateway(gatewayUrl: string, localApiKey: string): Promise<ConfigurationResult> {
    const settings = readClaudeSettings();
    const env = (settings.env as Record<string, unknown> | undefined) ?? {};

    // Preserve unrelated env entries the user may have set.
    const next: Record<string, unknown> = { ...env };
    next.ANTHROPIC_BASE_URL = gatewayUrl;
    next.ANTHROPIC_AUTH_TOKEN = localApiKey;

    settings.env = next;
    settings[UNICHANL_MARKER_KEY] = {
      configuredAt: new Date().toISOString(),
      gatewayUrl,
      managedKeys: KEYS_WE_MANAGE,
    };

    writeClaudeSettings(settings);
    return {
      ok: true,
      message: `Wrote ANTHROPIC_BASE_URL to ${claudeSettingsPath()}`,
      writtenPath: claudeSettingsPath(),
    };
  }

  async validate(gatewayUrl: string, localApiKey: string): Promise<ValidationResult> {
    // Send a real Anthropic-shape request through the gateway.
    try {
      const res = await fetch(`${gatewayUrl.replace(/\/$/, '')}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': localApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet',
          max_tokens: 8,
          messages: [{ role: 'user', content: 'ping' }],
        }),
      });
      if (res.status === 200 || res.status === 502 || res.status === 503) {
        // 502/503 mean gateway reached upstream but upstream unavailable — still counts as
        // "Claude Code → gateway wiring works". We only need to prove the local hop.
        return { ok: true, message: `Gateway reachable (HTTP ${res.status}).` };
      }
      if (res.status === 401 || res.status === 403) {
        return { ok: false, message: `Gateway rejected the local API key (HTTP ${res.status}).` };
      }
      return { ok: false, message: `Gateway returned HTTP ${res.status}.` };
    } catch (err) {
      return { ok: false, message: `Cannot reach gateway at ${gatewayUrl}: ${(err as Error).message}` };
    }
  }

  async uninstall(): Promise<ConfigurationResult> {
    const restored = restoreLatest(TOOL);
    if (restored) {
      // Also strip the marker if the restored file still had it (older backup)
      const settings = readClaudeSettings();
      let mutated = false;
      if (UNICHANL_MARKER_KEY in settings) {
        delete settings[UNICHANL_MARKER_KEY];
        mutated = true;
      }
      if (mutated) writeClaudeSettings(settings);
      return { ok: true, message: `Restored ${restored.originalPath} from ${restored.backupPath}.` };
    }

    // No backup available — do a surgical removal of only the keys we manage.
    const settings = readClaudeSettings();
    const env = (settings.env as Record<string, unknown> | undefined) ?? {};
    let mutated = false;
    for (const k of KEYS_WE_MANAGE) {
      if (k in env) {
        delete env[k];
        mutated = true;
      }
    }
    if (Object.keys(env).length === 0) {
      delete settings.env;
    } else {
      settings.env = env;
    }
    if (UNICHANL_MARKER_KEY in settings) {
      delete settings[UNICHANL_MARKER_KEY];
      mutated = true;
    }
    if (mutated) writeClaudeSettings(settings);
    return {
      ok: true,
      message: mutated
        ? 'Removed Unichanl-managed keys from Claude Code settings (no backup was available).'
        : 'Nothing to remove — Claude Code was not configured for Unichanl.',
    };
  }
}

export const claudeCodeIntegration = new ClaudeCodeIntegration();
