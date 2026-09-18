import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import InformationCard from '@/components/home/InformationCard';
import ProductGrid from '@/components/home/ProductGrid';
import ToolDialog from '@/components/tool-detail/ToolDialog';
import SubmitToolPage from '@/components/submit/SubmitToolPage';
import { getTools, getCategories } from '@/services/toolsService';

export default function App() {
  const [categories, setCategories] = useState([]);
  
  // Read initial filter values from URL params
  const initialParams = new URLSearchParams(window.location.search);
  const initialCat = initialParams.get('cat') || 'all';
  const initialTags = initialParams.get('tags') ? initialParams.get('tags').split(',').filter(Boolean) : [];
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
  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState(initialSort);
  const [filterVerified, setFilterVerified] = useState(false);
  const [verification, setVerification] = useState(initialVer);
  const [viewMode, setViewMode] = useState('grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [tools, setTools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Full-page Submit Tool view state synchronized with URL (?view=submit)
  const [isSubmitView, setIsSubmitView] = useState(() => {
    return initialParams.get('view') === 'submit';
  });

  // Active tool for detail view - synchronized with URL (?tool=id)
  const [activeToolId, setActiveToolId] = useState(() => {
    return initialParams.get('tool') || null;
  });
  const [activeToolData, setActiveToolData] = useState(null);

  // Load categories
  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
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
    if (isSubmitView || activeToolId) return;

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
  }, [selectedCategory, selectedCategories, selectedTags, search, sort, verification, isSubmitView, activeToolId]);

  // Fetch tools whenever filters change (reset to page 1)
  useEffect(() => {
    setIsLoading(true);
    setPage(1);
    getTools({
      category: selectedCategory,
      selectedCategories,
      selectedTags,
      search,
      sort,
      filterVerified,
      verification,
      page: 1,
      limit: 12,
    })
      .then((data) => {
        setTools(data.items || []);
        setHasMore(data.hasMore || false);
        setTotalCount(data.total || 0);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching tools:', err);
        setIsLoading(false);
      });
  }, [selectedCategory, selectedCategories, selectedTags, search, sort, filterVerified, verification]);

  // Load more tools (infinite scroll pagination)
  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;

    getTools({
      category: selectedCategory,
      selectedCategories,
      selectedTags,
      search,
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
  }, [page, hasMore, isLoadingMore, selectedCategory, selectedCategories, selectedTags, search, sort, filterVerified, verification]);

  // Handle URL sync and browser back/forward buttons (no page reload)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tool = params.get('tool');
      const view = params.get('view');
      setActiveToolId(tool || null);
      setIsSubmitView(view === 'submit');
      if (!tool) setActiveToolData(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleOpenTool = useCallback((toolId) => {
    setIsSubmitView(false);
    setActiveToolId(toolId);
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    url.searchParams.set('tool', toolId);
    window.history.pushState({ toolId }, '', url.toString());
  }, []);

  const handleOpenSubmit = useCallback(() => {
    setActiveToolId(null);
    setActiveToolData(null);
    setIsSubmitView(true);
    const url = new URL(window.location.href);
    url.searchParams.delete('tool');
    url.searchParams.set('view', 'submit');
    window.history.pushState({ view: 'submit' }, '', url.toString());
  }, []);

  const handleCloseTool = useCallback(() => {
    setActiveToolId(null);
    setActiveToolData(null);
    setIsSubmitView(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('tool');
    url.searchParams.delete('view');
    window.history.pushState({}, '', url.toString());
  }, []);

  const handleResetFilters = useCallback(() => {
    setActiveToolId(null);
    setActiveToolData(null);
    setIsSubmitView(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('tool');
    url.searchParams.delete('view');
    url.searchParams.delete('cat');
    url.searchParams.delete('tags');
    url.searchParams.delete('q');
    url.searchParams.delete('sort');
    url.searchParams.delete('admin');
    url.searchParams.delete('community');
    url.searchParams.delete('bot');
    window.history.pushState({}, '', url.toString());

    setSelectedCategory('all');
    setSelectedCategories([]);
    setSelectedTags([]);
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
      search,
      sort,
      filterVerified,
      verification,
      page: 1,
      limit: 12,
    }).then((data) => {
      setTools(data.items || []);
      setTotalCount(data.total || 0);
      setHasMore(data.hasMore || false);
    });

    if (newTool?.id) {
      handleOpenTool(newTool.id);
    } else {
      handleCloseTool();
    }
  }, [selectedCategory, selectedCategories, selectedTags, search, sort, filterVerified, verification, handleOpenTool, handleCloseTool]);

  return (
    <div className="app-container">
      <Header
        onResetSearch={handleResetFilters}
        activeTool={activeToolData}
        onBackToDirectory={handleCloseTool}
        onSelectCategory={(catId) => {
          handleCloseTool();
          handleSelectTopCategory(catId);
        }}
        onSubmitTool={handleOpenSubmit}
      />

      <main className="main-content">
        {isSubmitView ? (
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
      </main>

      <Footer />
    </div>
  );
}
