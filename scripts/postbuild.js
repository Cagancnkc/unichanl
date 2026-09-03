// Adds shebang + chmod +x to the compiled CLI entry so `npm link` produces a runnable binary.
import { readFileSync, writeFileSync, chmodSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const cliFile = resolve(here, '..', 'dist', 'cli', 'index.js');

if (!existsSync(cliFile)) {
  console.error(`[postbuild] CLI entry not found at ${cliFile} — did the build fail?`);
  process.exit(1);
}

const shebang = '#!/usr/bin/env node\n';
const contents = readFileSync(cliFile, 'utf8');
if (!contents.startsWith('#!')) {
  writeFileSync(cliFile, shebang + contents);
}

try {
  chmodSync(cliFile, 0o755);
} catch {
  // Windows: chmod is a no-op; npm-link will still produce a .cmd shim.
}
console.log('[postbuild] CLI entry prepared:', cliFile);
