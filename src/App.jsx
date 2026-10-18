import { useState, useEffect, useCallback, useTransition, lazy, Suspense } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import InformationCard from '@/components/home/InformationCard';
import ProductGrid from '@/components/home/ProductGrid';
import ScrollToTop from '@/components/common/ScrollToTop';
import PageLoader from '@/components/common/PageLoader';
import { useDebounce } from '@/hooks/useDebounce';
import { getTools, getCategories } from '@/services/toolsService';
import { getCurrentUser } from '@/services/userService';
import ToastContainer from '@/components/common/ToastContainer';
import MaintenancePage from '@/components/common/MaintenancePage';
import { isMaintenanceActive, getScheduledMaintenanceDetails } from '@/services/config/maintenanceHelper';
import { networkTracker } from '@/services/api/networkTracker';
import { toast } from '@/services/toast/toastService';
import { restoreSession } from '@/services/authService';

import AdminDashboardPage from '@/components/admin/AdminDashboardPage';
import ErrorBoundary from '@/components/common/ErrorBoundary';

// Lazy-loaded heavy views and secondary modals (Code Splitting)
const ToolDialog = lazy(() => import('@/components/tool-detail/ToolDialog'));
const SubmitToolPage = lazy(() => import('@/components/submit/SubmitToolPage'));
const UserProfilePage = lazy(() => import('@/components/profile/UserProfilePage'));
const AuthModal = lazy(() => import('@/components/auth/AuthModal'));
const NotificationDrawer = lazy(() => import('@/components/notifications/NotificationDrawer'));
const AccountSettingsModal = lazy(() => import('@/components/settings/AccountSettingsModal'));

