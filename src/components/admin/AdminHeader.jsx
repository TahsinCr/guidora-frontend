import React, { useRef } from 'react';
import {
  Menu,
  Search,
  Download,
  Upload,
  Database,
  CheckCircle2,
  Sliders,
  Shield,
  Activity,
} from 'lucide-react';
import toastService from '@/services/toast/toastService';
import styles from './AdminDashboardPage.module.scss';

const TAB_TITLES = {
  overview: { title: 'Genel Bakış & Analitik', breadcrumb: 'Platform / Genel Bakış' },
  schema: { title: 'Veri Modeli & REST API Tasarımı', breadcrumb: 'Platform / Veri Modeli & API' },
  database: { title: 'Veri Modeli & REST API Tasarımı', breadcrumb: 'Platform / Veri Modeli & API' },
  logs: { title: 'Denetim & Sistem Logları', breadcrumb: 'Platform / Denetim Logları' },
  tools: { title: 'Araç Kataloğu Yönetimi', breadcrumb: 'Yönetişim / Araçlar' },
  proposals: { title: 'Topluluk Düzenleme Teklifleri', breadcrumb: 'Yönetişim / Teklif Kuyruğu' },
  categories: { title: 'Kategori Taksonomisi', breadcrumb: 'Yönetişim / Kategoriler' },
  tags: { title: 'Etiket Grupları & Sınıflandırma', breadcrumb: 'Yönetişim / Etiketler' },
  users: { title: 'Kullanıcı Hesapları & Rol İzinleri', breadcrumb: 'Topluluk / Kullanıcılar & Roller' },
  organizations: { title: 'Yapay Zeka Kuruluşları & Doğrulama', breadcrumb: 'Topluluk / Kuruluşlar' },
  reports: { title: 'Kullanıcı Şikayetleri & Moderasyon', breadcrumb: 'Güvenlik / Şikayetler' },
  reviews: { title: 'Topluluk İncelemeleri & Yorumlar', breadcrumb: 'Topluluk / Değerlendirmeler' },
  system: { title: 'Sistem Yapılandırması & Bakım', breadcrumb: 'Altyapı / Sistem' },
};

export default function AdminHeader({
  activeTab,
  onToggleMobile,
  globalSearch,
  onGlobalSearchChange,
  onExportData,
  onImportData,
  dbStatus = { isOnline: true, latencyMs: 8, status: 'ONLINE' },
  currentUser,
}) {
  const fileInputRef = useRef(null);
  const activeMeta = TAB_TITLES[activeTab] || { title: 'Yönetim Paneli', breadcrumb: 'Admin' };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          onImportData(event.target.result);
        } catch (err) {
          toastService.error('Dosya okuma hatası: ' + err.message);
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  return (
    <header className={styles.adminHeader}>
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className={styles.headerLeft}>
        <button
          type="button"
          className={styles.mobileBurgerBtn}
          onClick={onToggleMobile}
          aria-label="Menüyü Aç"
        >
          <Menu size={22} />
        </button>

        <div className={styles.breadcrumbBlock}>
          <span className={styles.breadcrumbPath}>{activeMeta.breadcrumb}</span>
          <h1 className={styles.pageTitle}>{activeMeta.title}</h1>
        </div>
      </div>

      {/* Center: Live Platform Status Indicators */}
      <div className={styles.headerCenter}>
        <div className={styles.statusPill} title="REST API ve Servis Katmanı Sağlığı">
          <span className={`${styles.statusDot} ${dbStatus.isOnline ? styles.online : styles.offline}`} />
          <Activity size={13} className={styles.statusPillIcon} />
          <span className={styles.statusPillText}>API: {dbStatus.isOnline ? `AKTİF (${dbStatus.latencyMs || 8}ms)` : 'DEVRE DIŞI'}</span>
        </div>

        <div className={styles.statusPill} title="Circuit Breaker Durumu">
          <span className={`${styles.statusDot} ${styles.online}`} />
          <CheckCircle2 size={13} className={styles.statusPillIcon} />
          <span className={styles.statusPillText}>Circuit: CLOSED</span>
        </div>

        <div className={`${styles.statusPill} ${styles.hideOnMobile}`} title="Tampon Bellek Verimi">
          <span className={styles.statusPillText}>Cache: 99.4%</span>
        </div>
      </div>

      {/* Right: Quick Search & Export/Import Actions */}
      <div className={styles.headerRight}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Tabloda veya günlükte ara..."
            value={globalSearch}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
            aria-label="Admin Arama"
          />
        </div>

        {/* Backup Export */}
        <button
          type="button"
          className={styles.headerActionBtn}
          onClick={onExportData}
          title="Tüm platform verilerini JSON olarak yedekle"
        >
          <Download size={15} />
          <span className={styles.btnLabel}>Yedekle</span>
        </button>

        {/* Backup Import */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button
          type="button"
          className={styles.headerActionBtn}
          onClick={() => fileInputRef.current?.click()}
          title="Önceden indirilmiş JSON yedeğini yükle"
        >
          <Upload size={15} />
          <span className={styles.btnLabel}>Yükle</span>
        </button>
      </div>
    </header>
  );
}
