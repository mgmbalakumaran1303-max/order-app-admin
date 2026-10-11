// Central runtime configuration. CRA exposes only REACT_APP_* variables.
//
// REACT_APP_DATA_MODE
//   "mock" – services are backed by the in-memory sample data in src/mocks.
//   "api"  – services call the backend through src/services/apiClient.js.
//            Endpoints are only wired once a backend contract exists; until
//            then the api implementation reports "not available" instead of
//            silently falling back to mock data.

const rawMode = (process.env.REACT_APP_DATA_MODE || 'mock').toLowerCase();

export const DATA_MODE = rawMode === 'api' ? 'api' : 'mock';
export const IS_MOCK = DATA_MODE === 'mock';

export const ENVIRONMENT_NAME = process.env.REACT_APP_ENVIRONMENT || 'Production';

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

// Artificial latency for mock responses so loading states are visible during
// UI development. Always 0 under test.
export const MOCK_LATENCY_MS =
  process.env.NODE_ENV === 'test'
    ? 0
    : Number(process.env.REACT_APP_MOCK_LATENCY_MS ?? 350);

export const APP_VERSION = process.env.REACT_APP_VERSION || '1.0.0';

// Data older than this is flagged with the "Old data" banner.
export const STALE_AFTER_MINUTES = 15;
