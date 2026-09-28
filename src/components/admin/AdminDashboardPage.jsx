import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Lock, ArrowLeft } from 'lucide-react';
import {
  adminGetCategories,
  adminGetReports,
  adminGetLogs,
  adminGetProposals,
  adminGetTagCategories,
  adminGetStats,
  adminExportAllData,
  adminImportAllData,
} from '@/services/adminService';
import { getAllTools, getAllReviews } from '@/services/toolsService';
import { getOrganizations, getAllUsers, getCurrentUser } from '@/services/userService';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from '@/services/toast/toastService';

// Admin Sub-Components
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

// Admin Tabs
import OverviewTab from './tabs/OverviewTab';
import SchemaTab from './tabs/SchemaTab';
import LogsTab from './tabs/LogsTab';
import ToolsTab from './tabs/ToolsTab';
import ProposalsTab from './tabs/ProposalsTab';
import CategoriesTab from './tabs/CategoriesTab';
import TagsTab from './tabs/TagsTab';
import UsersTab from './tabs/UsersTab';
import OrganizationsTab from './tabs/OrganizationsTab';
import ReportsTab from './tabs/ReportsTab';
import ReviewsTab from './tabs/ReviewsTab';
import SystemTab from './tabs/SystemTab';

import styles from './AdminDashboardPage.module.scss';

const SIDEBAR_COLLAPSED_KEY = 'guidora_admin_sidebar_collapsed';

