/**
 * Guidora Data Source Mode Service
 * 
 * Provides unified, seamless switching between:
 * - 'backend' : Real .NET 10 WebAPI endpoints via Nginx reverse proxy / API origin
 * - 'mock'    : In-browser / In-process simulated data and localStorage persistence
 */

export const MODE_STORAGE_KEY = 'guidora_datasource_mode';

export function getDataSourceMode() {
  if (typeof window !== 'undefined') {
    try {
      const explicit = localStorage.getItem(MODE_STORAGE_KEY);
      if (explicit === 'backend' || explicit === 'mock') {
        return explicit;
      }
    } catch {
      // ignore storage access errors
    }
  }

  // Fallback to build-time Vite environment variable
  return import.meta.env?.VITE_USE_MOCK === 'true' ? 'mock' : 'backend';
}

export function isMockMode() {
  return getDataSourceMode() === 'mock';
}

export function setDataSourceMode(mode) {
  const normalized = mode === 'mock' ? 'mock' : 'backend';
  try {
    localStorage.setItem(MODE_STORAGE_KEY, normalized);
  } catch {
    // ignore
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('guidora_mode_change', { detail: normalized }));
  }
  return normalized;
}

export function toggleDataSourceMode() {
  const next = isMockMode() ? 'backend' : 'mock';
  return setDataSourceMode(next);
}
