import React, { useState } from 'react';
import {
  X,
  Settings,
  Lock,
  Bell,
  Shield,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { changePassword } from '@/services/authService';
import { useLanguage } from '@/context/LanguageContext';
import styles from './AccountSettingsModal.module.scss';

export default function AccountSettingsModal({ isOpen, onClose, user }) {
  const { t } = useLanguage();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handlePasswordChangeSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError(t('settings.passwordsMismatch', 'New passwords do not match.'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('settings.passwordMinLength', 'Password must be at least 6 characters.'));
      return;
    }

    setIsLoading(true);
    try {
      changePassword(oldPassword, newPassword);
      setIsLoading(false);
      setSuccess(t('settings.passwordUpdated', 'Your password has been updated successfully.'));
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Şifre değiştirilemedi.');
    }
  };

  return (
    <div
      className={styles.modalBackdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modalCard} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <Settings size={20} color="var(--primary-color)" />
            <h2 className={styles.title}>{t('settings.title', 'Account & Security Settings')}</h2>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          {/* Section 1: Change Password */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('settings.changePassword', 'Change Password')}</h3>
            <p className={styles.sectionDesc}>
              {t('settings.changePasswordDesc', 'Use a strong and unique password to protect your account.')}
            </p>

            {success && (
              <div className={styles.successMsg}>
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div className={styles.errorMsg}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChangeSubmit}>
              <div className={styles.formGroup}>
                <label>{t('settings.currentPassword', 'Current Password')}</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>{t('settings.newPassword', 'New Password')}</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>{t('settings.confirmNewPassword', 'Confirm New Password')}</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className={styles.primaryBtn}
                disabled={isLoading}
              >
                {isLoading ? t('settings.updating', 'Updating...') : t('settings.updatePassword', 'Update Password')}
              </button>
            </form>
          </div>

          <div style={{ height: '1px', background: 'var(--border-card)', margin: '24px 0' }} />

          {/* Section 2: Preferences & Notifications */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('settings.notificationsTitle', 'Notification Preferences')}</h3>
            <p className={styles.sectionDesc}>
              {t('settings.emailNotificationsDesc', 'Receive email alerts about platform updates and reviews.')}
            </p>

            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleTitle}>{t('settings.emailNotifications', 'Email Notifications')}</span>
                <span className={styles.toggleSubtitle}>{t('settings.emailNotificationsDesc', 'Receive email alerts about platform updates and reviews.')}</span>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={emailNotifs}
                  onChange={(e) => setEmailNotifs(e.target.checked)}
                />
                <span className={styles.slider} />
              </label>
            </div>

            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleTitle}>{t('settings.weeklyDigest', 'Weekly Digest')}</span>
                <span className={styles.toggleSubtitle}>{t('settings.weeklyDigestDesc', 'Summary of top tools and trends sent once a week.')}</span>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={weeklyDigest}
                  onChange={(e) => setWeeklyDigest(e.target.checked)}
                />
                <span className={styles.slider} />
              </label>
            </div>

            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleTitle}>{t('settings.twoFactor', 'Two-Factor Authentication (2FA)')}</span>
                <span className={styles.toggleSubtitle}>{t('settings.twoFactorDesc', 'Add an extra layer of security to your account login.')}</span>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={twoFactorAuth}
                  onChange={(e) => setTwoFactorAuth(e.target.checked)}
                />
                <span className={styles.slider} />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

