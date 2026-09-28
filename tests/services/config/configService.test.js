import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { configService } from '@/services/config/configService';
import { SAFE_CONFIG_DEFAULTS } from '@/services/config/safeDefaults';

describe('ConfigService - Runtime Configuration Engine', () => {
  beforeEach(() => {
    configService.resetToSafeDefaults();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with SAFE_CONFIG_DEFAULTS', () => {
    const config = configService.config;
    expect(config).toBeDefined();
    expect(config.network.timeouts.defaultMs).toBe(SAFE_CONFIG_DEFAULTS.network.timeouts.defaultMs);
    expect(config.circuitBreaker.failureThreshold).toBe(5);
  });

  it('fetches remote /config.json, merges overrides, and deep-freezes the result', async () => {
    const mockRemoteConfig = {
      network: {
        timeouts: {
          defaultMs: 12000,
        },
      },
      circuitBreaker: {
        failureThreshold: 7,
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockRemoteConfig,
    });

    const loaded = await configService.loadConfig();

    expect(loaded.network.timeouts.defaultMs).toBe(12000);
    // Preserves un-overridden defaults
    expect(loaded.network.timeouts.uploadMs).toBe(SAFE_CONFIG_DEFAULTS.network.timeouts.uploadMs);
    expect(loaded.circuitBreaker.failureThreshold).toBe(7);

    // Verify deep freeze: mutating any nested property throws in strict mode
    expect(Object.isFrozen(loaded)).toBe(true);
    expect(Object.isFrozen(loaded.network)).toBe(true);
    expect(Object.isFrozen(loaded.network.timeouts)).toBe(true);
    expect(Object.isFrozen(loaded.circuitBreaker)).toBe(true);

    expect(() => {
      loaded.network.timeouts.defaultMs = 99999;
    }).toThrow();
  });

  it('falls back safely to SAFE_CONFIG_DEFAULTS when fetch fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network connection refused (ECONNREFUSED)'));

    const loaded = await configService.loadConfig();

    expect(loaded).toBeDefined();
    expect(loaded.network.timeouts.defaultMs).toBe(SAFE_CONFIG_DEFAULTS.network.timeouts.defaultMs);
    expect(configService.isLoaded).toBe(true);
  });

  it('notifies registered listeners when configuration changes', () => {
    const listener = vi.fn();
    const unsubscribe = configService.subscribe(listener);

    configService.loadRuntimeConfig({
      maintenance: {
        active: true,
        title: 'Emergency Maintenance',
      },
    });

    expect(listener).toHaveBeenCalled();
    const currentConfig = configService.config;
    expect(currentConfig.maintenance.active).toBe(true);
    expect(currentConfig.maintenance.title).toBe('Emergency Maintenance');

    unsubscribe();
  });
});
