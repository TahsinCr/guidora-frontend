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
import styles from './AccountSettingsModal.module.scss';

export default function AccountSettingsModal({ isOpen, onClose, user }) {
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
      setError('Yeni şifreler eşleşmiyor.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setIsLoading(true);
    try {
      changePassword(oldPassword, newPassword);
      setIsLoading(false);
      setSuccess('Şifreniz başarıyla güncellendi.');
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
            <h2 className={styles.title}>Hesap & Güvenlik Ayarları</h2>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          {/* Section 1: Change Password */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Şifre Değiştir</h3>
            <p className={styles.sectionDesc}>
              Hesabınızın güvenliği için güçlü ve benzersiz bir şifre kullanın.
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
                <label>Mevcut Şifre</label>
                <input
                  type="password"
                  placeholder="Mevcut şifrenizi girin"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Yeni Şifre</label>
                <input
                  type="password"
                  placeholder="En az 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Yeni Şifre Tekrar</label>
                <input
                  type="password"
                  placeholder="Yeni şifrenizi doğrulayın"
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
                {isLoading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
              </button>
            </form>
          </div>

          <div style={{ height: '1px', background: 'var(--border-card)', margin: '24px 0' }} />

          {/* Section 2: Preferences & Notifications */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Bildirim Tercihleri</h3>
            <p className={styles.sectionDesc}>
              Hangi güncellemeler ve aktiviteler için bildirim almak istediğinizi belirleyin.
            </p>

            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleTitle}>E-posta Bildirimleri</span>
                <span className={styles.toggleSubtitle}>Önemli hesap ve güvenlik uyarıları</span>
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
                <span className={styles.toggleTitle}>Haftalık AI Bülteni</span>
                <span className={styles.toggleSubtitle}>En popüler ve yeni eklenen AI araçları</span>
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
                <span className={styles.toggleTitle}>İki Adımlı Doğrulama (2FA)</span>
                <span className={styles.toggleSubtitle}>Girişlerde ekstra güvenlik katmanı</span>
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
