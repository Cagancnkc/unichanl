import { execFileSync } from 'node:child_process';
import { platform } from 'node:os';
import type {
  BackupResult,
  CanConfigureResult,
  ConfigurationResult,
  DetectionResult,
  ToolConfigurationSnapshot,
  ToolIntegration,
  ValidationResult,
} from '../integration.interface.js';

// SCAFFOLD ONLY. The OpenAI Codex CLI supports OPENAI_BASE_URL, but the exact
// config file layout and streaming compatibility with our OpenAI-compat endpoint
// have not been verified end-to-end in this milestone. Do not fake support.

function whichCodex(): string | undefined {
  const isWindows = platform() === 'win32';
  const cmd = isWindows ? 'where' : 'which';
  try {
    const out = execFileSync(cmd, ['codex'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    return out.split(/\r?\n/)[0]?.trim() || undefined;
  } catch {
    return undefined;
  }
}

export class CodexIntegration implements ToolIntegration {
  readonly name = 'codex';
  readonly displayName = 'Codex CLI';

  async detect(): Promise<DetectionResult> {
    const bin = whichCodex();
    return bin
      ? { installed: true, binaryPath: bin }
      : { installed: false, reason: 'codex binary not found on PATH.' };
  }

  async getConfiguration(): Promise<ToolConfigurationSnapshot | null> {
    return null;
  }

  async canConfigureGateway(): Promise<CanConfigureResult> {
    return {
      supported: false,
      reason:
        'Codex adapter is scaffolded but not yet verified end-to-end. Enable in a follow-up after testing OPENAI_BASE_URL wiring against the /v1/chat/completions endpoint.',
    };
  }

  async backupConfiguration(): Promise<BackupResult | null> {
    return null;
  }

  async configureGateway(): Promise<ConfigurationResult> {
    return {
      ok: false,
      message:
        'Codex integration not yet verified. `unichanl setup` will skip this tool until the adapter is validated.',
    };
  }

  async validate(): Promise<ValidationResult> {
    return { ok: false, message: 'Codex adapter not yet verified.' };
  }

  async uninstall(): Promise<ConfigurationResult> {
    return { ok: true, message: 'Nothing to uninstall — Codex adapter never wrote configuration.' };
  }
}

export const codexIntegration = new CodexIntegration();
