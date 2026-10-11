import { API_BASE_URL } from '../config/env';

// The single HTTP client for the application. Feature services must go through
// this module rather than calling fetch() or building URLs themselves.

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'UNKNOWN', details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let tokenProvider = () => null;

/** Registered by the auth layer so every request carries the session token. */
export function setAuthTokenProvider(fn) {
  tokenProvider = fn;
}

export async function apiRequest(path, { method = 'GET', query, body, signal } = {}) {
  if (!API_BASE_URL) {
    throw new ApiError('The backend API base URL is not configured.', { code: 'NOT_CONFIGURED' });
  }
  const url = new URL(path.replace(/^\//, ''), API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
    });
  }
  const headers = { Accept: 'application/json' };
  const token = tokenProvider();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
      credentials: 'include',
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Network error. Check your connection and try again.', { code: 'NETWORK' });
  }

  if (response.status === 401) throw new ApiError('Your session has expired.', { status: 401, code: 'UNAUTHENTICATED' });
  if (response.status === 403) throw new ApiError('You do not have permission to access this resource.', { status: 403, code: 'FORBIDDEN' });
  if (response.status === 404) throw new ApiError('The requested resource was not found.', { status: 404, code: 'NOT_FOUND' });
  if (!response.ok) {
    throw new ApiError(`The server returned an error (${response.status}).`, { status: response.status, code: 'SERVER' });
  }
  if (response.status === 204) return null;
  return response.json();
}

/**
 * Placeholder used for every service method whose backend endpoint has not
 * been documented yet. It fails loudly so the UI shows an error state rather
 * than pretending data exists.
 */
export function createPendingApiService(serviceName, methodNames) {
  return Object.fromEntries(
    methodNames.map((name) => [
      name,
      async () => {
        throw new ApiError(
          `${serviceName}.${name} is not connected to a backend yet. Run the app with REACT_APP_DATA_MODE=mock to use sample data.`,
          { code: 'NOT_CONFIGURED' }
        );
      },
    ])
  );
}
