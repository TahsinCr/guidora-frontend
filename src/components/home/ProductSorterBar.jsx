import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
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
  const { t } = useLanguage();
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all');

  const sortRef = useRef(null);
  const timeRef = useRef(null);
  const [sortAlign, setSortAlign] = useState('right');
  const [timeAlign, setTimeAlign] = useState('left');

  const handleToggleSort = () => {
    if (!isSortOpen && sortRef.current) {
      const rect = sortRef.current.getBoundingClientRect();
      setSortAlign(rect.left < 190 ? 'left' : 'right');
    }
    setIsSortOpen(!isSortOpen);
    setIsTimeOpen(false);
  };

  const handleToggleTime = () => {
    if (!isTimeOpen && timeRef.current) {
      const rect = timeRef.current.getBoundingClientRect();
      setTimeAlign(rect.left < 190 ? 'left' : 'right');
    }
    setIsTimeOpen(!isTimeOpen);
    setIsSortOpen(false);
  };

  const sortOptions = [
    { id: 'relevance', label: t('sorter.relevance', 'Relevance') },
    { id: 'highest-rated', label: t('sorter.highestRated', 'Highest Rated') },
    { id: 'most-viewed', label: t('sorter.mostViewed', 'Most Viewed') },
    { id: 'newest', label: t('sorter.newest', 'Newest First') },
  ];

  const timeOptions = [
    { id: 'all', label: t('sorter.timeAll', 'Top') },
    { id: 'month', label: t('sorter.timeMonth', 'This Month') },
    { id: 'week', label: t('sorter.timeWeek', 'This Week') },
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
          placeholder={t('sorter.searchPlaceholder', 'Search 12,000+ tools, prompts...')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {search && (
          <button
            className={styles.clearBtn}
            onClick={() => onSearchChange('')}
            title={t('common.clear', 'Clear')}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className={styles.actionsRow}>
        <div className={styles.actionControlsGroup}>
          <button
            className={`${styles.filterMobileBtn} ${isMobileFilterOpen ? styles.active : ''}`}
            onClick={onToggleMobileFilter}
          >
            <SlidersHorizontal size={15} />
            <span>{t('sorter.filters', 'Filters')}</span>
          </button>

          {/* View Toggle */}
          <div className={styles.viewTogglePill}>
            <button
              className={`${styles.toggleBtn} ${viewMode === 'grid' ? styles.active : ''}`}
              onClick={() => onViewModeChange('grid')}
              title={t('sorter.gridView', 'Grid View')}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.active : ''}`}
              onClick={() => onViewModeChange('list')}
              title={t('sorter.listView', 'List View')}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        <div className={styles.actionDropdownsGroup}>
          {/* Sort Dropdown */}
          <div className={styles.customDropdown} ref={sortRef}>
            <button
              className={`${styles.dropdownTrigger} ${isSortOpen ? styles.open : ''}`}
              onClick={handleToggleSort}
            >
              <span>{currentSortLabel}</span>
              <ChevronDown size={14} className={`${styles.chevron} ${isSortOpen ? styles.rotated : ''}`} />
            </button>

            {isSortOpen && (
              <div className={`${styles.dropdownMenu} ${sortAlign === 'left' ? styles.alignLeft : styles.alignRight}`}>
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
              onClick={handleToggleTime}
            >
              <span>{currentTimeLabel}</span>
              <ChevronDown size={14} className={`${styles.chevron} ${isTimeOpen ? styles.rotated : ''}`} />
            </button>

            {isTimeOpen && (
              <div className={`${styles.dropdownMenu} ${timeAlign === 'left' ? styles.alignLeft : styles.alignRight}`}>
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
    </div>
  );
}
