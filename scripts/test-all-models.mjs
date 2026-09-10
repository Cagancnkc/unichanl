#!/usr/bin/env node
// Comprehensive health test: ping every model in the unichanl.com catalog
// via its upstream (OpenRouter / NVIDIA) using keys from .env.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const OUT = join(HERE, 'model-test-results.json');
const CATALOG_BASE = process.env.CATALOG_BASE || 'https://unichanl.com/api/public/models';
const PAGE_SIZE = 200;
const CONCURRENCY = Number(process.env.CONCURRENCY || 5);
const TIMEOUT_MS = 30_000;

// Load .env manually (no dotenv dep).
try {
  const env = readFileSync(join(ROOT, '.env'), 'utf8');
  for (const line of env.split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const NVIDIA_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_BASE = process.env.NVIDIA_API_BASE || 'https://integrate.api.nvidia.com/v1';

if (!OPENROUTER_KEY) { console.error('! OPENROUTER_API_KEY missing'); process.exit(2); }
if (!NVIDIA_KEY) console.warn('! NVIDIA_API_KEY missing — nvidia models will be skipped');

async function withTimeout(p, ms, label) {
  return await Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms}ms ${label}`)), ms)),
  ]);
}

async function getCatalog() {
  const all = [];
  let page = 1, total = Infinity;
  while (all.length < total) {
    const url = `${CATALOG_BASE}?limit=${PAGE_SIZE}&page=${page}`;
    const r = await withTimeout(fetch(url), 15_000, `catalog p${page}`);
    if (!r.ok) throw new Error(`catalog ${r.status}`);
    const j = await r.json();
    const items = j.models || j.items || j.data || [];
    if (!items.length) break;
    all.push(...items);
    total = j.total ?? all.length;
    console.log(`  fetched page ${page}: ${items.length}  (running total ${all.length}/${total})`);
    page++;
  }
  return all;
}

// NVIDIA catalog IDs are already in NVIDIA's `owner/model` format — pass through.

async function pingOpenRouter(modelName) {
  const r = await withTimeout(fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${OPENROUTER_KEY}`,
      'content-type': 'application/json',
      'http-referer': 'https://unichanl.com',
      'x-title': 'Unichanl Model Health Test',
    },
    body: JSON.stringify({
      model: modelName,
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 4,
      temperature: 0,
    }),
  }), TIMEOUT_MS, modelName);
  return r;
}

async function pingNvidia(modelName) {
  const id = modelName;
  const r = await withTimeout(fetch(`${NVIDIA_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${NVIDIA_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: id,
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 4,
      temperature: 0,
    }),
  }), TIMEOUT_MS, modelName);
  return r;
}

async function testOne(m) {
  const modelName = m.modelName || m.id;
  const provider = (m.provider || '').toLowerCase();
  const started = Date.now();
  try {
    let r;
    if (provider === 'nvidia') {
      if (!NVIDIA_KEY) return { modelName, provider, ok: false, status: 0, latencyMs: 0, error: 'NVIDIA_API_KEY missing' };
      r = await pingNvidia(modelName);
    } else {
      // openrouter, anthropic, google → all go through OpenRouter (unichanl's routing)
      r = await pingOpenRouter(modelName);
    }
    const latencyMs = Date.now() - started;
    if (r.ok) {
      const j = await r.json().catch(() => ({}));
      const sample = j?.choices?.[0]?.message?.content ?? '';
      return { modelName, provider, ok: true, status: r.status, latencyMs, sample: String(sample).slice(0, 40) };
    }
    const body = await r.text().catch(() => '');
    return { modelName, provider, ok: false, status: r.status, latencyMs, error: body.slice(0, 250) };
  } catch (e) {
    return { modelName, provider, ok: false, status: 0, latencyMs: Date.now() - started, error: String(e.message || e).slice(0, 250) };
  }
}

async function pool(items, size, worker) {
  let i = 0, done = 0;
  const out = new Array(items.length);
  await Promise.all(Array.from({ length: size }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      const r = await worker(items[idx], idx);
      done++;
      out[idx] = r;
      const mark = r.ok ? 'OK  ' : 'FAIL';
      process.stdout.write(`[${String(done).padStart(3)}/${items.length}] ${mark} ${String(r.status).padStart(3)} ${String(r.latencyMs).padStart(5)}ms  ${r.modelName}\n`);
    }
  }));
  return out;
}

async function main() {
  console.log(`Fetching catalog (paginated): ${CATALOG_BASE}`);
  const catalog = await getCatalog();
  console.log(`Total models: ${catalog.length}. Concurrency=${CONCURRENCY}\n`);
  const results = await pool(catalog, CONCURRENCY, testOne);
  writeFileSync(OUT, JSON.stringify(results, null, 2));

  const byProv = new Map();
  for (const r of results) {
    const s = byProv.get(r.provider) || { ok: 0, fail: 0, total: 0 };
    s.total++; r.ok ? s.ok++ : s.fail++;
    byProv.set(r.provider, s);
  }
  console.log('\n=== Provider summary ===');
  for (const [p, s] of [...byProv.entries()].sort()) {
    console.log(`  ${p.padEnd(15)} ${s.ok}/${s.total} ok  (${s.fail} fail)`);
  }

  const failures = results.filter(r => !r.ok);
  const byErr = new Map();
  for (const f of failures) {
    const k = `${f.provider}  ${f.status}`;
    byErr.set(k, (byErr.get(k) || 0) + 1);
  }
  console.log(`\n=== Failure buckets (${failures.length}) ===`);
  for (const [k, n] of [...byErr.entries()].sort()) console.log(`  ${k.padEnd(25)} ${n}`);

  console.log(`\nFull results: ${OUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
