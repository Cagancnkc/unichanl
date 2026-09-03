import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.HOME = mkdtempSync(join(tmpdir(), 'unichanl-cred-'));
process.env.USERPROFILE = process.env.HOME;
delete process.env.NVIDIA_API_KEY;
delete process.env.OPENROUTER_API_KEY;

const { getKey, setKey, hasKey } = await import('../../src/security/credentials.js');
const { providerKeyFile } = await import('../../src/config/paths.js');

test('env var wins over file', () => {
  process.env.NVIDIA_API_KEY = 'from-env';
  setKey('nvidia', 'from-file');
  assert.equal(getKey('nvidia'), 'from-env');
  delete process.env.NVIDIA_API_KEY;
  rmSync(providerKeyFile('nvidia'), { force: true });
});

test('file used when env missing', () => {
  setKey('openrouter', 'file-key-123');
  assert.equal(getKey('openrouter'), 'file-key-123');
  assert.equal(hasKey('openrouter'), true);
  rmSync(providerKeyFile('openrouter'), { force: true });
});

test('missing key returns undefined', () => {
  assert.equal(getKey('nvidia'), undefined);
  assert.equal(hasKey('nvidia'), false);
});

test('empty env falls through to file', () => {
  process.env.NVIDIA_API_KEY = '   ';
  setKey('nvidia', 'real-file-key');
  assert.equal(getKey('nvidia'), 'real-file-key');
  delete process.env.NVIDIA_API_KEY;
  rmSync(providerKeyFile('nvidia'), { force: true });
});
