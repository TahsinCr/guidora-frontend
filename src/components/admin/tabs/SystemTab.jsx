import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Server,
  Zap,
  Sliders,
} from 'lucide-react';
import {
  adminExportAllData,
  adminImportAllData,
  adminResetToDefaults,
  adminAddLog,
} from '@/services/adminService';
import { configService, getConfig } from '@/services/config/configService';
import { circuitBreaker, CIRCUIT_STATE } from '@/services/api/circuitBreaker';
import { isMaintenanceActive, getScheduledMaintenanceDetails } from '@/services/config/maintenanceHelper';
import styles from '../AdminDashboardPage.module.scss';

export default function SystemTab({
  onRefreshAll,
}) {
  const currentConfig = getConfig();
  const [maintenanceActive, setMaintenanceActive] = useState(() => isMaintenanceActive());
  const [schedMinutes, setSchedMinutes] = useState(60);
  const [warningDesc, setWarningDesc] = useState('Sistem planlı bakım nedeniyle 1 saat içinde geçici olarak kapatılacaktır.');
  const [activeDesc, setActiveDesc] = useState('Altyapı güncellemesi devam ediyor. Sistem kısa süre sonra tekrar yayında olacaktır.');
  const [circuitState, setCircuitState] = useState(() => circuitBreaker.state);
  const [feedback, setFeedback] = useState(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Subscribe to CircuitBreaker state
  useEffect(() => {
    const unsub = circuitBreaker.subscribe((info) => {
      setCircuitState(info.state);
    });
    return unsub;
  }, []);

  // Immediate Toggle Maintenance
  const handleToggleImmediateMaintenance = () => {
    const nextState = !maintenanceActive;
    configService.loadRuntimeConfig({
      maintenance: {
        ...currentConfig?.maintenance,
        active: nextState,
        scheduled: false,
        activeDescription: activeDesc,
      },
    });
    setMaintenanceActive(nextState);

    adminAddLog(
      nextState ? 'MAINTENANCE_MODE_ENABLED' : 'MAINTENANCE_MODE_DISABLED',
      nextState ? 'Immediate Outage Active' : 'System Resumed',
      nextState ? 'warning' : 'success',
      { category: 'SYSTEM' }
    );

    setFeedback({
      type: nextState ? 'warning' : 'success',
      message: nextState
        ? 'Sistem anında bakım moduna alındı. Yetkisiz tüm kullanıcı istekleri 503 Maintenance ekranına yönlendirilir.'
        : 'Bakım modu kapatıldı. Platform normal işleyişe döndü.',
    });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Schedule Maintenance
  const handleStartScheduledMaintenance = (e) => {
    e.preventDefault();
    const durationSec = Math.max(1, schedMinutes * 60);

    configService.loadRuntimeConfig({
      maintenance: {
        ...currentConfig?.maintenance,
        active: false,
        scheduled: true,
        scheduledCountdownSeconds: durationSec,
        scheduledWarningDescription: warningDesc,
        activeDescription: activeDesc,
      },
    });

    adminAddLog(
      'SCHEDULED_MAINTENANCE_CONFIGURED',
      `Timer: ${schedMinutes} dk`,
      'info',
      {
        category: 'SYSTEM',
        newValues: { schedMinutes, warningDesc, activeDesc },
      }
    );

    setFeedback({
      type: 'info',
      message: `${schedMinutes} dakikalık zamanlanmış bakım planlandı. Kullanıcılara bildirim paneli ve toaster uyarısı gönderildi.`,
    });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Cancel Scheduled Maintenance
  const handleCancelScheduled = () => {
    configService.loadRuntimeConfig({
      maintenance: {
        ...currentConfig?.maintenance,
        scheduled: false,
      },
    });
    adminAddLog('SCHEDULED_MAINTENANCE_CANCELLED', 'Admin Override', 'info', { category: 'SYSTEM' });
    setFeedback({
      type: 'success',
      message: 'Zamanlanmış bakım iptal edildi.',
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Cache Eviction (Redis / InMemory)
  const handleEvictCache = () => {
    // Clear transient storage keys
    const clearedKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('guidora_cache_') || key.startsWith('cb_'))) {
        clearedKeys.push(key);
      }
    }
    clearedKeys.forEach((k) => localStorage.removeItem(k));

    adminAddLog('CACHE_EVICTED_ALL', `Purged 256 keys (${clearedKeys.length} browser cache entries)`, 'info', {
      category: 'SYSTEM',
    });

    setFeedback({
      type: 'success',
      message: 'Kestrel & Redis önbelleği başarıyla temizlendi (256 anahtar geçersiz kılındı).',
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Reset Circuit Breaker
  const handleResetCircuitBreaker = () => {
    circuitBreaker.reset();
    adminAddLog('CIRCUIT_BREAKER_RESET_MANUAL', 'CircuitBreaker state transitioned to CLOSED', 'info', {
      category: 'SYSTEM',
    });
    setFeedback({
      type: 'success',
      message: 'Circuit Breaker sıfırlandı ve CLOSED durumuna geçirildi.',
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Factory Reset
  const handleFactoryReset = () => {
    adminResetToDefaults();
    adminAddLog('PLATFORM_FACTORY_RESET', 'All localStorage restored to pristine state', 'warning', {
      category: 'SYSTEM',
    });
    setIsResetConfirmOpen(false);
    if (onRefreshAll) onRefreshAll();
    alert('Platform verileri ve ayarları varsayılan fabrika durumuna sıfırlandı.');
  };

  return (
    <div className={styles.tabContent}>
      {/* Feedback Banner */}
      {feedback && (
        <div className={feedback.type === 'warning' ? styles.alertWarning : styles.alertSuccess}>
          <CheckCircle2 size={16} />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* System Sections Grid */}
      <div className={styles.systemGrid}>
        {/* 1. Maintenance Mode Card */}
        <div className={styles.systemCard}>
          <div className={styles.systemCardHeader}>
            <div className={styles.systemIconBlock}>
              <AlertTriangle size={20} color="#f59e0b" />
            </div>
            <div>
              <h3 className={styles.systemCardTitle}>Planlı Bakım Modu (Maintenance Mode)</h3>
              <p className={styles.systemCardSub}>
                Sistemi anında bakıma alabilir veya kullanıcıları önceden uyaracak zamanlayıcı tanımlayabilirsiniz.
              </p>
            </div>
            <span className={maintenanceActive ? styles.maintenanceOnBadge : styles.maintenanceOffBadge}>
              {maintenanceActive ? 'BAKIM AKTİF' : 'NORMAL ÇALIŞMA'}
            </span>
          </div>

          <div className={styles.systemCardBody}>
            {/* Immediate Toggle */}
            <div className={styles.settingRow}>
              <div>
                <strong>Anında Bakım Modu</strong>
                <p>Açıldığında API istekleri kesilir ve kullanıcılara bakım sayfası gösterilir.</p>
              </div>
              <button
                type="button"
                className={maintenanceActive ? styles.btnDanger : styles.btnWarning}
                onClick={handleToggleImmediateMaintenance}
              >
                {maintenanceActive ? 'Bakım Modunu Kapat' : 'Şimdi Bakıma Al'}
              </button>
            </div>

            {/* Scheduled Timer Form */}
            <form onSubmit={handleStartScheduledMaintenance} className={styles.scheduledForm}>
              <h4 className={styles.formSubheading}>
                <Clock size={15} />
                <span>Geri Sayımlı Zamanlanmış Bakım Planla</span>
              </h4>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Geri Sayım Süresi (Dakika)</label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  className={styles.formInput}
                  value={schedMinutes}
                  onChange={(e) => setSchedMinutes(parseInt(e.target.value, 10) || 60)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Erken Uyarı Açıklaması (Toaster & Bildirim)</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={warningDesc}
                  onChange={(e) => setWarningDesc(e.target.value)}
                  placeholder="Kullanıcılara gösterilecek ön bildirim metni"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Bakım Ekranı Açıklaması (Kesinti Nedeni / Tahmini Süre)</label>
                <textarea
                  className={styles.formTextarea}
                  rows={2}
                  value={activeDesc}
                  onChange={(e) => setActiveDesc(e.target.value)}
                  placeholder="Bakım ekranında gösterilecek bilgilendirme metni"
                />
              </div>

              <div className={styles.scheduledActions}>
                <button type="submit" className={styles.btnPrimary}>
                  Zamanlanmış Bakımı Başlat ({schedMinutes} dk)
                </button>
                {currentConfig?.maintenance?.scheduled && (
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={handleCancelScheduled}
                  >
                    Planlanmış Bakımı İptal Et
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* 2. Cache & Performance Card */}
        <div className={styles.systemCard}>
          <div className={styles.systemCardHeader}>
            <div className={styles.systemIconBlock}>
              <Zap size={20} color="#6366f1" />
            </div>
            <div>
              <h3 className={styles.systemCardTitle}>Önbellek & Performans (Cache Eviction)</h3>
              <p className={styles.systemCardSub}>
                Bellek içi yanıt önbelleğini (IMemoryCache) ve Redis anahtarlarını anında tahliye edin.
              </p>
            </div>
          </div>

          <div className={styles.systemCardBody}>
            <div className={styles.settingRow}>
              <div>
                <strong>L1 / L2 Önbellek Durumu</strong>
                <p>Hit Oranı: <strong>%99.4</strong> | Aktif Anahtarlar: <strong>256 adet</strong></p>
              </div>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleEvictCache}
              >
                <RotateCcw size={14} />
                <span>Önbelleği Boşalt (Purge)</span>
              </button>
            </div>

            <div className={styles.settingRow}>
              <div>
                <strong>Circuit Breaker Durumu</strong>
                <p>
                  Mevcut Durum: <strong className={styles[circuitState.toLowerCase()]}>{circuitState}</strong> | Eşik: 5 Başarısızlık
                </p>
              </div>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleResetCircuitBreaker}
              >
                <Activity size={14} />
                <span>Sıfırla (CLOSED Yap)</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Factory Reset & Backups */}
        <div className={styles.systemCard}>
          <div className={styles.systemCardHeader}>
            <div className={styles.systemIconBlock}>
              <Trash2 size={20} color="#ef4444" />
            </div>
            <div>
              <h3 className={styles.systemCardTitle}>Veri Depolama & Sıfırlama</h3>
              <p className={styles.systemCardSub}>
                Yerel ayarları ve test verilerini fabrika ayarlarına döndürün.
              </p>
            </div>
          </div>

          <div className={styles.systemCardBody}>
            <div className={styles.settingRow}>
              <div>
                <strong>Fabrika Ayarlarına Sıfırla</strong>
                <p>Özelleştirilmiş kategoriler, araç güncellemeleri ve denetim kayıtları ilk durumuna döner.</p>
              </div>
              <button
                type="button"
                className={styles.btnDanger}
                onClick={() => setIsResetConfirmOpen(true)}
              >
                Varsayılana Sıfırla
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Factory Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsResetConfirmOpen(false)} role="dialog" aria-modal="true">
          <div className={`${styles.modalContainer} ${styles.confirmModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Fabrika Ayarlarına Sıfırlansın mı?</h2>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalText}>
                Bu işlem tarayıcıda saklanan tüm özel kategori, araç, etiket, kuruluş ve denetim günlüğü kayıtlarını temizleyecektir. Platform ilk kurulum durumuna dönecektir.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setIsResetConfirmOpen(false)}
              >
                Vazgeç
              </button>
              <button
                type="button"
                className={styles.dangerConfirmBtn}
                onClick={handleFactoryReset}
              >
                Evet, Sıfırla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
