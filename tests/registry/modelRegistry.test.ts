import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.HOME = mkdtempSync(join(tmpdir(), 'unichanl-test-'));
process.env.USERPROFILE = process.env.HOME;

const { ModelRegistry } = await import('../../src/registry/modelRegistry.js');
const { seedModels } = await import('../../src/registry/seed.js');
const { registryFile } = await import('../../src/config/paths.js');

test('seed loads models and list returns them', () => {
  const reg = new ModelRegistry();
  reg.seed(seedModels());
  const all = reg.list();
  assert.ok(all.length >= 10);
  assert.ok(all.every((m) => m.health !== undefined));
});

test('filter by anthropicCompat returns only anthropic-compat models', () => {
  const reg = new ModelRegistry();
  reg.seed(seedModels());
  const compat = reg.filter({ anthropicCompat: true });
  assert.ok(compat.length >= 1);
  assert.ok(compat.every((m) => m.capabilities.anthropicCompat));
});

test('filter by tag=code returns tagged models', () => {
  const reg = new ModelRegistry();
  reg.seed(seedModels());
  const code = reg.filter({ tag: 'code' });
  assert.ok(code.length >= 1);
  assert.ok(code.every((m) => m.tags.includes('code')));
});

test('setEnabled persists override; second seed applies it', () => {
  rmSync(registryFile(), { force: true });
  const reg1 = new ModelRegistry();
  reg1.seed(seedModels());
  const first = reg1.list()[0].id;
  reg1.setEnabled(first, false);
  assert.ok(existsSync(registryFile()));
  const raw = JSON.parse(readFileSync(registryFile(), 'utf8'));
  assert.equal(raw.enabled[first], false);

  const reg2 = new ModelRegistry();
  reg2.seed(seedModels());
  assert.equal(reg2.get(first)?.enabled, false);
});

test('setState persists availability override', () => {
  rmSync(registryFile(), { force: true });
  const reg = new ModelRegistry();
  reg.seed(seedModels());
  const id = reg.list()[0].id;
  reg.setState(id, 'UNAVAILABLE');
  const reg2 = new ModelRegistry();
  reg2.seed(seedModels());
  assert.equal(reg2.get(id)?.availability, 'UNAVAILABLE');
});

test('snapshot returns immutable clones', () => {
  const reg = new ModelRegistry();
  reg.seed(seedModels());
  const snap = reg.snapshot();
  snap[0].enabled = false;
  assert.notEqual(reg.list()[0].enabled, snap[0].enabled);
});

test('corrupt overrides file is ignored', async () => {
  const { writeFileSync } = await import('node:fs');
  writeFileSync(registryFile(), '{not json', 'utf8');
  const reg = new ModelRegistry();
  reg.seed(seedModels());
  assert.ok(reg.list().length >= 10);
});
