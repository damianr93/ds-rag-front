// API Configuration
// Works both in local and production (Railway)

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 30000,
};

export const getApiUrl = (endpoint: string): string => {
  const baseURL = API_CONFIG.baseURL.replace(/\/$/, ''); // Remove trailing slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseURL}${cleanEndpoint}`;
};

