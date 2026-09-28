import { toast } from '../toast/toastService';

class NetworkTracker {
  constructor() {
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.inFlightCount = 0;
    this.drainResolvers = [];
    this.listeners = new Set();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
    }
  }

  handleOnline() {
    this.isOnline = true;
    this.notify();
    toast.success('İnternet Bağlantısı Sağlandı', 'Ağ bağlantınız yeniden kuruldu.', {
      id: 'toast_network_online',
      durationMs: 3000,
    });
  }

  handleOffline() {
    this.isOnline = false;
    this.notify();
    toast.warning('İnternet Bağlantısı Kesildi', 'Ağ bağlantınız koptu. Lütfen internetinizi kontrol edin.', {
      id: 'toast_network_offline',
      durationMs: 3000,
    });
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener({
      isOnline: this.isOnline,
      inFlightCount: this.inFlightCount,
    });
    return () => this.listeners.delete(listener);
  }

  notify() {
    const payload = {
      isOnline: this.isOnline,
      inFlightCount: this.inFlightCount,
    };
    this.listeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        console.error('[NetworkTracker] Listener error:', err);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('guidora_network_change', { detail: payload }));
    }
  }

  incrementInFlight() {
    this.inFlightCount += 1;
    this.notify();
    return () => this.decrementInFlight();
  }

  decrementInFlight() {
    this.inFlightCount = Math.max(0, this.inFlightCount - 1);
    this.notify();

    if (this.inFlightCount === 0 && this.drainResolvers.length > 0) {
      const resolvers = [...this.drainResolvers];
      this.drainResolvers = [];
      resolvers.forEach((resolve) => resolve());
    }
  }

  /**
   * Graceful draining: waits until all active in-flight requests finish,
   * or until timeout expires, so user work is not abruptly cut off.
   */
  waitForInFlight(timeoutMs = 6000) {
    if (this.inFlightCount === 0) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve(); // proceed even if timeout occurs
      }, timeoutMs);

      this.drainResolvers.push(() => {
        clearTimeout(timer);
        resolve();
      });
    });
  }
}

export const networkTracker = new NetworkTracker();
