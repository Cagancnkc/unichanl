import { copyFileSync, existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { backupsDir } from '../config/paths.js';

export interface BackupMetadata {
  tool: string;
  originalPath: string;
  backupPath: string;
  timestamp: string;
}

function isoStamp(): string {
  return new Date().toISOString().replace(/:/g, '-').replace(/\..+$/, '');
}

export function backupFile(originalPath: string, tool: string): BackupMetadata | null {
  if (!existsSync(originalPath)) return null;
  const stamp = isoStamp();
  const dir = join(backupsDir(tool), stamp);
  mkdirSync(dir, { recursive: true });
  const backupPath = join(dir, basename(originalPath));
  copyFileSync(originalPath, backupPath);
  const meta: BackupMetadata = {
    tool,
    originalPath,
    backupPath,
    timestamp: stamp,
  };
  writeFileSync(join(dir, 'metadata.json'), JSON.stringify(meta, null, 2), 'utf8');
  return meta;
}

export function latestBackup(tool: string): BackupMetadata | null {
  const dir = backupsDir(tool);
  if (!existsSync(dir)) return null;
  const entries = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
    .reverse();
  for (const name of entries) {
    const metaFile = join(dir, name, 'metadata.json');
    if (existsSync(metaFile)) {
      try {
        return JSON.parse(readFileSync(metaFile, 'utf8')) as BackupMetadata;
      } catch {
        continue;
      }
    }
  }
  return null;
}

export function restoreLatest(tool: string): BackupMetadata | null {
  const meta = latestBackup(tool);
  if (!meta) return null;
  if (!existsSync(meta.backupPath)) return null;
  copyFileSync(meta.backupPath, meta.originalPath);
  return meta;
}
