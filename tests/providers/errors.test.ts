import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyError, CategorizedProviderError } from '../../src/providers/errors.js';

test('401 → AUTH', () => {
  const e = classifyError({ status: 401, message: 'invalid key' }, 'nvidia');
  assert.equal(e.category, 'AUTH');
  assert.equal(e.providerName, 'nvidia');
});

test('403 → AUTH', () => {
  assert.equal(classifyError({ status: 403 }, 'openrouter').category, 'AUTH');
});

test('400/404/422 → INVALID_REQUEST', () => {
  for (const s of [400, 404, 422]) {
    assert.equal(classifyError({ status: s }, 'nvidia').category, 'INVALID_REQUEST');
  }
});

test('429 with quota message → QUOTA', () => {
  assert.equal(
    classifyError({ status: 429, message: 'quota exceeded' }, 'openrouter').category,
    'QUOTA',
  );
});

test('429 plain → RATE_LIMIT', () => {
  assert.equal(classifyError({ status: 429, message: 'slow down' }, 'nvidia').category, 'RATE_LIMIT');
});

test('402 → QUOTA', () => {
  assert.equal(classifyError({ status: 402 }, 'openrouter').category, 'QUOTA');
});

test('408/504 → TIMEOUT', () => {
  assert.equal(classifyError({ status: 408 }, 'nvidia').category, 'TIMEOUT');
  assert.equal(classifyError({ status: 504 }, 'nvidia').category, 'TIMEOUT');
});

test('503 → PROVIDER_UNAVAILABLE', () => {
  assert.equal(classifyError({ status: 503 }, 'nvidia').category, 'PROVIDER_UNAVAILABLE');
});

test('500/502 → PROVIDER_SERVER_ERROR', () => {
  assert.equal(classifyError({ status: 500 }, 'nvidia').category, 'PROVIDER_SERVER_ERROR');
  assert.equal(classifyError({ status: 502 }, 'nvidia').category, 'PROVIDER_SERVER_ERROR');
});

test('AbortError → CANCELLED', () => {
  assert.equal(classifyError({ name: 'AbortError' }, 'nvidia').category, 'CANCELLED');
});

test('ECONNRESET → NETWORK', () => {
  assert.equal(classifyError({ code: 'ECONNRESET' }, 'nvidia').category, 'NETWORK');
});

test('ETIMEDOUT → TIMEOUT', () => {
  assert.equal(classifyError({ code: 'ETIMEDOUT' }, 'nvidia').category, 'TIMEOUT');
});

test('unknown shape → UNKNOWN', () => {
  assert.equal(classifyError('weird thing', 'nvidia').category, 'UNKNOWN');
});

test('already-categorized error passes through', () => {
  const orig = new CategorizedProviderError('AUTH', 'nvidia', 401, 'x');
  assert.equal(classifyError(orig, 'openrouter'), orig);
});
