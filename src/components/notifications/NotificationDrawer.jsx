import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  Bell,
  X,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
} from '@/services/notificationService';
import styles from './NotificationDrawer.module.scss';

export default function NotificationDrawer({ isOpen, onClose, onOpenTool }) {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);

  const refreshNotifs = () => {
    setNotifications(getNotifications());
  };

  useEffect(() => {
    if (isOpen) {
      refreshNotifs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleItemClick = (notif) => {
    markAsRead(notif.id);
    refreshNotifs();
    if (notif.link) {
      onClose();
      onOpenTool?.(notif.link);
    }
  };

  const handleMarkAll = () => {
    markAllAsRead();
    refreshNotifs();
  };

  const handleClearAll = () => {
    clearAllNotifications();
    refreshNotifs();
  };

  return (
    <>
      <div className={styles.drawerBackdrop} onClick={onClose} />
      <div className={styles.drawer} role="dialog" aria-modal="true">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <Bell size={18} color="var(--primary-color)" />
            <h2 className={styles.title}>{t('notif.title', 'Notifications')}</h2>
            {unreadCount > 0 && (
              <span className={styles.badge}>{unreadCount} {t('notif.newBadge', 'New')}</span>
            )}
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Action bar */}
        {notifications.length > 0 && (
          <div className={styles.actionsBar}>
            <button
              type="button"
              className={styles.textActionBtn}
              onClick={handleMarkAll}
            >
              {t('notif.markAllAsRead', 'Mark all as read')}
            </button>
            <button
              type="button"
              className={`${styles.textActionBtn} ${styles.danger}`}
              onClick={handleClearAll}
            >
              {t('notif.clearAll', 'Clear All')}
            </button>
          </div>
        )}

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <CheckCircle2 size={40} color="#10b981" />
            <p>{t('notif.empty', 'No unread notifications.')}</p>
          </div>
        ) : (
          <div className={styles.list}>
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`${styles.item} ${!n.isRead ? styles.unread : ''}`}
                onClick={() => handleItemClick(n)}
              >
                <div className={styles.itemHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={styles.itemTitle}>{n.title}</span>
                  </div>
                  {!n.isRead && <span className={styles.unreadDot} />}
                </div>

                <p className={styles.itemMessage}>{n.message}</p>

                <div className={styles.itemFooter}>
                  <span>
                    {new Date(n.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {n.link && (
                    <span style={{ color: 'var(--brand-blue)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {t('notif.view', 'View')} <ExternalLink size={11} />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

