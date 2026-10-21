// Centralized configuration for API and WebSocket URLs
// In development, defaults to http://localhost:8000
// In production/deployment, can be set via VITE_API_URL and VITE_WS_URL environment variables

export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

export const WS_BASE_URL = import.meta.env.VITE_WS_URL
  ? import.meta.env.VITE_WS_URL.replace(/\/+$/, '')
  : API_BASE_URL.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
