import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isMaintenanceActive,
  isMaintenanceBypassed,
  activateManualBypass,
  getScheduledMaintenanceDetails,
} from '@/services/config/maintenanceHelper';
import { configService } from '@/services/config/configService';

describe('MaintenanceHelper Service', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    configService.resetToSafeDefaults();
  });

  afterEach(() => {
    sessionStorage.clear();
    configService.resetToSafeDefaults();
  });

  it('returns false when maintenance.active is false', () => {
    expect(isMaintenanceActive()).toBe(false);
  });

  it('returns true when maintenance.active is true and no bypass is present', () => {
    configService.loadRuntimeConfig({
      maintenance: {
        active: true,
        bypassKeys: ['superadmin_preview'],
      },
    });

    expect(isMaintenanceActive()).toBe(true);
  });

  it('bypasses maintenance mode when valid bypass key is stored in sessionStorage', () => {
    configService.loadRuntimeConfig({
      maintenance: {
        active: true,
        bypassKeys: ['superadmin_preview'],
      },
    });

    expect(isMaintenanceActive()).toBe(true);

    // Set valid bypass in sessionStorage
    sessionStorage.setItem('guidora_maintenance_bypass', 'superadmin_preview');
    expect(isMaintenanceActive()).toBe(false);
  });

  it('activates manual bypass via activateManualBypass with valid key', () => {
    configService.loadRuntimeConfig({
      maintenance: {
        active: true,
        bypassKeys: ['superadmin_preview'],
      },
    });

    const success = activateManualBypass('superadmin_preview');
    expect(success).toBe(true);
    expect(sessionStorage.getItem('guidora_maintenance_bypass')).toBe('superadmin_preview');
    expect(isMaintenanceActive()).toBe(false);
  });

  it('rejects invalid bypass key and keeps maintenance active', () => {
    configService.loadRuntimeConfig({
      maintenance: {
        active: true,
        bypassKeys: ['superadmin_preview'],
      },
    });

    const success = activateManualBypass('wrong_password_123');
    expect(success).toBe(false);
    expect(isMaintenanceActive()).toBe(true);
  });

  it('calculates scheduled maintenance details and countdown correctly', () => {
    configService.loadRuntimeConfig({
      maintenance: {
        active: false,
        scheduled: true,
        scheduledCountdownSeconds: 3600,
        activeDescription: 'Operasyonel Bakım Açıklaması',
        scheduledWarningDescription: 'Erken Uyarı Açıklaması',
      },
    });

    const details = getScheduledMaintenanceDetails();
    expect(details).not.toBeNull();
    expect(details.isScheduled).toBe(true);
    expect(details.remainingSeconds).toBeGreaterThan(3590);
    expect(details.activeDescription).toBe('Operasyonel Bakım Açıklaması');
    expect(details.scheduledWarningDescription).toBe('Erken Uyarı Açıklaması');
    expect(details.isStarted).toBe(false);
  });
});
