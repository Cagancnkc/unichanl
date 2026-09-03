import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { runtimeFile } from '../config/paths.js';

export interface RuntimeInfo {
  pid: number;
  host: string;
  port: number;
  startedAt: string;
}

export function writeRuntime(info: RuntimeInfo): void {
  writeFileSync(runtimeFile(), JSON.stringify(info, null, 2), 'utf8');
}

export function readRuntime(): RuntimeInfo | null {
  const file = runtimeFile();
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as RuntimeInfo;
  } catch {
    return null;
  }
}

export function clearRuntime(): void {
  const file = runtimeFile();
  if (existsSync(file)) rmSync(file, { force: true });
}

export function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function isPortAvailable(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const srv = createServer();
    srv.once('error', () => resolve(false));
    srv.once('listening', () => {
      srv.close(() => resolve(true));
    });
    srv.listen(port, host);
  });
}
