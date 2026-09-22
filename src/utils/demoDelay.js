/**
 * Guidora Temporary Demo Delay Utility
 * 
 * Used for testing and observing animated loaders, skeletons, and modal dialogs.
 * Provides a 10-second artificial delay when activated via the Header navbar button.
 * 
 * NOTE: This is a temporary QA / Demo tool for developer and user inspection.
 */

const DEMO_DELAY_KEY = 'guidora_demo_delay_active';
export const DEMO_DELAY_MS = 10000; // 10 seconds

export function isDemoDelayActive() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DEMO_DELAY_KEY) === 'true';
}

export function setDemoDelayActive(active) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEMO_DELAY_KEY, active ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('guidora_demo_delay_change', { detail: Boolean(active) }));
}

export function toggleDemoDelay() {
  const current = isDemoDelayActive();
  const next = !current;
  setDemoDelayActive(next);
  return next;
}

export function getDemoDelayDuration(defaultMs = 0) {
  return isDemoDelayActive() ? DEMO_DELAY_MS : defaultMs;
}

export async function waitDemoDelay(defaultMs = 0) {
  const duration = getDemoDelayDuration(defaultMs);
  if (duration > 0) {
    await new Promise((resolve) => setTimeout(resolve, duration));
  }
}
