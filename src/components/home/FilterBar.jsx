import React, { useState, useMemo } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Sparkles,
  Bot,
  X,
  Search,
  Tag,
  Folder,
  Layers,
  Hash,
} from 'lucide-react';
import { TAG_CATEGORIES } from '@/services/mockData';
import styles from './FilterBar.module.scss';

export default function FilterBar({
  categories = [],
  selectedCategory,
  onSelectCategory,
  selectedCategories = [],
  onSelectedCategoriesChange,
  selectedTags = [],
  onSelectedTagsChange,
  verification = { admin: false, community: false, bot: false },
  onVerificationChange,
  onResetFilters,
  isOpenMobile,
  onCloseMobile,
  isInline = false,
}) {
  const [filterQuery, setFilterQuery] = useState('');
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);
  const [isVerificationOpen, setIsVerificationOpen] = useState(true);
  const [showAllCategories, setShowAllCategories] = useState(false);
  
  // Track open/collapsed state for each tag category
  const [openTagSections, setOpenTagSections] = useState({
    platform: true,
    pricing: true,
    capabilities: true,
    deployment: false,
    license: false,
  });

  const toggleTagSection = (sectionId) => {
    setOpenTagSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    const list = categories.filter((c) => c.id !== 'all');
    if (!filterQuery.trim()) return list;
    const q = filterQuery.toLowerCase();
    return list.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, filterQuery]);

  // If a category is selected, hide the others and keep only that one visible.
  // Otherwise, cap to 6 by default, expandable to all via arrow/button.
  const hasSelectedCategory = (selectedCategory && selectedCategory !== 'all') || selectedCategories.length > 0;
  const visibleCategories = useMemo(() => {
    if (hasSelectedCategory) {
      return filteredCategories.filter(
        (c) => selectedCategories.includes(c.id) || selectedCategory === c.id
      );
    }
    if (showAllCategories || filterQuery.trim()) {
      return filteredCategories;
    }
    return filteredCategories.slice(0, 6);
  }, [filteredCategories, hasSelectedCategory, selectedCategories, selectedCategory, showAllCategories, filterQuery]);

  const canExpandCategories = filteredCategories.length > 6 && !filterQuery.trim();

  // Hierarchical tag categories filtered by search
  const filteredTagCategories = useMemo(() => {
    const q = filterQuery.toLowerCase().trim().replace(/^#/, '');
    return TAG_CATEGORIES.map((cat) => {
      const matchingTags = cat.tags.filter((t) => {
        if (!q) return true;
        return t.name.toLowerCase().includes(q) || cat.name.toLowerCase().includes(q);
      });
      return {
        ...cat,
        tags: matchingTags,
      };
    }).filter((cat) => cat.tags.length > 0);
  }, [filterQuery]);

  const handleToggleCategory = (catId) => {
    if (onSelectedCategoriesChange) {
      if (selectedCategories.includes(catId)) {
        onSelectedCategoriesChange(selectedCategories.filter((id) => id !== catId));
      } else {
        onSelectedCategoriesChange([...selectedCategories, catId]);
      }
    } else if (onSelectCategory) {
      onSelectCategory(selectedCategory === catId ? 'all' : catId);
    }
  };

  const handleToggleTag = (tagName, category) => {
    if (!onSelectedTagsChange) return;
    
    // If tag is already selected, unselect it
    if (selectedTags.includes(tagName)) {
      onSelectedTagsChange(selectedTags.filter((t) => t !== tagName));
      return;
    }

    // If this category is single-select, remove other tags belonging to this category first
    let updatedTags = [...selectedTags];
    if (category && category.isSingleSelect) {
      const categoryTagNames = category.tags.map((t) => t.name);
      updatedTags = updatedTags.filter((t) => !categoryTagNames.includes(t));
    }

    onSelectedTagsChange([...updatedTags, tagName]);
  };

  const hasAnyActiveFilters =
    (selectedCategory && selectedCategory !== 'all') ||
    selectedCategories.length > 0 ||
    selectedTags.length > 0 ||
    verification.admin ||
    verification.community ||
    verification.bot;

  return (
    <aside
      className={`${styles.sidebar} ${isInline ? styles.inlineMode : ''} ${
        !isInline && isOpenMobile ? styles.mobileOpen : ''
      }`}
    >
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <span className={styles.title}>Filters</span>
          {hasAnyActiveFilters && (
            <span className={styles.activeCountBadge}>
              {selectedCategories.length + selectedTags.length + (verification.admin ? 1 : 0) + (verification.community ? 1 : 0) + (verification.bot ? 1 : 0)}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {hasAnyActiveFilters && (
            <button className={styles.resetBtn} onClick={onResetFilters}>
              Reset All
            </button>
          )}
          {!isInline && (
            <button className={styles.closeMobileBtn} onClick={onCloseMobile} title="Close">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* FILTER SEARCH INPUT */}
      <div className={styles.filterSearchBox}>
        <Search size={14} className={styles.filterSearchIcon} />
        <input
          type="text"
          className={styles.filterSearchInput}
          placeholder="Filter categories & #tags..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
        />
        {filterQuery && (
          <button
            type="button"
            className={styles.clearSearchBtn}
            onClick={() => setFilterQuery('')}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* CATEGORIES SECTION */}
      <div className={styles.section}>
        <div className={styles.sectionHeader} onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}>
          <span className={styles.headerLabel}>
            <Folder size={13} />
            Categories {selectedCategories.length > 0 && `(${selectedCategories.length})`}
          </span>
          {isCategoriesOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
        {isCategoriesOpen && (
          <div className={styles.optionsList}>
            {visibleCategories.map((cat) => {
              const isChecked =
                selectedCategories.includes(cat.id) || selectedCategory === cat.id;

              return (
                <div
                  key={cat.id}
                  className={`${styles.checkboxItem} ${isChecked ? styles.itemActive : ''}`}
                  onClick={() => handleToggleCategory(cat.id)}
                >
                  <div className={`${styles.squareBox} ${isChecked ? styles.checked : ''}`}>
                    {isChecked && <Check size={11} strokeWidth={3} />}
                  </div>
                  <span
                    className={styles.catDot}
                    style={{ backgroundColor: cat.color || 'var(--primary-color)' }}
                  />
                  <span className={styles.label}>{cat.name}</span>
                  {cat.count && <span className={styles.badgeCount}>{cat.count}</span>}
                </div>
              );
            })}

            {hasSelectedCategory ? (
              <button
                type="button"
                className={styles.showMoreBtn}
                onClick={() => handleToggleCategory(selectedCategory)}
              >
                Show all categories
              </button>
            ) : (
              canExpandCategories && (
                <button
                  type="button"
                  className={styles.showMoreBtn}
                  onClick={() => setShowAllCategories(!showAllCategories)}
                >
                  {showAllCategories ? (
                    <>
                      Show less <ChevronUp size={12} />
                    </>
                  ) : (
                    <>
                      Show {filteredCategories.length - 6} more <ChevronDown size={12} />
                    </>
                  )}
                </button>
              )
            )}
          </div>
        )}
        <div className={styles.divider} />
      </div>

      {/* VERIFICATION SECTION (Placed directly below categories as a special tag/filter) */}
      <div className={styles.section}>
        <div className={styles.sectionHeader} onClick={() => setIsVerificationOpen(!isVerificationOpen)}>
          <span className={styles.headerLabel}>
            <ShieldCheck size={13} />
            Verification
          </span>
          {isVerificationOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
        {isVerificationOpen && (
          <div className={styles.optionsList}>
            <div
              className={styles.checkboxItem}
              onClick={() =>
                onVerificationChange &&
                onVerificationChange({ ...verification, admin: !verification.admin })
              }
            >
              <div className={`${styles.squareBox} ${verification.admin ? styles.checked : ''}`}>
                {verification.admin && <Check size={11} strokeWidth={3} />}
              </div>
              <ShieldCheck size={14} color="#EAB308" />
              <span className={styles.label}>Admin Verified</span>
            </div>

            <div
              className={styles.checkboxItem}
              onClick={() =>
                onVerificationChange &&
                onVerificationChange({ ...verification, community: !verification.community })
              }
            >
              <div className={`${styles.squareBox} ${verification.community ? styles.checked : ''}`}>
                {verification.community && <Check size={11} strokeWidth={3} />}
              </div>
              <Sparkles size={14} color="#10B981" />
              <span className={styles.label}>Community Choice</span>
            </div>

            <div
              className={styles.checkboxItem}
              onClick={() =>
                onVerificationChange &&
                onVerificationChange({ ...verification, bot: !verification.bot })
              }
            >
              <div className={`${styles.squareBox} ${verification.bot ? styles.checked : ''}`}>
                {verification.bot && <Check size={11} strokeWidth={3} />}
              </div>
              <Bot size={14} color="#A855F7" />
              <span className={styles.label}>Bot Verified</span>
            </div>
          </div>
        )}
        <div className={styles.divider} />
      </div>

      {/* TAG CATEGORIES (PLATFORM, PRICING, CAPABILITIES, DEPLOYMENT, LICENSE) */}
      {filteredTagCategories.map((catGroup) => {
        const isGroupOpen = openTagSections[catGroup.id] ?? true;
        const selectedInGroupCount = catGroup.tags.filter((t) =>
          selectedTags.includes(t.name)
        ).length;

        return (
          <div key={catGroup.id} className={styles.section}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleTagSection(catGroup.id)}
            >
              <span className={styles.headerLabel}>
                <Hash size={13} />
                {catGroup.name}
                {selectedInGroupCount > 0 && (
                  <span className={styles.groupCountPill}>({selectedInGroupCount})</span>
                )}
              </span>
              {isGroupOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>

            {isGroupOpen && (
              <div className={styles.tagsPillContainer}>
                {catGroup.tags.map((t) => {
                  const isChecked = selectedTags.includes(t.name);

                  return (
                    <button
                      type="button"
                      key={t.id || t.name}
                      className={`${styles.filterTagPill} ${isChecked ? styles.tagChecked : ''}`}
                      onClick={() => handleToggleTag(t.name, catGroup)}
                      title={catGroup.isSingleSelect ? `${t.name} (Single choice)` : t.name}
                    >
                      #{t.name}
                    </button>
                  );
                })}
              </div>
            )}
            <div className={styles.divider} />
          </div>
        );
      })}
    </aside>
  );
}
