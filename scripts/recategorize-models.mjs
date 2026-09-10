#!/usr/bin/env node
// Recompute capabilityTags for every enabled model:
//   - exactly ONE primary category: reasoning | code | vision | fast | general
//   - optional badges: sınırsız (free), cheap, long-context
// Drops the useless 'chat' tag and renames 'free' -> 'sınırsız'.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const DRY = process.argv.includes('--dry-run');

try {
  const env = readFileSync(join(ROOT, '.env'), 'utf8');
  for (const line of env.split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

function categorize(m) {
  const haystack = `${m.modelName} ${m.displayName ?? ''} ${m.description ?? ''}`.toLowerCase();
  const meta = m.upstreamMetadata || {};
  const isVisionByModality = Array.isArray(meta?.architecture?.input_modalities)
    && meta.architecture.input_modalities.includes('image');

  let primary = 'general';
  if (/reason|thinking|o1|r1|reflection|nemotron.*70/.test(haystack)) primary = 'reasoning';
  else if (/code|coder|codestral/.test(haystack)) primary = 'code';
  else if (/vision|multimodal|vlm|image/.test(haystack) || isVisionByModality) primary = 'vision';
  else if (/flash|mini|haiku|nano|8b|7b|small|instant|turbo/.test(haystack)) primary = 'fast';

  const tags = new Set([primary]);
  const cost = Number(m.inputCostPer1k ?? 0);
  if (cost === 0) tags.add('sınırsız');
  else if (cost < 0.0005) tags.add('cheap');
  if ((m.contextWindow ?? 0) >= 200_000) tags.add('long-context');
  return [...tags];
}

const prisma = new PrismaClient();
try {
  const models = await prisma.model.findMany({
    where: { enabled: true },
    select: {
      id: true, modelName: true, displayName: true, description: true,
      contextWindow: true, inputCostPer1k: true, upstreamMetadata: true, capabilityTags: true,
    },
  });

  const dist = {};
  const changes = [];
  for (const m of models) {
    const next = categorize(m);
    for (const t of next) dist[t] = (dist[t] || 0) + 1;
    const prev = [...(m.capabilityTags || [])].sort().join(',');
    const now = [...next].sort().join(',');
    if (prev !== now) changes.push({ id: m.id, name: m.modelName, prev, now, tags: next });
  }

  console.log(`Scanned: ${models.length}  Would-change: ${changes.length}`);
  console.log('\nTag distribution:');
  for (const [t, n] of Object.entries(dist).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t.padEnd(14)} ${n}`);
  }

  if (DRY) {
    console.log('\nSample changes (first 8):');
    for (const c of changes.slice(0, 8)) console.log(`  ${c.name}\n    - ${c.prev}\n    + ${c.now}`);
  } else {

  let updated = 0;
  for (const c of changes) {
    await prisma.model.update({ where: { id: c.id }, data: { capabilityTags: c.tags } });
    updated++;
  }
  console.log(`\nApplied: updated=${updated}`);
  }
} finally {
  await prisma.$disconnect();
}
