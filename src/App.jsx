import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import InformationCard from '@/components/home/InformationCard';
import ProductGrid from '@/components/home/ProductGrid';
import ToolDialog from '@/components/tool-detail/ToolDialog';
import SubmitToolModal from '@/components/submit/SubmitToolModal';
import { getTools, getCategories } from '@/services/toolsService';

export default function App() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('relevance');
  const [filterVerified, setFilterVerified] = useState(false);
  const [verification, setVerification] = useState({ admin: false, community: false, bot: false });
  const [filterPricing, setFilterPricing] = useState('all');
  const [platform, setPlatform] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [tools, setTools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Submit Modal state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Active tool for dialog - synchronized with URL
  const [activeToolId, setActiveToolId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tool') || null;
  });
  const [activeToolData, setActiveToolData] = useState(null);

  // Load categories
  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  // Fetch tools whenever filters change (reset to page 1)
  useEffect(() => {
    setIsLoading(true);
    setPage(1);
    getTools({
      category: selectedCategory,
      search,
      sort,
      filterVerified,
      verification,
      filterPricing,
      platform,
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
  }, [selectedCategory, search, sort, filterVerified, verification, filterPricing, platform]);

  // Load more tools (infinite scroll pagination)
  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;

    getTools({
      category: selectedCategory,
      search,
      sort,
      filterVerified,
      verification,
      filterPricing,
      platform,
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
  }, [page, hasMore, isLoadingMore, selectedCategory, search, sort, filterVerified, verification, filterPricing, platform]);

  // Handle URL sync and browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tool = params.get('tool');
      setActiveToolId(tool || null);
      if (!tool) setActiveToolData(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleOpenTool = useCallback((toolId) => {
    setActiveToolId(toolId);
    const url = new URL(window.location.href);
    url.searchParams.set('tool', toolId);
    window.history.pushState({ toolId }, '', url.toString());
  }, []);

  const handleCloseTool = useCallback(() => {
    setActiveToolId(null);
    setActiveToolData(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('tool');
    window.history.pushState({}, '', url.toString());
  }, []);

  const handleResetFilters = useCallback(() => {
    setActiveToolId(null);
    setActiveToolData(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('tool');
    window.history.pushState({}, '', url.toString());

    setSelectedCategory('all');
    setSearch('');
    setSort('relevance');
    setFilterVerified(false);
    setVerification({ admin: false, community: false, bot: false });
    setFilterPricing('all');
    setPlatform('all');
    setIsMobileFilterOpen(false);
  }, []);

  const handleToolCreated = useCallback((newTool) => {
    // Refresh tools list
    getTools({
      category: selectedCategory,
      search,
      sort,
      filterVerified,
      verification,
      filterPricing,
      platform,
      page: 1,
      limit: 12,
    }).then((data) => {
      setTools(data.items || []);
      setTotalCount(data.total || 0);
      setHasMore(data.hasMore || false);
    });

    if (newTool?.id) {
      handleOpenTool(newTool.id);
    }
  }, [selectedCategory, search, sort, filterVerified, verification, filterPricing, platform, handleOpenTool]);

  return (
    <div className="app-container">
      <Header
        onResetSearch={handleResetFilters}
        activeTool={activeToolData}
        onBackToDirectory={handleCloseTool}
        onSelectCategory={(catId) => {
          handleCloseTool();
          setSelectedCategory(catId);
        }}
        onSubmitTool={() => setIsSubmitModalOpen(true)}
      />

      <main className="main-content">
        {activeToolId ? (
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
              onSelectCategory={setSelectedCategory}
            />

            <ProductGrid
              tools={tools}
              isLoading={isLoading}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              search={search}
              onSearchChange={setSearch}
              sort={sort}
              onSortChange={setSort}
              filterVerified={filterVerified}
              onFilterVerifiedChange={setFilterVerified}
              verification={verification}
              onVerificationChange={setVerification}
              filterPricing={filterPricing}
              onFilterPricingChange={setFilterPricing}
              platform={platform}
              onPlatformChange={setPlatform}
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

      <SubmitToolModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onToolCreated={handleToolCreated}
      />
    </div>
  );
}
