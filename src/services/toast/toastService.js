import { getConfig } from '../config/configService';

class ToastService {
  constructor() {
    this.toasts = [];
    this.listeners = new Set();
    this.timerMap = new Map();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener([...this.toasts]);
    return () => this.listeners.delete(listener);
  }

  notify() {
    const copy = [...this.toasts];
    this.listeners.forEach((listener) => {
      try {
        listener(copy);
      } catch (err) {
        console.error('[ToastService] Listener error:', err);
      }
    });
  }

  show(options) {
    const config = getConfig();
    const defaultAutoDismiss = config?.toasts?.autoDismissMs ?? 3000;

    const id = options.id || `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const duration = options.durationMs !== undefined ? options.durationMs : defaultAutoDismiss;

    // Check if toast with this id already exists to prevent duplicate spam
    const existingIndex = this.toasts.findIndex((t) => t.id === id);
    const toastItem = {
      id,
      type: options.type || 'info', // 'info' | 'warning' | 'error' | 'success'
      title: options.title || '',
      message: options.message || '',
      durationMs: duration,
      dismissible: options.dismissible !== false,
      createdAt: Date.now(),
      action: options.action || null, // optional { label: 'Yeniden Dene', onClick: fn }
    };

    if (existingIndex >= 0) {
      this.toasts[existingIndex] = toastItem;
    } else {
      this.toasts.push(toastItem);
    }

    // Clear old timer if updating
    if (this.timerMap.has(id)) {
      clearTimeout(this.timerMap.get(id));
      this.timerMap.delete(id);
    }

    // Set auto-dismiss timer if duration > 0
    if (duration > 0) {
      const timer = setTimeout(() => {
        this.dismiss(id);
      }, duration);
      this.timerMap.set(id, timer);
    }

    this.notify();
    return id;
  }

  dismiss(id) {
    if (this.timerMap.has(id)) {
      clearTimeout(this.timerMap.get(id));
      this.timerMap.delete(id);
    }

    const prevLength = this.toasts.length;
    this.toasts = this.toasts.filter((t) => t.id !== id);

    if (this.toasts.length !== prevLength) {
      this.notify();
    }
  }

  clear() {
    this.timerMap.forEach((timer) => clearTimeout(timer));
    this.timerMap.clear();
    this.toasts = [];
    this.notify();
  }

  info(title, message, options = {}) {
    return this.show({ type: 'info', title, message, ...options });
  }

  success(title, message, options = {}) {
    return this.show({ type: 'success', title, message, ...options });
  }

  warning(title, message, options = {}) {
    return this.show({ type: 'warning', title, message, ...options });
  }

  error(title, message, options = {}) {
    return this.show({ type: 'error', title, message, ...options });
  }
}

export const toast = new ToastService();
export default toast;
