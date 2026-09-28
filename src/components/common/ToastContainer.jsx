import { useState, useEffect } from 'react';
import { toast } from '@/services/toast/toastService';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import styles from './ToastContainer.module.scss';

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe((updatedToasts) => {
      setToasts(updatedToasts);
    });
    return unsubscribe;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <aside className={styles.container} aria-live="polite" aria-atomic="true">
      {toasts.map((item) => {
        let Icon = Info;
        if (item.type === 'error') Icon = AlertCircle;
        if (item.type === 'warning') Icon = AlertTriangle;
        if (item.type === 'success') Icon = CheckCircle;

        return (
          <div
            key={item.id}
            className={`${styles.toast} ${styles[item.type] || styles.info}`}
            role="status"
          >
            <div className={styles.iconWrap}>
              <Icon size={18} />
            </div>

            <div className={styles.content}>
              {item.title && <div className={styles.title}>{item.title}</div>}
              {item.message && <div className={styles.message}>{item.message}</div>}
              {item.action && (
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => {
                    item.action.onClick?.();
                    toast.dismiss(item.id);
                  }}
                >
                  {item.action.label}
                </button>
              )}
            </div>

            {item.dismissible && (
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => toast.dismiss(item.id)}
                aria-label="Kapat"
                title="Kapat"
              >
                <X size={15} />
              </button>
            )}

            {item.durationMs > 0 && (
              <div
                className={styles.progressBar}
                style={{ animationDuration: `${item.durationMs}ms` }}
              />
            )}
          </div>
        );
      })}
    </aside>
  );
}
