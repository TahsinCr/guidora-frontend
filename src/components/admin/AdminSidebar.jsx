import React from 'react';
import {
  LayoutDashboard,
  Layers,
  FileText,
  Wrench,
  GitPullRequest,
  FolderTree,
  Tag,
  Users,
  Building2,
  AlertTriangle,
  MessageSquare,
  Activity,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ArrowLeft,
  X,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './AdminDashboardPage.module.scss';

export default function AdminSidebar({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  badges = {},
  onBack,
  currentUser,
  isMobileOpen,
  onCloseMobile,
}) {
  const { t } = useLanguage();

  const navSections = [
    {
      title: t('admin.sectionPlatform') || 'Platform & İzleme',
      items: [
        { id: 'overview', label: t('admin.tabOverview') || 'Genel Bakış', icon: LayoutDashboard },
        { id: 'schema', label: 'REST API Sözleşmeleri', icon: Layers, badge: '18 API', badgeVariant: 'accent' },
        { id: 'logs', label: t('admin.tabLogs') || 'Denetim Logları', icon: FileText, badge: badges.criticalLogs > 0 ? `${badges.criticalLogs} Alert` : null, badgeVariant: 'danger' },
        { id: 'system', label: t('admin.tabSystem') || 'Sistem & Bakım', icon: Activity },
      ],
    },
    {
      title: t('admin.sectionGovernance') || 'Yönetişim & İçerik',
      items: [
        { id: 'tools', label: t('admin.tabTools') || 'Araç Kataloğu', icon: Wrench, badge: badges.toolsCount },
        { id: 'proposals', label: t('admin.tabProposals') || 'Teklif Sırası', icon: GitPullRequest, badge: badges.pendingProposals > 0 ? badges.pendingProposals : null, badgeVariant: 'warning' },
        { id: 'categories', label: t('admin.tabCategories') || 'Kategoriler', icon: FolderTree, badge: badges.categoriesCount },
        { id: 'tags', label: t('admin.tabTags') || 'Etiket Taksonomisi', icon: Tag },
      ],
    },
    {
      title: t('admin.sectionCommunity') || 'Topluluk & Güvenlik',
      items: [
        { id: 'users', label: t('admin.tabUsers') || 'Kullanıcılar & Roller', icon: Users, badge: badges.usersCount },
        { id: 'organizations', label: t('admin.tabOrganizations') || 'Kuruluşlar', icon: Building2 },
        { id: 'reports', label: t('admin.tabReports') || 'Şikayetler & Moderasyon', icon: AlertTriangle, badge: badges.pendingReports > 0 ? badges.pendingReports : null, badgeVariant: 'danger' },
        { id: 'reviews', label: t('admin.tabReviews') || 'Değerlendirmeler', icon: MessageSquare },
      ],
    },
  ];

  const handleReturnToDirectory = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('view');
      window.location.href = url.pathname;
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className={styles.mobileBackdrop}
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''} ${isMobileOpen ? styles.mobileOpen : ''}`}
        aria-label="Admin Navigation Sidebar"
      >
        {/* Sidebar Brand Header */}
        <div className={styles.sidebarHeader}>
          <div
            className={styles.brandRow}
            onClick={handleReturnToDirectory}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleReturnToDirectory();
              }
            }}
            title="Ana Dizine Dön"
            aria-label="Ana Dizine Dön"
          >
            <div className={styles.brandLogo}>
              <ShieldCheck size={22} className={styles.brandIcon} />
            </div>
            {!isCollapsed && (
              <div className={styles.brandInfo}>
                <div className={styles.brandTitle}>Guidora Admin</div>
                <div className={styles.brandVersion}>{t('admin.brandSubtitle') || 'Yönetim Konsolu'}</div>
              </div>
            )}
          </div>

          <div className={styles.sidebarHeaderActions}>
            {/* Desktop Collapse Toggle on Top */}
            <button
              type="button"
              className={styles.headerCollapseBtn}
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? (t('admin.expandSidebar') || 'Paneli Genişlet') : (t('admin.collapseSidebar') || 'Paneli Daralt')}
              title={isCollapsed ? `${t('admin.expandSidebar') || 'Genişlet'} (Ctrl+B)` : `${t('admin.collapseSidebar') || 'Daralt'} (Ctrl+B)`}
            >
              {isCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
            </button>

            {/* Mobile Close Button */}
            {isMobileOpen && (
              <button
                type="button"
                className={styles.mobileCloseBtn}
                onClick={onCloseMobile}
                aria-label={t('admin.close') || 'Kapat'}
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Menu List */}
        <nav className={styles.sidebarNav}>
          {navSections.map((section, idx) => (
            <div key={idx} className={styles.navSection}>
              {!isCollapsed && (
                <div className={styles.navSectionTitle}>{section.title}</div>
              )}
              <ul className={styles.navList}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <li key={item.id} className={styles.navItem}>
                      <button
                        type="button"
                        className={`${styles.navButton} ${isActive ? styles.active : ''}`}
                        onClick={() => {
                          onSelectTab(item.id);
                          if (isMobileOpen && onCloseMobile) onCloseMobile();
                        }}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <span className={styles.navIconWrapper}>
                          <Icon size={19} className={styles.navIcon} />
                        </span>

                        {!isCollapsed && (
                          <span className={styles.navLabel}>{item.label}</span>
                        )}

                        {item.badge !== undefined && item.badge !== null && (
                          <span
                            className={`${styles.navBadge} ${
                              styles[item.badgeVariant || 'default']
                            } ${isCollapsed ? styles.badgeDot : ''}`}
                          >
                            {!isCollapsed && item.badge}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer: Back to Directory & Admin Profile */}
        <div className={styles.sidebarFooter}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={handleReturnToDirectory}
            title="Ana Dizine Geri Dön"
          >
            <ArrowLeft size={16} />
            {!isCollapsed && <span>{t('header.backToDirectory', 'Dizine Geri Dön')}</span>}
          </button>

          {currentUser && !isCollapsed && (
            <div className={styles.userCard}>
              <div className={styles.userAvatar}>
                {(currentUser.avatar && currentUser.avatar.length <= 3
                  ? currentUser.avatar
                  : (currentUser.name || 'AD').slice(0, 2)
                ).toUpperCase()}
              </div>
              <div className={styles.userInfo}>
                <div className={styles.userName}>{currentUser.name || 'Admin'}</div>
                <div className={styles.userRole}>{currentUser.role || 'admin'}</div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
