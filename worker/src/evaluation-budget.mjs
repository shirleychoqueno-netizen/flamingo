import {PROMO_INITIAL_MODEL} from './openai.mjs';
export const AUTHORIZATION = '2026-11-15-USD1-nine-NASA-cases';
const LEGACY_AUTHORIZATION='2026-11-15-USD1-nine-NASA-cases-Terra';
const RESERVE_PER_ATTEMPT=0.05;
export function reserveAttempt(ledger, caseId) {
  if (ledger.authorization !== AUTHORIZATION || ledger.max_usd !== 1 || ledger.max_attempts !== 9 || !Array.isArray(ledger.attempted_cases)) throw new Error('Evaluation ledger does not match the user authorization.');
  if (ledger.attempted_cases.includes(caseId)) throw new Error('This case already used its approved model attempt.');
  if (ledger.attempted_cases.length >= 9 || (ledger.attempted_cases.length + 1) * RESERVE_PER_ATTEMPT > 1) throw new Error('Approved evaluation limit reached.');
  ledger.attempted_cases.push(caseId);
  ledger.reserved_upper_allowance_usd = ledger.attempted_cases.length * RESERVE_PER_ATTEMPT;
  return ledger;
}
export function updateLedgerModel(ledger) {
  if (ledger.authorization === LEGACY_AUTHORIZATION) ledger = { ...ledger, authorization: AUTHORIZATION };
  return { ...ledger, selected_model: PROMO_INITIAL_MODEL };
}
