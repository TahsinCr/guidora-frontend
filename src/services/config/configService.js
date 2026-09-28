import { SAFE_CONFIG_DEFAULTS } from './safeDefaults';

/**
 * Enterprise Runtime Config Engine
 * 
 * Capabilities:
 * - Fetches runtime `public/config.json` without requiring rebuilds.
 * - Deep freezes configuration to guarantee runtime immutability (anti-tamper).
 * - Implements schema validator & fallback to safe defaults on syntax/network errors.
 * - Event-driven change listeners for instant UI updates (e.g. maintenance mode).
 */

class ConfigService {
  constructor() {
    this._config = SAFE_CONFIG_DEFAULTS;
    this._isLoaded = false;
    this._listeners = new Set();
  }

  get config() {
    return this._config;
  }

  get isLoaded() {
    return this._isLoaded;
  }

  async loadConfig() {
    try {
      // Add cache buster query to ensure fresh fetch
      const res = await fetch(`/config.json?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Failed to load config.json (HTTP ${res.status})`);
      }

      const raw = await res.json();
      const merged = this._mergeAndValidate(SAFE_CONFIG_DEFAULTS, raw);
      this._config = this._deepFreeze(merged);
      this._isLoaded = true;
      this._notifyListeners();
      return this._config;
    } catch (err) {
      console.warn('[ConfigService] Unable to load remote config.json, using safe defaults:', err.message);
      this._config = SAFE_CONFIG_DEFAULTS;
      this._isLoaded = true;
      return this._config;
    }
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notifyListeners() {
    for (const listener of this._listeners) {
      try {
        listener(this._config);
      } catch (e) {
        console.error('[ConfigService] Listener notification error:', e);
      }
    }
  }

  _mergeAndValidate(fallback, incoming) {
    if (!incoming || typeof incoming !== 'object') return fallback;

    const result = { ...fallback };

    for (const key of Object.keys(fallback)) {
      if (key in incoming) {
        if (
          typeof fallback[key] === 'object' &&
          fallback[key] !== null &&
          !Array.isArray(fallback[key])
        ) {
          result[key] = this._mergeAndValidate(fallback[key], incoming[key]);
        } else if (typeof incoming[key] === typeof fallback[key]) {
          result[key] = incoming[key];
        }
      }
    }

    return result;
  }

  _deepFreeze(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    Object.keys(obj).forEach((prop) => {
      if (typeof obj[prop] === 'object' && obj[prop] !== null) {
        this._deepFreeze(obj[prop]);
      }
    });
    return Object.freeze(obj);
  }
}

export const configService = new ConfigService();
export const getConfig = () => configService.config;
