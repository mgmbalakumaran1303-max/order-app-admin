import { MOCK_LATENCY_MS } from '../config/env';
import { ApiError } from '../services/apiClient';
import { createSeed } from './data/seed';

// In-memory store used only in mock mode. Mutations made through the mock
// services live until the page is reloaded.

let db = createSeed();

// Developer controls exposed in the profile menu while in mock mode.
export const mockControls = {
  simulateErrors: false,
};

export function getDb() {
  return db;
}

export function resetMockDb(now) {
  db = createSeed(now);
  mockControls.simulateErrors = false;
}

const clone = (value) => (value === undefined ? value : JSON.parse(JSON.stringify(value)));

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Wraps a mock handler so it behaves like a network call: async, cloned
 * results (callers cannot mutate the store) and optional simulated failure.
 */
export async function respond(handler) {
  if (MOCK_LATENCY_MS > 0) await wait(MOCK_LATENCY_MS);
  if (mockControls.simulateErrors) {
    throw new ApiError('The service is temporarily unavailable (simulated failure).', { status: 503, code: 'SERVER' });
  }
  return clone(handler(db));
}

export function notFound(what) {
  return new ApiError(`${what} was not found.`, { status: 404, code: 'NOT_FOUND' });
}

export function forbidden() {
  return new ApiError('You do not have permission to perform this action.', { status: 403, code: 'FORBIDDEN' });
}

export function validationError(message, details) {
  return new ApiError(message, { status: 422, code: 'VALIDATION', details });
}

export function nowIso() {
  return new Date().toISOString();
}

export function userName(id) {
  return db.users.find((u) => u.id === id)?.name ?? 'Unassigned';
}

export function writeAudit(entry) {
  db.seq.audit += 1;
  db.auditLog.unshift({
    id: `AUD-${db.seq.audit}`,
    at: nowIso(),
    ip: '10.20.4.17',
    result: 'Success',
    ...entry,
  });
}
