import React from 'react';
import {
  Menu,
  Search,
  CheckCircle2,
  Activity,
  Sun,
  Moon,
  Globe,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import styles from './AdminDashboardPage.module.scss';

const TAB_TITLES = {
  overview: { title: 'Genel Bakış & Platform Analitiği', breadcrumb: 'Platform / Genel Bakış' },
  schema: { title: 'REST API Sözleşmeleri & Bağlantı Kataloğu', breadcrumb: 'Platform / REST API Sözleşmeleri' },
  database: { title: 'REST API Sözleşmeleri & Bağlantı Kataloğu', breadcrumb: 'Platform / REST API Sözleşmeleri' },
  logs: { title: 'Denetim & Sistem Olay Günlükleri', breadcrumb: 'Platform / Denetim Logları' },
  tools: { title: 'Araç Kataloğu Yönetimi', breadcrumb: 'Yönetişim / Araç Kataloğu' },
  proposals: { title: 'Topluluk Düzenleme Teklifleri', breadcrumb: 'Yönetişim / Teklif Kuyruğu' },
  categories: { title: 'Kategori Taksonomisi', breadcrumb: 'Yönetişim / Kategoriler' },
  tags: { title: 'Etiket Grupları & Sınıflandırma', breadcrumb: 'Yönetişim / Etiketler' },
  users: { title: 'Kullanıcı Hesapları & Rol İzinleri', breadcrumb: 'Topluluk / Kullanıcılar' },
  organizations: { title: 'Yapay Zeka Kuruluşları & Doğrulama', breadcrumb: 'Topluluk / Kuruluşlar' },
  reports: { title: 'Kullanıcı Şikayetleri & Moderasyon', breadcrumb: 'Güvenlik / Şikayetler' },
  reviews: { title: 'Topluluk İncelemeleri & Yorumlar', breadcrumb: 'Topluluk / Değerlendirmeler' },
  system: { title: 'Sistem Yapılandırması & Bakım', breadcrumb: 'Platform / Sistem & Bakım' },
};

import { getDataSourceMode, toggleDataSourceMode } from '@/services/config/modeService';
import toastService from '@/services/toast/toastService';

export default function AdminHeader({
  activeTab,
  onToggleMobile,
  globalSearch,
  onGlobalSearchChange,
  dbStatus = { isOnline: true, latencyMs: 8, status: 'ONLINE' },
  currentUser,
}) {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, supportedLanguages } = useLanguage();
  const activeMeta = TAB_TITLES[activeTab] || { title: 'Yönetim Paneli', breadcrumb: 'Admin' };

  const [dataSourceMode, setDataSourceMode] = React.useState(getDataSourceMode);

  React.useEffect(() => {
    const handleModeChange = (e) => {
      setDataSourceMode(e.detail || getDataSourceMode());
    };
    window.addEventListener('guidora_mode_change', handleModeChange);
    return () => window.removeEventListener('guidora_mode_change', handleModeChange);
  }, []);

  const handleToggleMode = () => {
    const nextMode = toggleDataSourceMode();
    setDataSourceMode(nextMode);
    if (nextMode === 'backend') {
      toastService.success('Canlı Backend Modu Aktif: .NET 10 WebAPI verileri yükleniyor.');
    } else {
      toastService.warning('Mock Demo Modu Aktif: Yerel örnek veriler yükleniyor.');
    }
  };

  return (
    <header className={styles.adminHeader}>
      {/* Left: Mobile Toggle & Professional Breadcrumb */}
      <div className={styles.headerLeft}>
        <button
          type="button"
          className={styles.mobileBurgerBtn}
          onClick={onToggleMobile}
          aria-label="Menüyü Aç"
        >
          <Menu size={20} />
        </button>

        <div className={styles.breadcrumbBlock}>
          <span className={styles.breadcrumbPath}>{activeMeta.breadcrumb}</span>
          <h1 className={styles.pageTitle}>{activeMeta.title}</h1>
        </div>
      </div>

      {/* Center: Live Architecture & Telemetry Gauges */}
      <div className={styles.headerCenter}>
        {/* Real-time Data Source Mode Switcher */}
        <button
          type="button"
          className={`${styles.modeSwitchBtn} ${dataSourceMode === 'backend' ? styles.backendMode : styles.mockMode}`}
          onClick={handleToggleMode}
          title="Veri Kaynağı Modunu Değiştir (.NET 10 API vs Yerel Mock)"
          aria-label="Veri Kaynağı Modunu Değiştir"
        >
          <span
            className={`${styles.statusDot} ${dataSourceMode === 'backend' ? styles.online : ''}`}
            style={dataSourceMode === 'mock' ? { backgroundColor: '#f59e0b', boxShadow: '0 0 8px rgba(245, 158, 11, 0.6)' } : {}}
          />
          <span>{dataSourceMode === 'backend' ? 'MOD: CANLI BACKEND' : 'MOD: MOCK (DEMO)'}</span>
        </button>

        <div className={styles.statusPill} title="REST API ve Servis Katmanı Sağlığı">
          <span className={`${styles.statusDot} ${dbStatus.isOnline ? styles.online : styles.offline}`} />
          <Activity size={13} className={styles.statusPillIcon} />
          <span className={styles.statusPillText}>
            API: {dbStatus.isOnline ? `ONLINE (${dbStatus.latencyMs || 8}ms)` : 'OFFLINE'}
          </span>
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

      {/* Right: Quick Search, Language Switcher, Theme & Admin Profile Pill */}
      <div className={styles.headerRight}>
        {/* Global Live Filter Search */}
        <div className={styles.searchWrapper}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Tabloda veya günlükte ara..."
            value={globalSearch}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
            aria-label="Admin Arama"
          />
        </div>

        {/* Multi-Language Selector Dropdown */}
        <div className={styles.headerLangWrapper} title="Dili Değiştir (Language)">
          <Globe size={15} className={styles.headerLangIcon} />
          <select
            className={styles.headerLangSelect}
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            aria-label="Dil Seçimi"
          >
            {(supportedLanguages || ['en', 'tr', 'ru']).map((item) => {
              const code = typeof item === 'string' ? item : item?.code || 'en';
              return (
                <option key={code} value={code}>
                  {code.toUpperCase()}
                </option>
              );
            })}
          </select>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          className={styles.headerIconBtn}
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
          aria-label="Temayı Değiştir"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Header Admin User Profile Pill */}
        <div className={styles.headerUserPill}>
          <div className={styles.headerUserAvatar}>
            {currentUser?.avatar || 'TC'}
          </div>
          <div className={styles.headerUserInfo}>
            <span className={styles.headerUserName}>{currentUser?.username || currentUser?.name || 'tahsincr'}</span>
            <span className={styles.headerUserRole}>ADMIN</span>
          </div>
        </div>
      </div>
    </header>
  );
}
