import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';

const ROOT = join(homedir(), '.unichanl');

function ensure(dir: string): string {
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function rootDir(): string {
  return ensure(ROOT);
}

export function configPath(): string {
  return join(rootDir(), 'config.json');
}

export function runtimeFile(): string {
  return join(rootDir(), 'runtime.json');
}

export function logsDir(): string {
  return ensure(join(rootDir(), 'logs'));
}

export function gatewayLogFile(): string {
  return join(logsDir(), 'gateway.log');
}

export function backupsDir(tool?: string): string {
  const base = ensure(join(rootDir(), 'backups'));
  return tool ? ensure(join(base, tool)) : base;
}

export function authDir(): string {
  return ensure(join(rootDir(), 'auth'));
}

export function tokenFile(): string {
  return join(authDir(), 'token');
}

export function localApiKeyFile(): string {
  return join(rootDir(), 'local-api-key');
}

export function registryFile(): string {
  return join(rootDir(), 'registry.json');
}

export function healthFile(): string {
  return join(rootDir(), 'health.json');
}

export function sessionsDir(): string {
  return ensure(join(rootDir(), 'sessions'));
}

export function sessionFile(id: string): string {
  return join(sessionsDir(), `${id}.json`);
}

export function usageDir(): string {
  return ensure(join(rootDir(), 'usage'));
}

export function usageFile(dateYmd: string): string {
  return join(usageDir(), `${dateYmd}.jsonl`);
}

export function memoryDir(): string {
  return ensure(join(rootDir(), 'memory'));
}

export function memoryFile(project: string): string {
  return join(memoryDir(), `${project}.json`);
}

export function providerKeyFile(providerName: string): string {
  return join(authDir(), `${providerName}.key`);
}
