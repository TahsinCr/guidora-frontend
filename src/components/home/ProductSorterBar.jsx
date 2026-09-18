import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, LayoutGrid, List, SlidersHorizontal, Check } from 'lucide-react';
import styles from './ProductSorterBar.module.scss';

export default function ProductSorterBar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  isMobileFilterOpen,
  onToggleMobileFilter,
}) {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all');

  const sortRef = useRef(null);
  const timeRef = useRef(null);

  const sortOptions = [
    { id: 'relevance', label: 'Relevance' },
    { id: 'highest-rated', label: 'Highest Rated' },
    { id: 'most-viewed', label: 'Most Viewed' },
    { id: 'newest', label: 'Newest First' },
  ];

  const timeOptions = [
    { id: 'all', label: 'Top' },
    { id: 'month', label: 'This Month' },
    { id: 'week', label: 'This Week' },
  ];

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setIsSortOpen(false);
      }
      if (timeRef.current && !timeRef.current.contains(e.target)) {
        setIsTimeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const currentSortLabel = sortOptions.find((o) => o.id === sort)?.label || 'Relevance';
  const currentTimeLabel = timeOptions.find((o) => o.id === timeFilter)?.label || 'Top';

  return (
    <div className={styles.sorterBar}>
      <div className={styles.searchBox}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search 12,000+ tools, prompts..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {search && (
          <button
            className={styles.clearBtn}
            onClick={() => onSearchChange('')}
            title="Clear"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className={styles.actionsRow}>
        <button
          className={`${styles.filterMobileBtn} ${isMobileFilterOpen ? styles.active : ''}`}
          onClick={onToggleMobileFilter}
        >
          <SlidersHorizontal size={15} />
          <span>Filters</span>
        </button>

        {/* View Toggle */}
        <div className={styles.viewTogglePill}>
          <button
            className={`${styles.toggleBtn} ${viewMode === 'grid' ? styles.active : ''}`}
            onClick={() => onViewModeChange('grid')}
            title="Grid View"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.active : ''}`}
            onClick={() => onViewModeChange('list')}
            title="List View"
          >
            <List size={16} />
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className={styles.customDropdown} ref={sortRef}>
          <button
            className={`${styles.dropdownTrigger} ${isSortOpen ? styles.open : ''}`}
            onClick={() => {
              setIsSortOpen(!isSortOpen);
              setIsTimeOpen(false);
            }}
          >
            <span>{currentSortLabel}</span>
            <ChevronDown size={14} className={`${styles.chevron} ${isSortOpen ? styles.rotated : ''}`} />
          </button>

          {isSortOpen && (
            <div className={styles.dropdownMenu}>
              {sortOptions.map((opt) => (
                <div
                  key={opt.id}
                  className={`${styles.menuItem} ${sort === opt.id ? styles.selected : ''}`}
                  onClick={() => {
                    onSortChange(opt.id);
                    setIsSortOpen(false);
                  }}
                >
                  <span>{opt.label}</span>
                  {sort === opt.id && <Check size={14} />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Time Dropdown */}
        <div className={styles.customDropdown} ref={timeRef}>
          <button
            className={`${styles.dropdownTrigger} ${isTimeOpen ? styles.open : ''}`}
            onClick={() => {
              setIsTimeOpen(!isTimeOpen);
              setIsSortOpen(false);
            }}
          >
            <span>{currentTimeLabel}</span>
            <ChevronDown size={14} className={`${styles.chevron} ${isTimeOpen ? styles.rotated : ''}`} />
          </button>

          {isTimeOpen && (
            <div className={styles.dropdownMenu}>
              {timeOptions.map((opt) => (
                <div
                  key={opt.id}
                  className={`${styles.menuItem} ${timeFilter === opt.id ? styles.selected : ''}`}
                  onClick={() => {
                    setTimeFilter(opt.id);
                    setIsTimeOpen(false);
                  }}
                >
                  <span>{opt.label}</span>
                  {timeFilter === opt.id && <Check size={14} />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
