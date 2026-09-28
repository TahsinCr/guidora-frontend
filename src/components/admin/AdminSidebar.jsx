import React from 'react';
import {
  LayoutDashboard,
  Database,
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
  ArrowLeft,
  ShieldCheck,
  X,
} from 'lucide-react';
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
  const navSections = [
    {
      title: 'Platform & İzleme',
      items: [
        { id: 'overview', label: 'Genel Bakış', icon: LayoutDashboard },
        { id: 'database', label: 'Veritabanı (PG18)', icon: Database, badge: badges.tables || 10, badgeVariant: 'accent' },
        { id: 'logs', label: 'Denetim Logları', icon: FileText, badge: badges.criticalLogs > 0 ? `${badges.criticalLogs} Alert` : null, badgeVariant: 'danger' },
      ],
    },
    {
      title: 'Yönetişim & İçerik',
      items: [
        { id: 'tools', label: 'Araç Kataloğu', icon: Wrench, badge: badges.toolsCount },
        { id: 'proposals', label: 'Teklif Sırası', icon: GitPullRequest, badge: badges.pendingProposals > 0 ? badges.pendingProposals : null, badgeVariant: 'warning' },
        { id: 'categories', label: 'Kategoriler', icon: FolderTree, badge: badges.categoriesCount },
        { id: 'tags', label: 'Etiket Taksonomisi', icon: Tag },
      ],
    },
    {
      title: 'Topluluk & Güvenlik',
      items: [
        { id: 'users', label: 'Kullanıcılar & Roller', icon: Users, badge: badges.usersCount },
        { id: 'organizations', label: 'Kuruluşlar', icon: Building2 },
        { id: 'reports', label: 'Şikayetler & Moderasyon', icon: AlertTriangle, badge: badges.pendingReports > 0 ? badges.pendingReports : null, badgeVariant: 'danger' },
        { id: 'reviews', label: 'Değerlendirmeler', icon: MessageSquare },
      ],
    },
    {
      title: 'Altyapı',
      items: [
        { id: 'system', label: 'Sistem & Bakım', icon: Activity },
      ],
    },
  ];

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
          <div className={styles.brandRow}>
            <div className={styles.brandLogo}>
              <ShieldCheck size={22} className={styles.brandIcon} />
            </div>
            {!isCollapsed && (
              <div className={styles.brandInfo}>
                <div className={styles.brandTitle}>Guidora Admin</div>
                <div className={styles.brandVersion}>v2.0 PG18 Hub</div>
              </div>
            )}
          </div>
          {/* Mobile Close Button */}
          {isMobileOpen && (
            <button
              type="button"
              className={styles.mobileCloseBtn}
              onClick={onCloseMobile}
              aria-label="Menüyü Kapat"
            >
              <X size={20} />
            </button>
          )}
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

        {/* Sidebar Footer Controls */}
        <div className={styles.sidebarFooter}>
          {/* Back to site button */}
          <button
            type="button"
            className={styles.backBtn}
            onClick={onBack}
            title={isCollapsed ? 'Dizine Geri Dön' : undefined}
          >
            <ArrowLeft size={18} />
            {!isCollapsed && <span>Dizine Dön</span>}
          </button>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            className={styles.collapseToggle}
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Paneli Genişlet' : 'Paneli Daralt'}
            title={isCollapsed ? 'Genişlet (Ctrl+B)' : 'Daralt (Ctrl+B)'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!isCollapsed && <span>Paneli Küçült</span>}
          </button>

          {/* User Status Card */}
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>
              {currentUser?.avatar || 'TC'}
            </div>
            {!isCollapsed && (
              <div className={styles.userInfo}>
                <span className={styles.userName}>{currentUser?.name || 'Tahsin Cr'}</span>
                <span className={styles.userRoleBadge}>
                  {currentUser?.role?.toUpperCase() || 'ADMIN'}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
