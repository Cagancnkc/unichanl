import { existsSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import type {
  BackupResult,
  CanConfigureResult,
  ConfigurationResult,
  DetectionResult,
  ToolConfigurationSnapshot,
  ToolIntegration,
  ValidationResult,
} from '../integration.interface.js';

// SCAFFOLD ONLY. OpenCode supports custom providers via its config, but the JSON
// schema and provider entry format need to be verified against a live install.

function whichOpencode(): string | undefined {
  const isWindows = platform() === 'win32';
  const cmd = isWindows ? 'where' : 'which';
  try {
    const out = execFileSync(cmd, ['opencode'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    return out.split(/\r?\n/)[0]?.trim() || undefined;
  } catch {
    return undefined;
  }
}

export class OpenCodeIntegration implements ToolIntegration {
  readonly name = 'opencode';
  readonly displayName = 'OpenCode';

  async detect(): Promise<DetectionResult> {
    const bin = whichOpencode();
    const configFile = join(homedir(), '.config', 'opencode', 'config.json');
    if (bin || existsSync(configFile)) {
      return { installed: true, binaryPath: bin, configPath: existsSync(configFile) ? configFile : undefined };
    }
    return { installed: false, reason: 'opencode binary not on PATH and no ~/.config/opencode/config.json.' };
  }

  async getConfiguration(): Promise<ToolConfigurationSnapshot | null> {
    return null;
  }

  async canConfigureGateway(): Promise<CanConfigureResult> {
    return {
      supported: false,
      reason: 'OpenCode adapter is scaffolded but not yet verified end-to-end.',
    };
  }

  async backupConfiguration(): Promise<BackupResult | null> {
    return null;
  }

  async configureGateway(): Promise<ConfigurationResult> {
    return { ok: false, message: 'OpenCode integration not yet verified.' };
  }

  async validate(): Promise<ValidationResult> {
    return { ok: false, message: 'OpenCode adapter not yet verified.' };
  }

  async uninstall(): Promise<ConfigurationResult> {
    return { ok: true, message: 'Nothing to uninstall — OpenCode adapter never wrote configuration.' };
  }
}

export const openCodeIntegration = new OpenCodeIntegration();