export default function AdminDashboardPage({ onBack, onOpenTool }) {
  const { t } = useLanguage();
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';
  const isModerator = currentUser?.role === 'moderator';
  const hasAccess = isAdmin || isModerator;

  // Authorization Guard: Prevent unauthorized direct access via ?view=admin
  if (!hasAccess) {
    return (
      <div className={styles.adminContainer} style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.accessDeniedCard}>
          <div className={styles.accessDeniedIcon}>
            <Lock size={28} />
          </div>
          <h2 className={styles.accessDeniedTitle}>
            {t('admin.accessDenied', '403 — Yetkisiz Erişim')}
          </h2>
          <p className={styles.accessDeniedText}>
            {t('admin.accessDeniedDesc', 'Bu alana yalnızca yetkili platform yöneticileri ve topluluk moderatörleri erişebilir.')}
          </p>
          <button
            type="button"
            className={styles.backHomeBtn}
            onClick={onBack}
          >
            {t('header.backToDirectory', 'Dizine Geri Dön')}
          </button>
        </div>
      </div>
    );
  }

  // Active Tab & Navigation State
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch (e) {
      return false;
    }
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Primary Platform Data States
  const [tools, setTools] = useState([]);
  const [categories, setCategories] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [logs, setLogs] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [tagCategories, setTagCategories] = useState([]);

  // Fetch all administrative data
  const refreshAllData = useCallback(() => {
    try {
      const allT = getAllTools();
      const allC = adminGetCategories();
      const allO = getOrganizations();
      const allU = getAllUsers();
      const allR = adminGetReports();
      const allP = adminGetProposals();
      const allL = adminGetLogs();
      const allRev = getAllReviews();
      const allTC = adminGetTagCategories();

      setTools(allT);
      setCategories(allC);
      setOrganizations(allO);
      setUsers(allU);
      setReports(allR);
      setProposals(allP);
      setLogs(allL);
      if (allRev && typeof allRev.then === 'function') {
        allRev.then((revs) => Array.isArray(revs) && setAllReviews(revs));
      } else if (Array.isArray(allRev)) {
        setAllReviews(allRev);
      }
      setTagCategories(allTC);
    } catch (err) {
      console.error('[AdminDashboardPage] Error loading data:', err);
    }
  }, []);

  useEffect(() => {
    refreshAllData();

    // Listen for taxonomy changes
    const handleTaxonomyChange = () => {
      setCategories(adminGetCategories());
      setTagCategories(adminGetTagCategories());
    };
    window.addEventListener('guidora_taxonomy_change', handleTaxonomyChange);

    // Keyboard shortcut for sidebar toggle (Ctrl+B / Cmd+B)
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('guidora_taxonomy_change', handleTaxonomyChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [refreshAllData]);

  // Toggle Sidebar collapse
  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch (e) {}
      return next;
    });
  };

  // Badges for sidebar
  const badges = useMemo(() => {
    const pendingR = reports.filter((r) => !r.status || r.status === 'pending').length;
    const pendingP = proposals.filter((p) => p.status === 'pending').length;
    const criticalL = logs.filter((l) => l.level === 'CRITICAL').length;

    return {
      schema: 8,
      tables: 8,
      toolsCount: tools.length,
      categoriesCount: categories.length - 1,
      usersCount: users.length,
      pendingReports: pendingR,
      pendingProposals: pendingP,
      criticalLogs: criticalL,
    };
  }, [reports, proposals, logs, tools, categories, users]);

  // Computed platform statistics
  const stats = useMemo(() => {
    return adminGetStats(tools, users);
  }, [tools, users, categories, reports, proposals]);

  // Export Data JSON
  const handleExportData = () => {
    const jsonStr = adminExportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `guidora_platform_backup_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import Data JSON
  const handleImportData = (jsonString) => {
    try {
      adminImportAllData(jsonString);
      refreshAllData();
      toast.success('Yedek başarıyla yüklendi ve tüm veriler güncellendi.');
    } catch (err) {
      toast.error('Yedek yükleme başarısız: ' + err.message);
    }
  };

  return (
    <div className={styles.adminWorkspace}>
      {/* Collapsible Left Navigation Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setGlobalSearch('');
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        badges={badges}
        onBack={onBack}
        currentUser={currentUser}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Administrative Viewport */}
      <div className={`${styles.mainViewport} ${isSidebarCollapsed ? styles.collapsedViewport : ''}`}>
        {/* Top Header Bar */}
        <AdminHeader
          activeTab={activeTab}
          onToggleMobile={() => setIsMobileMenuOpen(true)}
          globalSearch={globalSearch}
          onGlobalSearchChange={setGlobalSearch}
          onExportData={handleExportData}
          onImportData={handleImportData}
          currentUser={currentUser}
        />

        {/* Tab Content Panels */}
        <main className={styles.tabViewport}>
          {activeTab === 'overview' && (
            <OverviewTab
              stats={stats}
              categories={categories}
              tools={tools}
              logs={logs}
              onSelectTab={setActiveTab}
              onInspectLog={() => setActiveTab('logs')}
            />
          )}

          {(activeTab === 'schema' || activeTab === 'database') && (
            <SchemaTab
              tools={tools}
              categories={categories}
            />
          )}

          {activeTab === 'logs' && (
            <LogsTab
              logs={logs}
              onRefreshLogs={() => setLogs(adminGetLogs())}
            />
          )}

          {activeTab === 'tools' && (
            <ToolsTab
              tools={tools}
              categories={categories}
              onRefreshTools={() => setTools(getAllTools())}
              onOpenTool={onOpenTool}
            />
          )}

          {activeTab === 'proposals' && (
            <ProposalsTab
              proposals={proposals}
              onRefreshProposals={() => {
                setProposals(adminGetProposals());
                setTools(getAllTools());
              }}
              onOpenTool={onOpenTool}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesTab
              categories={categories}
              tools={tools}
              onRefreshCategories={() => {
                setCategories(adminGetCategories());
                setTools(getAllTools());
              }}
            />
          )}

          {activeTab === 'tags' && (
            <TagsTab
              tagCategories={tagCategories}
              onRefreshTags={() => setTagCategories(adminGetTagCategories())}
            />
          )}

          {activeTab === 'users' && (
            <UsersTab
              users={users}
              onRefreshUsers={() => setUsers(getAllUsers())}
            />
          )}

          {activeTab === 'organizations' && (
            <OrganizationsTab
              organizations={organizations}
              onRefreshOrgs={() => setOrganizations(getOrganizations())}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsTab
              reports={reports}
              onRefreshReports={() => setReports(adminGetReports())}
              onOpenTool={onOpenTool}
            />
          )}

          {activeTab === 'reviews' && (
            <ReviewsTab
              reviews={allReviews}
              tools={tools}
              onRefreshReviews={() => {
                Promise.resolve(getAllReviews()).then((revs) => {
                  if (Array.isArray(revs)) setAllReviews(revs);
                });
              }}
              onOpenTool={onOpenTool}
            />
          )}

          {activeTab === 'system' && (
            <SystemTab
              onRefreshAll={refreshAllData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
