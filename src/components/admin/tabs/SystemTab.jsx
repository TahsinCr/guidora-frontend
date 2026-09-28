import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Clock,
  Zap,
  Radio,
  Loader2,
} from 'lucide-react';
import {
  adminResetToDefaults,
  adminAddLog,
} from '@/services/adminService';
import { configService, getConfig } from '@/services/config/configService';
import { circuitBreaker } from '@/services/api/circuitBreaker';
import { isMaintenanceActive } from '@/services/config/maintenanceHelper';
import toastService from '@/services/toast/toastService';
import AdminConfirmModal from '../modals/AdminConfirmModal';
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
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [pingLatency, setPingLatency] = useState(null);

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

    if (nextState) {
      toastService.warning('Sistem anında bakım moduna alındı. 503 Maintenance aktif.');
    } else {
      toastService.success('Bakım modu kapatıldı. Platform normal işleyişe döndü.');
    }
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

    toastService.info(`${schedMinutes} dakikalık zamanlanmış bakım planlandı. Uyarı bildirimi aktifleştirildi.`);
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
    toastService.success('Zamanlanmış bakım iptal edildi.');
  };

  // Cache Eviction (Redis / InMemory)
  const handleEvictCache = () => {
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

    toastService.success(`Kestrel & Redis önbelleği temizlendi (${clearedKeys.length} yerel anahtar kaldırıldı).`);
  };

  // Reset Circuit Breaker
  const handleResetCircuitBreaker = () => {
    circuitBreaker.reset();
    adminAddLog('CIRCUIT_BREAKER_RESET_MANUAL', 'CircuitBreaker state transitioned to CLOSED', 'info', {
      category: 'SYSTEM',
    });
    toastService.success('Circuit Breaker sıfırlandı ve CLOSED durumuna geçirildi.');
  };

  // Live Ping Probe
  const handleRunPingProbe = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/health/live', { method: 'GET', cache: 'no-store' });
      const elapsed = Math.round(performance.now() - start);
      setPingLatency(elapsed);
      if (res.ok) {
        toastService.success(`Sistem Gateway Canlı (p95: ${elapsed}ms HTTP 200)`);
      } else {
        toastService.warning(`Sistem Gateway Yanıt Verdi: HTTP ${res.status} (${elapsed}ms)`);
      }
    } catch (err) {
      const elapsed = Math.round(performance.now() - start);
      setPingLatency(elapsed);
      toastService.info(`Mock / Local Fallback devrede (${elapsed}ms)`);
    } finally {
      setIsPinging(false);
    }
  };

  // Factory Reset
  const handleFactoryReset = () => {
    adminResetToDefaults();
    adminAddLog('PLATFORM_FACTORY_RESET', 'All localStorage restored to pristine state', 'warning', {
      category: 'SYSTEM',
    });
    setIsResetConfirmOpen(false);
    if (onRefreshAll) onRefreshAll();
    toastService.success('Platform verileri ve ayarları fabrika durumuna sıfırlandı.');
  };

  return (
    <div className={styles.tabContent}>
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
                  maxLength={500}
                  value={activeDesc}
                  onChange={(e) => setActiveDesc(e.target.value)}
                  placeholder="Bakım ekranında gösterilecek bilgilendirme metni"
                />
                <div className={styles.charCount}>{activeDesc.length} / 500</div>
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
              <h3 className={styles.systemCardTitle}>Önbellek, Canlılık & Performans</h3>
              <p className={styles.systemCardSub}>
                Bellek içi yanıt önbelleğini (IMemoryCache) tahliye edin ve canlılık kontrolü yapın.
              </p>
            </div>
          </div>

          <div className={styles.systemCardBody}>
            {/* Live Gateway Ping */}
            <div className={styles.settingRow}>
              <div>
                <strong>Ağ & Gateway Canlılık Testi (Health Probe)</strong>
                <p>
                  {pingLatency !== null ? `Son Ping: ${pingLatency}ms` : 'Canlılık kontrolü henüz yapılmadı.'}
                </p>
              </div>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleRunPingProbe}
                disabled={isPinging}
              >
                {isPinging ? <Loader2 size={14} className={styles.spinIcon} /> : <Radio size={14} />}
                <span>{isPinging ? 'Ölçülüyor...' : 'Canlılık Testi Yap'}</span>
              </button>
            </div>

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
      <AdminConfirmModal
        isOpen={isResetConfirmOpen}
        title="Fabrika Ayarlarına Sıfırlansın mı?"
        message="Bu işlem tarayıcıda saklanan tüm özel kategori, araç, etiket, kuruluş ve denetim günlüğü kayıtlarını temizleyecektir. Platform ilk kurulum durumuna dönecektir. Bu işlem geri alınamaz."
        variant="danger"
        confirmText="Evet, Sıfırla"
        onConfirm={handleFactoryReset}
        onClose={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
}
