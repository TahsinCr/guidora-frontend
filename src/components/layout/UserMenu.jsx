import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  ShieldCheck,
  User,
  LogOut,
  Settings,
  LayoutDashboard,
  LogIn,
} from 'lucide-react';
import { getCurrentUser } from '@/services/userService';
import { logout } from '@/services/authService';
import styles from './UserMenu.module.scss';

export default function UserMenu({
  currentUser,
  onOpenProfile,
  onOpenAdmin,
  onOpenSettings,
  onOpenAuth,
  onUserChange,
}) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(() =>
    currentUser !== undefined ? currentUser : getCurrentUser()
  );

  // Sync user state on props change or dialog open
  useEffect(() => {
    if (currentUser !== undefined) {
      setUser(currentUser);
    } else {
      setUser(getCurrentUser());
    }
  }, [currentUser, isOpen]);

  // Global auth change event listener for instant reactivity across all tabs/modals
  useEffect(() => {
    const handleAuthEvent = (e) => {
      setUser(e.detail !== undefined ? e.detail : getCurrentUser());
    };
    window.addEventListener('guidora_auth_change', handleAuthEvent);
    return () => window.removeEventListener('guidora_auth_change', handleAuthEvent);
  }, []);

  const handleProfileClick = () => {
    setIsOpen(false);
    if (onOpenProfile) {
      onOpenProfile(user?.id);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setIsOpen(false);
    if (onUserChange) onUserChange(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    url.searchParams.delete('user');
    url.searchParams.delete('tool');
    window.history.pushState({}, '', url.pathname + (url.search ? url.search : ''));
  };

  // If NOT logged in, show sleek "Sign In" button
  if (!user) {
    return (
      <button
        type="button"
        className={styles.loginTriggerBtn}
        onClick={() => onOpenAuth && onOpenAuth('welcome')}
        title={t('auth.signInTitle', 'Sign In to Guidora')}
      >
        <LogIn size={15} />
        <span>{t('header.signIn', 'Sign In')}</span>
      </button>
    );
  }

  return (
    <div className={styles.dropdownWrapper}>
      {/* Trigger: User Avatar */}
      <button
        type="button"
        className={`${styles.avatarTrigger} ${isOpen ? styles.triggerActive : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={`${user?.name || 'User'} (${user?.role || 'Member'})`}
        aria-label="User menu"
      >
        {typeof user?.avatar === 'string' && (user.avatar.startsWith('http') || user.avatar.startsWith('/') || user.avatar.startsWith('data:')) ? (
          <img src={user.avatar} alt={user.name || 'User'} className={styles.avatarImg} loading="lazy" decoding="async" />
        ) : (
          user?.avatar || 'TC'
        )}
      </button>

      {/* Dropdown Backdrop */}
      {isOpen && (
        <div className={styles.menuBackdrop} onClick={() => setIsOpen(false)} />
      )}

      {/* User Dropdown Menu */}
      {isOpen && (
        <div className={styles.menuDropdown}>
          {/* User Card Header */}
          <div
            className={styles.userCardHeader}
            onClick={handleProfileClick}
            style={{ cursor: 'pointer' }}
            title={t('userMenu.viewFullProfile', 'View full profile')}
          >
            <div className={styles.largeAvatar}>
              {typeof user?.avatar === 'string' && (user.avatar.startsWith('http') || user.avatar.startsWith('/') || user.avatar.startsWith('data:')) ? (
                <img src={user.avatar} alt={user.name || 'User'} className={styles.avatarImg} loading="lazy" decoding="async" />
              ) : (
                user?.avatar || 'TC'
              )}
            </div>
            <div className={styles.userDetails}>
              <div className={styles.userNameRow}>
                <span className={styles.userName}>{user?.name || 'Tahsin Cr'}</span>
                {user?.role === 'admin' && (
                  <span className={styles.adminBadge}>
                    <ShieldCheck size={10} />
                    {t('userMenu.admin', 'Admin')}
                  </span>
                )}
              </div>
              <span className={styles.userEmail}>{user?.email || 'tahsincrs@gmail.com'}</span>
            </div>
          </div>

          {/* Action List */}
          <div className={styles.actionList}>
            <button
              type="button"
              className={styles.menuItem}
              onClick={handleProfileClick}
            >
              <User size={15} />
              <span>{t('userMenu.viewProfile', 'View Profile')}</span>
            </button>

            {user?.role === 'admin' && (
              <button
                type="button"
                className={`${styles.menuItem} ${styles.adminMenuItem}`}
                onClick={() => {
                  setIsOpen(false);
                  if (onOpenAdmin) onOpenAdmin();
                }}
              >
                <LayoutDashboard size={15} color="var(--primary-color)" />
                <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>
                  {t('userMenu.adminDashboard', 'Admin Dashboard')}
                </span>
              </button>
            )}

            <button
              type="button"
              className={styles.menuItem}
              onClick={() => {
                setIsOpen(false);
                if (onOpenSettings) onOpenSettings();
              }}
            >
              <Settings size={15} />
              <span>{t('userMenu.accountSettings', 'Account Settings')}</span>
            </button>

            <div className={styles.divider} />

            <button
              type="button"
              className={styles.menuItem}
              onClick={handleLogout}
            >
              <LogOut size={15} />
              <span>{t('userMenu.logOut', 'Log out')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