export default function App() {
  const [isNavigating, startTransition] = useTransition();
  const [isMaintenance, setIsMaintenance] = useState(() => isMaintenanceActive());
  const [categories, setCategories] = useState([]);
  
  // Scheduled Maintenance Handler
  useEffect(() => {
    if (isMaintenance) return;

    const sched = getScheduledMaintenanceDetails();
    if (!sched || !sched.isScheduled) return;

    if (sched.isStarted) {
      setIsMaintenance(true);
      return;
    }

    // Show dismissible warning toast once per session
    const toastKey = 'guidora_sched_toast_shown';
    if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(toastKey)) {
      toast.warning('Planlı Bakım Bildirimi', sched.scheduledWarningDescription, {
        id: 'toast_sched_maintenance',
        durationMs: 8000,
      });
      sessionStorage.setItem(toastKey, 'true');
    }

    // Timer to switch to maintenance mode with graceful draining
    const timer = setTimeout(async () => {
      // Graceful drain: wait for in-flight requests to complete before locking UI
      await networkTracker.waitForInFlight(5000);
      setIsMaintenance(true);
    }, sched.remainingSeconds * 1000);

    return () => clearTimeout(timer);
  }, [isMaintenance]);
  
  // Read initial filter values from URL params
  const initialParams = new URLSearchParams(window.location.search);
  const initialCat = initialParams.get('cat') || 'all';
  const initialTags = initialParams.get('tags') ? initialParams.get('tags').split(',').filter(Boolean) : [];
  const initialOrgs = initialParams.get('orgs') ? initialParams.get('orgs').split(',').filter(Boolean) : [];
  const initialSearch = initialParams.get('q') || '';
  const initialSort = initialParams.get('sort') || 'relevance';
  const initialVer = {
    admin: initialParams.get('admin') === 'true',
    community: initialParams.get('community') === 'true',
    bot: initialParams.get('bot') === 'true',
  };

  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [selectedCategories, setSelectedCategories] = useState(() => {
    return initialCat !== 'all' ? [initialCat] : [];
  });
  const [selectedTags, setSelectedTags] = useState(initialTags);
  const [selectedOrganizations, setSelectedOrganizations] = useState(initialOrgs);
  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebounce(search, 250);
  const [sort, setSort] = useState(initialSort);
  const [filterVerified, setFilterVerified] = useState(false);
  const [verification, setVerification] = useState(initialVer);
  const [viewMode, setViewMode] = useState('grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [tools, setTools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Full-page Submit Tool view state synchronized with URL (?view=submit)
  const [isSubmitView, setIsSubmitView] = useState(() => {
    return initialParams.get('view') === 'submit';
  });

  // User Profile view state synchronized with URL (?view=profile or ?user=id)
  const [isProfileView, setIsProfileView] = useState(() => {
    return initialParams.get('view') === 'profile' || Boolean(initialParams.get('user'));
  });
  const [profileUserId, setProfileUserId] = useState(() => {
    return initialParams.get('user') || null;
  });

  // Admin Dashboard view state synchronized with URL (?view=admin)
  const [isAdminView, setIsAdminView] = useState(() => {
    return initialParams.get('view') === 'admin';
  });

  // Current logged in user state
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());

  useEffect(() => {
    const handleAuthEvent = (e) => {
      setCurrentUser(e.detail);
      if (!e.detail) {
        // If an explicit logout occurred, close modals and views
        setIsProfileView(false);
        setIsSubmitView(false);
        setActiveToolId(null);
        setActiveToolData(null);
        setIsSettingsModalOpen(false);
        setIsNotifDrawerOpen(false);
        setIsAuthModalOpen(false);
      }
    };
    window.addEventListener('guidora_auth_change', handleAuthEvent);
    return () => window.removeEventListener('guidora_auth_change', handleAuthEvent);
  }, []);

  // Modal dialog states: Auth, Notifications, Settings
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('welcome');
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Active tool for detail view - synchronized with URL (?tool=id)
  const [activeToolId, setActiveToolId] = useState(() => {
    return initialParams.get('tool') || null;
  });
  const [activeToolData, setActiveToolData] = useState(null);

  // Load categories and silently restore in-memory session if HttpOnly cookie exists
  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);

    // Silent refresh to populate in-memory AccessToken on page reload/startup
    restoreSession();

    // Warm up chunks during browser idle time for zero-latency interactions
    const prefetchIdle = () => {
      import('@/components/tool-detail/ToolDialog');
      import('@/components/auth/AuthModal');
    };

    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(prefetchIdle, { timeout: 2500 });
      } else {
        setTimeout(prefetchIdle, 1200);
      }
    }
  }, []);

  // Category Synchronization: Top hero category selection updates selectedCategories
  const handleSelectTopCategory = useCallback((catId) => {
    setSelectedCategory(catId);
    if (catId === 'all') {
      setSelectedCategories([]);
    } else {
      setSelectedCategories([catId]);
    }
  }, []);

  // Category Synchronization: FilterBar category selection updates top selectedCategory
  const handleSelectedCategoriesChange = useCallback((newCategories) => {
    setSelectedCategories(newCategories);
    if (newCategories.length === 1) {
      setSelectedCategory(newCategories[0]);
    } else if (newCategories.length === 0) {
      setSelectedCategory('all');
    } else {
      setSelectedCategory(newCategories[0]);
    }
  }, []);

  // Update browser URL query params without reloading the page
  useEffect(() => {
    if (isSubmitView || isProfileView || activeToolId || isAdminView) return;

    const url = new URL(window.location.href);
    
    // Category param
    if (selectedCategory && selectedCategory !== 'all') {
      url.searchParams.set('cat', selectedCategory);
    } else if (selectedCategories.length > 0) {
      url.searchParams.set('cat', selectedCategories.join(','));
    } else {
      url.searchParams.delete('cat');
    }

    // Tags param
    if (selectedTags && selectedTags.length > 0) {
      url.searchParams.set('tags', selectedTags.join(','));
    } else {
      url.searchParams.delete('tags');
    }

    // Organizations param
    if (selectedOrganizations && selectedOrganizations.length > 0) {
      url.searchParams.set('orgs', selectedOrganizations.join(','));
    } else {
      url.searchParams.delete('orgs');
    }

    // Search param
    if (search && search.trim()) {
      url.searchParams.set('q', search.trim());
    } else {
      url.searchParams.delete('q');
    }

    // Sort param
    if (sort && sort !== 'relevance') {
      url.searchParams.set('sort', sort);
    } else {
      url.searchParams.delete('sort');
    }

    // Verification params
    if (verification.admin) url.searchParams.set('admin', 'true');
    else url.searchParams.delete('admin');

    if (verification.community) url.searchParams.set('community', 'true');
    else url.searchParams.delete('community');

    if (verification.bot) url.searchParams.set('bot', 'true');
    else url.searchParams.delete('bot');

    window.history.replaceState({}, '', url.toString());
  }, [selectedCategory, selectedCategories, selectedTags, selectedOrganizations, search, sort, verification, isSubmitView, isProfileView, activeToolId, isAdminView]);

  // Fetch tools whenever filters change (reset to page 1)
  useEffect(() => {
    setIsLoading(true);
    setPage(1);
    getTools({
      category: selectedCategory,
      selectedCategories,
      selectedTags,
      selectedOrganizations,
      search: debouncedSearch,
      sort,
      filterVerified,
      verification,
      page: 1,
      limit: 12,
    })
      .then((data) => {
        setTools(data.items || []);
        setHasMore(data.hasMore || false);
        setIsLoading(false);
        setIsInitialLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching tools:', err);
        setIsLoading(false);
        setIsInitialLoading(false);
      });
  }, [selectedCategory, selectedCategories, selectedTags, selectedOrganizations, debouncedSearch, sort, filterVerified, verification]);

  // Load more tools (infinite scroll pagination)
  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;

    getTools({
      category: selectedCategory,
      selectedCategories,
      selectedTags,
      selectedOrganizations,
      search: debouncedSearch,
      sort,
      filterVerified,
      verification,
      page: nextPage,
      limit: 12,
    })
      .then((data) => {
        setTools(data.items || []);
        setHasMore(data.hasMore || false);
        setPage(nextPage);
        setIsLoadingMore(false);
      })
      .catch((err) => {
        console.error('Error loading more tools:', err);
        setIsLoadingMore(false);
      });
  }, [page, hasMore, isLoadingMore, selectedCategory, selectedCategories, selectedTags, selectedOrganizations, debouncedSearch, sort, filterVerified, verification]);

  // Handle URL sync and browser back/forward buttons (no page reload)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tool = params.get('tool');
      const view = params.get('view');
      const user = params.get('user');
      startTransition(() => {
        setActiveToolId(tool || null);
        setIsSubmitView(view === 'submit');
        setIsProfileView(view === 'profile' || Boolean(user));
        setIsAdminView(view === 'admin');
        setProfileUserId(user || null);
        if (!tool) setActiveToolData(null);
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [startTransition]);

  const handleOpenTool = useCallback((toolId) => {
    startTransition(() => {
      setIsSubmitView(false);
      setIsProfileView(false);
      setIsAdminView(false);
      setActiveToolId(toolId);
    });
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    url.searchParams.delete('user');
    url.searchParams.set('tool', toolId);
    window.history.pushState({ toolId }, '', url.toString());
  }, [startTransition]);

  const handleOpenSubmit = useCallback(() => {
    startTransition(() => {
      setActiveToolId(null);
      setActiveToolData(null);
      setIsProfileView(false);
      setIsAdminView(false);
      setIsSubmitView(true);
    });
    const url = new URL(window.location.href);
    url.searchParams.delete('tool');
    url.searchParams.delete('user');
    url.searchParams.set('view', 'submit');
    window.history.pushState({ view: 'submit' }, '', url.toString());
  }, [startTransition]);

  const handleOpenProfile = useCallback((userId) => {
    startTransition(() => {
      setActiveToolId(null);
      setActiveToolData(null);
      setIsSubmitView(false);
      setIsAdminView(false);
      setIsProfileView(true);
      setProfileUserId(userId || null);
    });
    const url = new URL(window.location.href);
    url.searchParams.delete('tool');
    if (userId) {
      url.searchParams.set('user', userId);
      url.searchParams.delete('view');
    } else {
      url.searchParams.set('view', 'profile');
      url.searchParams.delete('user');
    }
    window.history.pushState({ view: 'profile', user: userId }, '', url.toString());
  }, [startTransition]);

  const handleOpenAdmin = useCallback(() => {
    startTransition(() => {
      setActiveToolId(null);
      setActiveToolData(null);
      setIsSubmitView(false);
      setIsProfileView(false);
      setIsAdminView(true);
    });
    const url = new URL(window.location.href);
    url.searchParams.delete('tool');
    url.searchParams.delete('user');
    url.searchParams.set('view', 'admin');
    window.history.pushState({ view: 'admin' }, '', url.toString());
  }, [startTransition]);

  const handleCloseTool = useCallback(() => {
    startTransition(() => {
      setActiveToolId(null);
      setActiveToolData(null);
      setIsSubmitView(false);
      setIsProfileView(false);
      setIsAdminView(false);
    });
    const url = new URL(window.location.href);
    url.searchParams.delete('tool');
    url.searchParams.delete('view');
    url.searchParams.delete('user');
    window.history.pushState({}, '', url.toString());
  }, [startTransition]);

  const handleResetFilters = useCallback(() => {
    startTransition(() => {
      setActiveToolId(null);
      setActiveToolData(null);
      setIsSubmitView(false);
      setIsProfileView(false);
    });
    const url = new URL(window.location.href);
    url.searchParams.delete('tool');
    url.searchParams.delete('view');
    url.searchParams.delete('user');
    url.searchParams.delete('cat');
    url.searchParams.delete('tags');
    url.searchParams.delete('orgs');
    url.searchParams.delete('q');
    url.searchParams.delete('sort');
    url.searchParams.delete('admin');
    url.searchParams.delete('community');
    url.searchParams.delete('bot');
    window.history.pushState({}, '', url.toString());

    setSelectedCategory('all');
    setSelectedCategories([]);
    setSelectedTags([]);
    setSelectedOrganizations([]);
    setSearch('');
    setSort('relevance');
    setFilterVerified(false);
    setVerification({ admin: false, community: false, bot: false });
    setIsMobileFilterOpen(false);
  }, []);

  const handleToolCreated = useCallback((newTool) => {
    // Refresh tools list
    getTools({
      category: selectedCategory,
      selectedCategories,
      selectedTags,
      selectedOrganizations,
      search,
      sort,
      filterVerified,
      verification,
      page: 1,
      limit: 12,
    }).then((data) => {
      setTools(data.items || []);
      setHasMore(data.hasMore || false);
    });

    if (newTool?.id) {
      handleOpenTool(newTool.id);
    } else {
      handleCloseTool();
    }
  }, [selectedCategory, selectedCategories, selectedTags, selectedOrganizations, search, sort, filterVerified, verification, handleOpenTool, handleCloseTool]);

  const handleOpenAuth = useCallback((mode = 'welcome') => {
    startTransition(() => {
      setAuthModalMode(mode);
      setIsAuthModalOpen(true);
    });
  }, [startTransition]);

  const handleOpenNotifications = useCallback(() => {
    startTransition(() => {
      setIsNotifDrawerOpen(true);
    });
  }, [startTransition]);

  const handleOpenSettings = useCallback(() => {
    startTransition(() => {
      setIsSettingsModalOpen(true);
    });
  }, [startTransition]);

  if (isMaintenance) {
    return (
      <div className="app-container">
        <MaintenancePage onUnlock={() => setIsMaintenance(false)} />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="app-container">
      {!isAdminView && (
        <Header
          currentUser={currentUser}
          onResetSearch={handleResetFilters}
          activeTool={activeToolData}
          onBackToDirectory={handleCloseTool}
          onSelectCategory={(catId) => {
            handleCloseTool();
            handleSelectTopCategory(catId);
          }}
          onSubmitTool={handleOpenSubmit}
          onOpenProfile={handleOpenProfile}
          onOpenAdmin={handleOpenAdmin}
          onOpenNotifications={handleOpenNotifications}
          onOpenAuth={handleOpenAuth}
          onOpenSettings={handleOpenSettings}
          onUserChange={(updatedUser) => setCurrentUser(updatedUser)}
          isNavigating={isNavigating}
        />
      )}

      <main className={isAdminView ? undefined : "main-content"}>
        <Suspense fallback={null}>
          {isAdminView ? (
            <ErrorBoundary
              title="Admin Paneli Yüklenemedi"
              onReset={() => {
                const url = new URL(window.location.href);
                url.searchParams.delete('view');
                window.location.href = url.pathname;
              }}
            >
              <AdminDashboardPage
                onBack={handleCloseTool}
                onOpenTool={handleOpenTool}
              />
            </ErrorBoundary>
          ) : isProfileView ? (
            <UserProfilePage
              userId={profileUserId}
              onBack={handleCloseTool}
              onOpenTool={handleOpenTool}
              onOpenAdmin={handleOpenAdmin}
            />
          ) : isSubmitView ? (
            <SubmitToolPage
              onBack={handleCloseTool}
              onToolCreated={handleToolCreated}
            />
          ) : activeToolId ? (
            <ToolDialog
              toolId={activeToolId}
              onClose={handleCloseTool}
              onSelectTool={handleOpenTool}
              onToolLoaded={setActiveToolData}
            />
          ) : isInitialLoading ? (
            <PageLoader
              variant="page"
              text="Guidora kataloğu hazırlanıyor..."
              subtext="En iyi geliştirici ve tasarım araçları listeleniyor"
            />
          ) : (
            <>
              <InformationCard
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectTopCategory}
              />

              <ProductGrid
                tools={tools}
                isLoading={isLoading}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                search={search}
                onSearchChange={setSearch}
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectTopCategory}
                selectedCategories={selectedCategories}
                onSelectedCategoriesChange={handleSelectedCategoriesChange}
                selectedOrganizations={selectedOrganizations}
                onSelectedOrganizationsChange={setSelectedOrganizations}
                selectedTags={selectedTags}
                onSelectedTagsChange={setSelectedTags}
                sort={sort}
                onSortChange={setSort}
                filterVerified={filterVerified}
                onFilterVerifiedChange={setFilterVerified}
                verification={verification}
                onVerificationChange={setVerification}
                onResetFilters={handleResetFilters}
                isMobileFilterOpen={isMobileFilterOpen}
                onToggleMobileFilter={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                onOpenDetail={handleOpenTool}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
                onLoadMore={handleLoadMore}
              />
            </>
          )}
        </Suspense>
      </main>

      {!isAdminView && <ScrollToTop />}

      {!isInitialLoading && !isAdminView && <Footer />}

      {/* Auth Modal (Login / Register / Welcome) */}
      <Suspense fallback={null}>
        {isAuthModalOpen && (
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            initialMode={authModalMode}
            onLoginSuccess={(user) => {
              setCurrentUser(user);
            }}
          />
        )}
      </Suspense>

      {/* Notifications Drawer */}
      <Suspense fallback={null}>
        {isNotifDrawerOpen && (
          <NotificationDrawer
            isOpen={isNotifDrawerOpen}
            onClose={() => setIsNotifDrawerOpen(false)}
            onOpenTool={handleOpenTool}
          />
        )}
      </Suspense>

      {/* Account Settings & Security Modal */}
      <Suspense fallback={null}>
        {isSettingsModalOpen && (
          <AccountSettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            user={currentUser}
          />
        )}
      </Suspense>

      <ToastContainer />
    </div>
  );
}
