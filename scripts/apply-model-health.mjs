#!/usr/bin/env node
// Reads scripts/model-test-results.json and updates DB:
//   404/400/403 -> enabled=false, isPublic=false, healthStatus='unavailable'
//   200         -> healthStatus='healthy', syncedAt=now()
//   429/5xx/0   -> untouched (transient)
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const IN = join(HERE, 'model-test-results.json');
const DRY = process.argv.includes('--dry-run');

try {
  const env = readFileSync(join(ROOT, '.env'), 'utf8');
  for (const line of env.split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const results = JSON.parse(readFileSync(IN, 'utf8'));
const disableStatuses = new Set([400, 403, 404]);

const toDisable = [];
const toHeal = [];
const skipped = [];
for (const r of results) {
  if (r.ok) toHeal.push(r.modelName);
  else if (disableStatuses.has(r.status)) toDisable.push({ name: r.modelName, status: r.status, provider: r.provider });
  else skipped.push({ name: r.modelName, status: r.status, error: (r.error || '').slice(0, 60) });
}

console.log(`Disable: ${toDisable.length}  Heal: ${toHeal.length}  Skip (transient): ${skipped.length}`);

const byProv = new Map();
for (const d of toDisable) {
  const s = byProv.get(d.provider) || { 400: 0, 403: 0, 404: 0 };
  s[d.status]++;
  byProv.set(d.provider, s);
}
console.log('\nDisable breakdown by provider:');
for (const [p, s] of [...byProv.entries()].sort()) {
  console.log(`  ${p.padEnd(12)} 400=${s[400]}  403=${s[403]}  404=${s[404]}`);
}

if (DRY) {
  console.log('\n--dry-run: no writes performed.');
  console.log('Sample disables:', toDisable.slice(0, 10).map((d) => `${d.status} ${d.name}`).join('\n  '));
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error('\n! DATABASE_URL missing in .env — cannot write.');
  process.exit(2);
}

const prisma = new PrismaClient();
try {
  let disabled = 0;
  for (const d of toDisable) {
    const r = await prisma.model.updateMany({
      where: { modelName: d.name },
      data: { enabled: false, isPublic: false, healthStatus: 'unavailable' },
    });
    disabled += r.count;
  }
  let healed = 0;
  const now = new Date();
  for (const name of toHeal) {
    const r = await prisma.model.updateMany({
      where: { modelName: name },
      data: { healthStatus: 'healthy', syncedAt: now },
    });
    healed += r.count;
  }
  console.log(`\nApplied: disabled=${disabled}  healed=${healed}`);
} finally {
  await prisma.$disconnect();
}
