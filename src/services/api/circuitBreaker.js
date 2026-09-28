import { getConfig } from '../config/configService';
import { toast } from '../toast/toastService';

export const CIRCUIT_STATE = Object.freeze({
  CLOSED: 'CLOSED',       // Normal operation: all requests allowed
  OPEN: 'OPEN',           // Outage: requests fast-fail to protect server & UI
  HALF_OPEN: 'HALF_OPEN', // Probing: testing server health
});

class CircuitBreaker {
  constructor() {
    this.state = CIRCUIT_STATE.CLOSED;
    this.consecutiveFailures = 0;
    this.openedAt = null;
    this.probeTimer = null;
    this.recoveryTimer = null;
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener({
      state: this.state,
      consecutiveFailures: this.consecutiveFailures,
      isOpen: this.state === CIRCUIT_STATE.OPEN,
    });
    return () => this.listeners.delete(listener);
  }

  notify() {
    const payload = {
      state: this.state,
      consecutiveFailures: this.consecutiveFailures,
      isOpen: this.state === CIRCUIT_STATE.OPEN,
    };
    this.listeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        console.error('[CircuitBreaker] Listener error:', err);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('guidora_circuit_breaker_change', { detail: payload }));
    }
  }

  getConfigValues() {
    const config = getConfig();
    return {
      enabled: config?.circuitBreaker?.enabled ?? true,
      failureThreshold: config?.circuitBreaker?.failureThreshold ?? 5,
      recoveryTimeoutMs: config?.circuitBreaker?.recoveryTimeoutMs ?? 20000,
      probeIntervalMs: config?.circuitBreaker?.probeIntervalMs ?? 10000,
      healthEndpoint: config?.circuitBreaker?.healthEndpoint ?? '/health/live',
    };
  }

  canRequest() {
    const { enabled } = this.getConfigValues();
    if (!enabled) return true;

    if (this.state === CIRCUIT_STATE.CLOSED) {
      return true;
    }

    if (this.state === CIRCUIT_STATE.OPEN) {
      return false;
    }

    // In HALF_OPEN state, allow test request
    return true;
  }

  recordSuccess() {
    if (this.state !== CIRCUIT_STATE.CLOSED) {
      console.info('[CircuitBreaker] Backend recovered! Transitioning to CLOSED.');
      this.state = CIRCUIT_STATE.CLOSED;
      this.consecutiveFailures = 0;
      this.openedAt = null;
      this.clearTimers();
      this.notify();

      // Show recovery toast
      toast.success(
        'Bağlantı Kuruldu',
        'Guidora servislerine erişim normale döndü.',
        { id: 'toast_backend_recovery', durationMs: 3000 }
      );
    } else {
      this.consecutiveFailures = 0;
    }
  }

  recordFailure(error) {
    const { enabled, failureThreshold, recoveryTimeoutMs } = this.getConfigValues();
    if (!enabled) return;

    this.consecutiveFailures += 1;

    if (this.state === CIRCUIT_STATE.CLOSED && this.consecutiveFailures >= failureThreshold) {
      this.state = CIRCUIT_STATE.OPEN;
      this.openedAt = Date.now();
      console.warn(`[CircuitBreaker] Failure threshold (${failureThreshold}) exceeded. Tripping to OPEN.`);
      this.notify();

      // Show non-intrusive 3-second toast as requested
      toast.error(
        'Sunucuya Ulaşılamıyor',
        'Guidora servisleri geçici olarak yanıt vermiyor. Sistem otomatik yeniden bağlanmayı deneyecek.',
        { id: 'toast_backend_down', durationMs: 3000 }
      );

      // Start recovery timeout to switch to HALF_OPEN
      this.clearTimers();
      this.recoveryTimer = setTimeout(() => {
        this.transitionToHalfOpen();
      }, recoveryTimeoutMs);

      // Also start periodic health probe
      this.startHealthProbing();
    } else if (this.state === CIRCUIT_STATE.HALF_OPEN) {
      // Failed probe in HALF_OPEN, reopen
      this.state = CIRCUIT_STATE.OPEN;
      this.openedAt = Date.now();
      this.notify();
      this.recoveryTimer = setTimeout(() => {
        this.transitionToHalfOpen();
      }, recoveryTimeoutMs);
    }
  }

  transitionToHalfOpen() {
    if (this.state === CIRCUIT_STATE.OPEN) {
      this.state = CIRCUIT_STATE.HALF_OPEN;
      this.notify();
      this.probeHealth();
    }
  }

  startHealthProbing() {
    const { probeIntervalMs } = this.getConfigValues();
    this.probeTimer = setInterval(() => {
      if (this.state === CIRCUIT_STATE.OPEN || this.state === CIRCUIT_STATE.HALF_OPEN) {
        this.probeHealth();
      }
    }, probeIntervalMs);
  }

  async probeHealth() {
    const { healthEndpoint } = this.getConfigValues();
    const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
    // Use relative /health/live or /api/health/live
    const healthUrl = healthEndpoint.startsWith('http')
      ? healthEndpoint
      : `${BASE_URL.replace(/\/+$/, '')}${healthEndpoint.replace(/^\/api/, '')}`;

    try {
      const res = await fetch(healthUrl, { method: 'GET', cache: 'no-store' });
      if (res.ok) {
        this.recordSuccess();
      }
    } catch {
      // Still unreachable, wait for next cycle
    }
  }

  clearTimers() {
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
      this.recoveryTimer = null;
    }
    if (this.probeTimer) {
      clearInterval(this.probeTimer);
      this.probeTimer = null;
    }
  }

  reset() {
    this.clearTimers();
    this.state = CIRCUIT_STATE.CLOSED;
    this.consecutiveFailures = 0;
    this.openedAt = null;
    this.notify();
  }
}

export const circuitBreaker = new CircuitBreaker();
