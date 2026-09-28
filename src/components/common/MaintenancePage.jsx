import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { getConfig } from '@/services/config/configService';
import { activateManualBypass } from '@/services/config/maintenanceHelper';
import { RefreshCw, KeyRound, ShieldAlert } from 'lucide-react';
import styles from './MaintenancePage.module.scss';

export default function MaintenancePage({ onUnlock }) {
  const { t } = useLanguage();
  const config = getConfig();
  const maintenance = config?.maintenance;

  const [isChecking, setIsChecking] = useState(false);
  const [showBypass, setShowBypass] = useState(false);
  const [bypassKey, setBypassKey] = useState('');
  const [bypassError, setBypassError] = useState(false);

  // Custom description from config.json (NO timer on maintenance screen per user specification!)
  const title = maintenance?.title || t('maintenance.title', 'Planlı Bakım Çalışması');
  const description = maintenance?.activeDescription || maintenance?.message || t(
    'maintenance.defaultDesc',
    'Guidora platformunda planlı altyapı optimizasyonu ve güvenlik güncellemeleri yapılmaktadır. Çalışmaların en kısa sürede tamamlanarak tüm servislerin yeniden erişime açılması planlanmaktadır. Anlayışınız için teşekkür ederiz.'
  );

  const handleCheckStatus = async () => {
    setIsChecking(true);
    const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
    try {
      const res = await fetch(`${BASE_URL.replace(/\/+$/, '')}/health/live`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (res.ok) {
        // Backend is healthy! Check if maintenance is disabled in config.json
        const cfgRes = await fetch('/config.json', { cache: 'no-store' });
        if (cfgRes.ok) {
          const freshConfig = await cfgRes.json();
          if (!freshConfig?.maintenance?.active) {
            if (onUnlock) {
              onUnlock();
            } else {
              window.location.reload();
            }
            return;
          }
        }
      }
    } catch {
      // Still unreachable or maintenance active
    } finally {
      setTimeout(() => setIsChecking(false), 600);
    }
  };

  const handleBypassSubmit = (e) => {
    e.preventDefault();
    if (!bypassKey.trim()) return;

    const success = activateManualBypass(bypassKey);
    if (success) {
      setBypassError(false);
      if (onUnlock) {
        onUnlock();
      } else {
        window.location.reload();
      }
    } else {
      setBypassError(true);
    }
  };

  return (
    <main className={styles.maintenanceWrapper}>
      <div className={styles.maintenanceCard}>
        {/* Animated Guidora Compass Hero */}
        <div className={styles.iconHero}>
          <div className={styles.orbitRing} />
          <div className={styles.glowAura} />
          <div className={styles.emblemBox}>
            <img src="/logo.svg" alt="Guidora" className={styles.logoImg} />
          </div>
        </div>

        {/* Status Badge */}
        <div className={styles.statusBadge}>
          <span className={styles.pulseDot} />
          <span>{t('maintenance.badge', 'Planlı Sistem Bakımı')}</span>
        </div>

        {/* Title */}
        <h1 className={styles.title}>{title}</h1>

        {/* Description from config.json (No countdown clock here) */}
        <div className={styles.descriptionBox}>
          <p className={styles.descriptionText}>{description}</p>
        </div>

        {/* Actions */}
        <div className={styles.actionSection}>
          <button
            type="button"
            className={styles.checkBtn}
            onClick={handleCheckStatus}
            disabled={isChecking}
          >
            <RefreshCw size={17} className={isChecking ? 'spin' : ''} />
            <span>{isChecking ? t('maintenance.checking', 'Kontrol Ediliyor...') : t('maintenance.checkBtn', 'Durumu Kontrol Et')}</span>
          </button>

          <button
            type="button"
            className={styles.bypassToggle}
            onClick={() => setShowBypass((prev) => !prev)}
          >
            <KeyRound size={14} />
            <span>{t('maintenance.bypassToggle', 'Yönetici Girişi (Bypass Key)')}</span>
          </button>

          {showBypass && (
            <form onSubmit={handleBypassSubmit} className={styles.bypassForm}>
              <input
                type="password"
                placeholder={t('maintenance.keyPlaceholder', 'Bypass anahtarını girin...')}
                value={bypassKey}
                onChange={(e) => {
                  setBypassKey(e.target.value);
                  setBypassError(false);
                }}
                autoFocus
              />
              <button type="submit">{t('maintenance.submitKey', 'Giriş')}</button>
            </form>
          )}

          {bypassError && (
            <div className={styles.errorText}>
              <ShieldAlert size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 4 }} />
              {t('maintenance.invalidKey', 'Geçersiz bypass anahtarı.')}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
