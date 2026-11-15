import test from 'node:test';
import assert from 'node:assert/strict';
import { reserveAttempt, updateLedgerModel, AUTHORIZATION } from '../src/evaluation-budget.mjs';

function ledger() { return { authorization: AUTHORIZATION, max_usd: 1, max_attempts: 9, attempted_cases: [] }; }
test('evaluation reservations reject duplicates and survive restart through persisted ledger state', () => {
  const state = reserveAttempt(ledger(), 'H2');
  const restored = JSON.parse(JSON.stringify(state));
  assert.throws(() => reserveAttempt(restored, 'H2'), /already used/);
  assert.equal(reserveAttempt(restored, 'H1').attempted_cases.length, 2);
});
test('evaluation never allows a tenth paid attempt or a changed authorization', () => {
  const state = ledger();
  for (let i = 0; i < 9; i++) reserveAttempt(state, `case-${i}`);
  assert.throws(() => reserveAttempt(state, 'extra'), /limit reached/);
  assert.ok(state.reserved_upper_allowance_usd < 1);
  assert.throws(() => reserveAttempt({ ...ledger(), max_usd: 10 }, 'H2'), /does not match/);
});
test('switching to the eligible mini snapshot preserves prior paid attempts', () => {
  const migrated = updateLedgerModel({ ...ledger(), authorization: '2026-11-15-USD1-nine-NASA-cases-Terra', attempted_cases: ['H2'], reserved_upper_allowance_usd: 0.05 });
  assert.equal(migrated.authorization, AUTHORIZATION);
  assert.equal(migrated.selected_model, 'gpt-5.4-mini-2026-03-17');
  assert.equal(migrated.reserved_upper_allowance_usd, 0.05);
  assert.throws(() => reserveAttempt(migrated, 'H2'), /already used/);
});
