import React, { useRef, useEffect } from 'react';
import ProductCard from './ProductCard';
import ProductSorterBar from './ProductSorterBar';
import FilterBar from './FilterBar';
import { Sparkles } from 'lucide-react';
import styles from './ProductGrid.module.scss';

export default function ProductGrid({
  tools,
  isLoading,
  viewMode,
  onViewModeChange,
  search,
  onSearchChange,
  categories = [],
  selectedCategory,
  onSelectCategory,
  selectedCategories = [],
  onSelectedCategoriesChange,
  selectedTags = [],
  onSelectedTagsChange,
  sort,
  onSortChange,
  filterVerified,
  onFilterVerifiedChange,
  verification,
  onVerificationChange,
  filterPricing,
  onFilterPricingChange,
  platform,
  onPlatformChange,
  onResetFilters,
  isMobileFilterOpen,
  onToggleMobileFilter,
  onOpenDetail,
  hasMore,
  isLoadingMore,
  onLoadMore,
}) {
  const sentinelRef = useRef(null);

  // Infinite Scroll IntersectionObserver: Pre-fetches when 600px before end of page!
  useEffect(() => {
    if (!hasMore || isLoadingMore || !onLoadMore) return;

    const currentSentinel = sentinelRef.current;
    if (!currentSentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          onLoadMore();
        }
      },
      {
        root: null,
        rootMargin: '600px', // Pre-fetches 600px before the user reaches the bottom for seamless UX!
        threshold: 0,
      }
    );

    observer.observe(currentSentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoadingMore, onLoadMore]);

  return (
    <div className={styles.contentLayout}>
      <FilterBar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
        selectedCategories={selectedCategories}
        onSelectedCategoriesChange={onSelectedCategoriesChange}
        selectedTags={selectedTags}
        onSelectedTagsChange={onSelectedTagsChange}
        filterVerified={filterVerified}
        onFilterVerifiedChange={onFilterVerifiedChange}
        verification={verification}
        onVerificationChange={onVerificationChange}
        onResetFilters={onResetFilters}
        isOpenMobile={isMobileFilterOpen}
        onCloseMobile={() => onToggleMobileFilter()}
      />

      <section className={styles.mainSection}>
        {/* Animated Mobile/Responsive Inline Filter Accordion */}
        <div
          className={`${styles.inlineFilterWrapper} ${
            isMobileFilterOpen ? styles.inlineFilterOpen : ''
          }`}
          aria-hidden={!isMobileFilterOpen}
        >
          <div className={styles.inlineFilterInner}>
            <FilterBar
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={onSelectCategory}
              selectedCategories={selectedCategories}
              onSelectedCategoriesChange={onSelectedCategoriesChange}
              selectedTags={selectedTags}
              onSelectedTagsChange={onSelectedTagsChange}
              filterVerified={filterVerified}
              onFilterVerifiedChange={onFilterVerifiedChange}
              verification={verification}
              onVerificationChange={onVerificationChange}
              onResetFilters={onResetFilters}
              isInline={true}
            />
          </div>
        </div>

        <ProductSorterBar
          search={search}
          onSearchChange={onSearchChange}
          sort={sort}
          onSortChange={onSortChange}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          isMobileFilterOpen={isMobileFilterOpen}
          onToggleMobileFilter={onToggleMobileFilter}
        />

        {isLoading ? (
          <div className={styles.productGrid}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
              <div key={n} className={styles.skeletonCard} />
            ))}
          </div>
        ) : tools.length === 0 ? (
          <div className={styles.emptyState}>
            <Sparkles size={32} color="var(--brand-blue)" />
            <h3 className={styles.emptyTitle}>No tools match your criteria</h3>
            <p className={styles.emptyDesc}>
              Try adjusting your search keywords, clear active filters, or pick another category.
            </p>
            <button className={styles.clearBtn} onClick={onResetFilters}>
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className={`${styles.productGrid} ${viewMode === 'list' ? styles.listView : ''}`}>
            {tools.map((tool, idx) => (
              <ProductCard
                key={`${tool.id}-${idx}`}
                tool={tool}
                viewMode={viewMode}
                onOpenDetail={onOpenDetail}
              />
            ))}
          </div>
        )}

        {/* Infinite Scroll Sentinel Element */}
        <div ref={sentinelRef} className={styles.scrollSentinel} aria-hidden="true" />

        {/* Loading More Indicator */}
        {isLoadingMore && (
          <div className={styles.loadingMoreWrapper}>
            <div className={styles.pulsingDot} />
            <span className={styles.loadingText}>Loading more tools...</span>
          </div>
        )}
      </section>
    </div>
  );
}
