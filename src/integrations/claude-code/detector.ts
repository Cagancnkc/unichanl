import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, platform } from 'node:os';
import type { DetectionResult } from '../integration.interface.js';
import { claudeSettingsPath } from './config.js';

function whichClaude(): string | undefined {
  const isWindows = platform() === 'win32';
  const cmd = isWindows ? 'where' : 'which';
  try {
    const out = execFileSync(cmd, ['claude'], { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    const first = out.split(/\r?\n/)[0]?.trim();
    return first || undefined;
  } catch {
    return undefined;
  }
}

function claudeVersion(binary: string): string | undefined {
  try {
    const out = execFileSync(binary, ['--version'], { stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000 })
      .toString()
      .trim();
    return out || undefined;
  } catch {
    return undefined;
  }
}

export async function detectClaudeCode(): Promise<DetectionResult> {
  const binaryPath = whichClaude();
  const configExists = existsSync(claudeSettingsPath()) || existsSync(join(homedir(), '.claude.json'));

  if (!binaryPath && !configExists) {
    return { installed: false, reason: 'Claude Code binary not found on PATH and no ~/.claude config exists.' };
  }

  return {
    installed: true,
    binaryPath,
    configPath: claudeSettingsPath(),
    version: binaryPath ? claudeVersion(binaryPath) : undefined,
  };
}
