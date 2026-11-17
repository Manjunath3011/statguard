const DEV_BACKEND_URL = 'http://localhost:8000';

const rawEnvUrl =
  typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env.VITE_API_BASE_URL as string | undefined)
    : undefined;

export const API_BASE_URL = (rawEnvUrl && rawEnvUrl.trim().length > 0
  ? rawEnvUrl.trim()
  : DEV_BACKEND_URL
).replace(/\/+$/, '');

export const API_ENDPOINTS = {
  UPLOAD: '/api/upload',
  ANALYZE: '/api/analyze',
  DASHBOARD: '/api/dashboard',
  THREATS: '/api/threats',
  INVESTIGATE: (id: string) => `/api/investigate/${encodeURIComponent(id)}`
} as const;

export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  defaultTimeoutMs: 15000,
  uploadTimeoutMs: 60000,
  corsMode: 'cors' as RequestMode,
  credentials: 'omit' as RequestCredentials
} as const;
