import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
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
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { TAG_CATEGORIES } from '@/services/mockData';
import { getOrganizations } from '@/services/userService';
import styles from './FilterBar.module.scss';

export default function FilterBar({
  categories = [],
  selectedCategory,
  onSelectCategory,
  selectedCategories = [],
  onSelectedCategoriesChange,
  selectedOrganizations = [],
  onSelectedOrganizationsChange,
  selectedTags = [],
  onSelectedTagsChange,
  verification = { admin: false, community: false, bot: false },
  onVerificationChange,
  onResetFilters,
  isOpenMobile,
  onCloseMobile,
  isInline = false,
}) {
  const { t, translateCategory, translateTagCategory, translateTag } = useLanguage();
  const [filterQuery, setFilterQuery] = useState('');
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);
  const [isVerificationOpen, setIsVerificationOpen] = useState(true);
  const [isOrganizationsOpen, setIsOrganizationsOpen] = useState(true);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllOrgs, setShowAllOrgs] = useState(false);
  const [organizations] = useState(getOrganizations());
  
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

  // Filtered categories (matches both default name and translated name)
  const filteredCategories = useMemo(() => {
    const list = categories.filter((c) => c.id !== 'all');
    if (!filterQuery.trim()) return list;
    const q = filterQuery.toLowerCase();
    return list.filter((c) => {
      const translated = translateCategory(c.id, c.name).toLowerCase();
      return c.name.toLowerCase().includes(q) || translated.includes(q);
    });
  }, [categories, filterQuery, translateCategory]);

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
      const transCat = translateTagCategory(cat.id, cat.name).toLowerCase();
      const matchingTags = cat.tags.filter((t) => {
        if (!q) return true;
        const transTag = translateTag(t.id, t.name).toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          transTag.includes(q) ||
          cat.name.toLowerCase().includes(q) ||
          transCat.includes(q)
        );
      });
      return {
        ...cat,
        tags: matchingTags,
      };
    }).filter((cat) => cat.tags.length > 0);
  }, [filterQuery, translateTagCategory, translateTag]);

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

  // Alphabetical and search-filtered organizations
  const filteredOrganizations = useMemo(() => {
    let list = [...organizations].sort((a, b) => a.name.localeCompare(b.name));
    if (!filterQuery.trim()) return list;
    const q = filterQuery.toLowerCase();
    return list.filter((org) => org.name.toLowerCase().includes(q) || org.slug?.includes(q));
  }, [organizations, filterQuery]);

  const hasSelectedOrg = selectedOrganizations.length > 0;
  const visibleOrganizations = useMemo(() => {
    if (hasSelectedOrg) {
      return filteredOrganizations.filter((o) => selectedOrganizations.includes(o.id));
    }
    if (showAllOrgs || filterQuery.trim()) {
      return filteredOrganizations;
    }
    return filteredOrganizations.slice(0, 6);
  }, [filteredOrganizations, hasSelectedOrg, selectedOrganizations, showAllOrgs, filterQuery]);

  const canExpandOrgs = filteredOrganizations.length > 6 && !filterQuery.trim();

  const handleToggleOrganization = (orgId) => {
    if (!onSelectedOrganizationsChange) return;
    if (selectedOrganizations.includes(orgId)) {
      onSelectedOrganizationsChange(selectedOrganizations.filter((id) => id !== orgId));
    } else {
      onSelectedOrganizationsChange([...selectedOrganizations, orgId]);
    }
  };

  const hasAnyActiveFilters =
    (selectedCategory && selectedCategory !== 'all') ||
    selectedCategories.length > 0 ||
    selectedOrganizations.length > 0 ||
    selectedTags.length > 0 ||
    verification.admin ||
    verification.community ||
    verification.bot;

  const handleClearOrClose = (e) => {
    if (hasAnyActiveFilters) {
      onResetFilters?.();
    } else {
      if (e?.currentTarget && typeof e.currentTarget.blur === 'function') {
        e.currentTarget.blur();
      }
      onCloseMobile?.();
    }
  };

  return (
    <aside
      className={`${styles.sidebar} ${isInline ? styles.inlineMode : ''} ${
        !isInline && isOpenMobile ? styles.mobileOpen : ''
      }`}
    >
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <span className={styles.title}>{t('filter.filters', 'Filters')}</span>
          {hasAnyActiveFilters && (
            <span className={styles.activeCountBadge}>
              {selectedCategories.length + selectedTags.length + (verification.admin ? 1 : 0) + (verification.community ? 1 : 0) + (verification.bot ? 1 : 0)}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {(hasAnyActiveFilters || isInline) && (
            <button
              type="button"
              className={styles.resetBtn}
              onClick={handleClearOrClose}
              title={hasAnyActiveFilters ? t('filter.clearFilters', 'Clear Filters') : t('common.close', 'Close')}
            >
              {t('filter.clear', 'Clear')}
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
          placeholder={t('filter.searchFilters', 'Filter categories & #tags...')}
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
            {t('filter.categories', 'Categories')} {selectedCategories.length > 0 && `(${selectedCategories.length})`}
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
                  <span className={styles.label}>{translateCategory(cat.id, cat.name)}</span>
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
                {t('filter.showAllCategories', 'Show all categories')}
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
                      {t('filter.showLess', 'Show less')} <ChevronUp size={12} />
                    </>
                  ) : (
                    <>
                      {t('filter.showMore', 'Show more')} ({filteredCategories.length - 6}) <ChevronDown size={12} />
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
            {t('filter.verification', 'Verification')}
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
              <span className={styles.label}>{t('filter.adminVerified', 'Admin Verified')}</span>
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
              <span className={styles.label}>{t('filter.communityChoice', 'Community Choice')}</span>
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
              <CheckCircle2 size={14} color="#8B5CF6" />
              <span className={styles.label}>{t('filter.botAudited', 'Technical Audit')}</span>
            </div>
          </div>
        )}
        <div className={styles.divider} />
      </div>

      {/* ORGANIZATIONS SECTION (Placed directly below Verification, categorized like categories) */}
      <div className={styles.section}>
        <div
          className={styles.sectionHeader}
          onClick={() => setIsOrganizationsOpen(!isOrganizationsOpen)}
        >
          <span className={styles.headerLabel}>
            <Building2 size={13} />
            {t('filter.organizations', 'Organizations')} {selectedOrganizations.length > 0 && `(${selectedOrganizations.length})`}
          </span>
          {isOrganizationsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
        {isOrganizationsOpen && (
          <div className={styles.optionsList}>
            {visibleOrganizations.map((org) => {
              const isChecked = selectedOrganizations.includes(org.id);

              return (
                <div
                  key={org.id}
                  className={`${styles.checkboxItem} ${isChecked ? styles.itemActive : ''}`}
                  onClick={() => handleToggleOrganization(org.id)}
                >
                  <div className={`${styles.squareBox} ${isChecked ? styles.checked : ''}`}>
                    {isChecked && <Check size={11} strokeWidth={3} />}
                  </div>
                  <span className={styles.orgInitialsPill}>{org.initials}</span>
                  <span className={styles.label}>{org.name}</span>
                  {org.verified && (
                    <CheckCircle2 size={12} color="#10B981" title="Verified Organization" />
                  )}
                </div>
              );
            })}

            {hasSelectedOrg ? (
              <button
                type="button"
                className={styles.showMoreBtn}
                onClick={() => onSelectedOrganizationsChange && onSelectedOrganizationsChange([])}
              >
                {t('filter.showAllOrgs', 'Show all organizations')}
              </button>
            ) : (
              canExpandOrgs && (
                <button
                  type="button"
                  className={styles.showMoreBtn}
                  onClick={() => setShowAllOrgs(!showAllOrgs)}
                >
                  {showAllOrgs ? (
                    <>
                      {t('filter.showLess', 'Show less')} <ChevronUp size={12} />
                    </>
                  ) : (
                    <>
                      {t('filter.showMore', 'Show more')} ({filteredOrganizations.length - 6}) <ChevronDown size={12} />
                    </>
                  )}
                </button>
              )
            )}
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

        const groupTranslatedTitle = translateTagCategory(catGroup.id, catGroup.name);

        return (
          <div key={catGroup.id} className={styles.section}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleTagSection(catGroup.id)}
            >
              <span className={styles.headerLabel}>
                <Hash size={13} />
                {groupTranslatedTitle}
                {selectedInGroupCount > 0 && (
                  <span className={styles.groupCountPill}>({selectedInGroupCount})</span>
                )}
              </span>
              {isGroupOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>

            {isGroupOpen && (
              <div className={styles.tagsPillContainer}>
                {catGroup.tags.map((tagItem) => {
                  const isChecked = selectedTags.includes(tagItem.name);
                  const translatedTagName = translateTag(tagItem.id, tagItem.name);

                  return (
                    <button
                      type="button"
                      key={tagItem.id || tagItem.name}
                      className={`${styles.filterTagPill} ${isChecked ? styles.tagChecked : ''}`}
                      onClick={() => handleToggleTag(tagItem.name, catGroup)}
                      title={catGroup.isSingleSelect ? `${translatedTagName} (${t('filter.selectOnlyOne', 'Single choice')})` : translatedTagName}
                    >
                      #{translatedTagName}
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
