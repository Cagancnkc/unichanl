import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withinBackoff } from '../src/services/autoRechargeScanner.js';

test('withinBackoff returns false when never attempted', () => {
  assert.equal(withinBackoff(null), false);
  assert.equal(withinBackoff(undefined), false);
});

test('withinBackoff returns true within the backoff window', () => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  assert.equal(withinBackoff(oneHourAgo, 6), true);
});

test('withinBackoff returns false past the backoff window', () => {
  const sevenHoursAgo = new Date(Date.now() - 7 * 60 * 60 * 1000);
  assert.equal(withinBackoff(sevenHoursAgo, 6), false);
});

test('withinBackoff honours custom backoff hours', () => {
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
  assert.equal(withinBackoff(thirtyMinsAgo, 0.25), false); // 15 min backoff, 30 min old → expired
  assert.equal(withinBackoff(thirtyMinsAgo, 1), true);
});
