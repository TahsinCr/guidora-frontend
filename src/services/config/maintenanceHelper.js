import { getConfig } from './configService';
import { getCurrentUser } from '../userService';

/**
 * Checks whether maintenance mode is currently active and NOT bypassed.
 */
export function isMaintenanceActive() {
  const config = getConfig();
  const maintenance = config?.maintenance;
  if (!maintenance) return false;

  // 1. Direct active flag
  let isActive = Boolean(maintenance.active);

  // 2. Check scheduled maintenance time if configured
  if (!isActive && maintenance.scheduled) {
    if (maintenance.scheduledStart) {
      const startTime = new Date(maintenance.scheduledStart).getTime();
      if (!isNaN(startTime) && Date.now() >= startTime) {
        isActive = true;
      }
    }
  }

  if (!isActive) return false;

  // 3. Check bypass mechanisms
  if (isMaintenanceBypassed(maintenance)) {
    return false;
  }

  return true;
}

/**
 * Checks if current session or user has valid bypass authorization
 */
export function isMaintenanceBypassed(maintenanceConfig) {
  const maintenance = maintenanceConfig || getConfig()?.maintenance;
  if (!maintenance) return false;

  const bypassKeys = maintenance.bypassKeys || ['superadmin_preview'];
  const bypassRoles = maintenance.bypassRoles || ['admin', 'superadmin'];

  // Check URL query parameter: ?bypass=key
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const urlBypass = urlParams.get('bypass');
    if (urlBypass && bypassKeys.includes(urlBypass)) {
      sessionStorage.setItem('guidora_maintenance_bypass', urlBypass);
      return true;
    }

    // Check existing session bypass key
    const sessionBypass = sessionStorage.getItem('guidora_maintenance_bypass');
    if (sessionBypass && bypassKeys.includes(sessionBypass)) {
      return true;
    }
  }

  // Check user role
  const user = getCurrentUser();
  if (user && bypassRoles.includes(user.role)) {
    return true;
  }

  return false;
}

/**
 * Manual bypass activation from maintenance page
 */
export function activateManualBypass(key) {
  const config = getConfig();
  const bypassKeys = config?.maintenance?.bypassKeys || ['superadmin_preview'];
  if (bypassKeys.includes(key.trim())) {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('guidora_maintenance_bypass', key.trim());
    }
    return true;
  }
  return false;
}

/**
 * Returns scheduled maintenance timer details if scheduled
 */
export function getScheduledMaintenanceDetails() {
  const config = getConfig();
  const maintenance = config?.maintenance;
  if (!maintenance || !maintenance.scheduled) {
    return null;
  }

  let startMs = null;
  if (maintenance.scheduledStart) {
    startMs = new Date(maintenance.scheduledStart).getTime();
  } else if (maintenance.scheduledCountdownSeconds) {
    // If relative countdown is configured in seconds
    const storedBase = typeof window !== 'undefined' ? sessionStorage.getItem('guidora_sched_base') : null;
    if (storedBase) {
      startMs = parseInt(storedBase, 10);
    } else {
      startMs = Date.now() + maintenance.scheduledCountdownSeconds * 1000;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('guidora_sched_base', startMs.toString());
      }
    }
  }

  if (!startMs || isNaN(startMs)) return null;

  const remainingSeconds = Math.max(0, Math.floor((startMs - Date.now()) / 1000));

  return {
    isScheduled: true,
    startMs,
    remainingSeconds,
    activeDescription: maintenance.activeDescription || maintenance.message,
    scheduledWarningDescription: maintenance.scheduledWarningDescription || maintenance.message,
    isStarted: remainingSeconds <= 0,
  };
}
