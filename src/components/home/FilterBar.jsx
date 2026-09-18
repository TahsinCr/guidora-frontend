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
  filterPricing,
  onFilterPricingChange,
  platform = 'all',
  onPlatformChange,
  onResetFilters,
  isOpenMobile,
  onCloseMobile,
  isInline = false,
}) {
  const [tagSearch, setTagSearch] = useState('');
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);
  const [isTagsOpen, setIsTagsOpen] = useState(true);
  const [isVerificationOpen, setIsVerificationOpen] = useState(true);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isPlatformOpen, setIsPlatformOpen] = useState(false);

  // Filter categories by tagSearch if search is active
  const filteredCategories = useMemo(() => {
    const list = categories.filter((c) => c.id !== 'all');
    if (!tagSearch.trim()) return list;
    const q = tagSearch.toLowerCase();
    return list.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, tagSearch]);

  // Flatten and filter tags from TAG_CATEGORIES
  const allTagsList = useMemo(() => {
    const list = [];
    TAG_CATEGORIES.forEach((cat) => {
      cat.tags.forEach((t) => {
        list.push({ ...t, groupName: cat.name });
      });
    });
    if (!tagSearch.trim()) return list;
    const q = tagSearch.toLowerCase().replace(/^#/, '');
    return list.filter(
      (t) => t.name.toLowerCase().includes(q) || t.groupName.toLowerCase().includes(q)
    );
  }, [tagSearch]);

  const handleToggleCategory = (catId) => {
    if (!onSelectedCategoriesChange) return;
    if (selectedCategories.includes(catId)) {
      onSelectedCategoriesChange(selectedCategories.filter((id) => id !== catId));
    } else {
      onSelectedCategoriesChange([...selectedCategories, catId]);
    }
  };

  const handleToggleTag = (tagName) => {
    if (!onSelectedTagsChange) return;
    if (selectedTags.includes(tagName)) {
      onSelectedTagsChange(selectedTags.filter((t) => t !== tagName));
    } else {
      onSelectedTagsChange([...selectedTags, tagName]);
    }
  };

  return (
    <aside
      className={`${styles.sidebar} ${isInline ? styles.inlineMode : ''} ${
        !isInline && isOpenMobile ? styles.mobileOpen : ''
      }`}
    >
      <div className={styles.topBar}>
        <span className={styles.title}>Filters</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className={styles.resetBtn} onClick={onResetFilters}>
            Reset All
          </button>
          {!isInline && (
            <button className={styles.closeMobileBtn} onClick={onCloseMobile} title="Close">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* SEARCH WITHIN FILTERS (Categories & Tags) */}
      <div className={styles.filterSearchBox}>
        <Search size={14} className={styles.filterSearchIcon} />
        <input
          type="text"
          className={styles.filterSearchInput}
          placeholder="Find category or #tag..."
          value={tagSearch}
          onChange={(e) => setTagSearch(e.target.value)}
        />
        {tagSearch && (
          <button
            type="button"
            className={styles.clearSearchBtn}
            onClick={() => setTagSearch('')}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* CATEGORIES SECTION */}
      <div className={styles.section}>
        <div className={styles.sectionHeader} onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}>
          <span className={styles.headerLabel}>
            <Folder size={12} />
            Categories {selectedCategories.length > 0 && `(${selectedCategories.length})`}
          </span>
          {isCategoriesOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
        {isCategoriesOpen && (
          <div className={styles.optionsList}>
            {filteredCategories.slice(0, 8).map((cat) => {
              const isChecked = selectedCategories.includes(cat.id);

              return (
                <div
                  key={cat.id}
                  className={styles.checkboxItem}
                  onClick={() => handleToggleCategory(cat.id)}
                >
                  <div className={`${styles.squareBox} ${isChecked ? styles.checked : ''}`}>
                    {isChecked && <Check size={12} strokeWidth={3} />}
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
          </div>
        )}
        <div className={styles.divider} />
      </div>

      {/* TAGS SECTION */}
      <div className={styles.section}>
        <div className={styles.sectionHeader} onClick={() => setIsTagsOpen(!isTagsOpen)}>
          <span className={styles.headerLabel}>
            <Tag size={12} />
            Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
          </span>
          {isTagsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
        {isTagsOpen && (
          <div className={styles.tagsPillContainer}>
            {allTagsList.slice(0, 16).map((t) => {
              const isChecked = selectedTags.includes(t.name);

              return (
                <button
                  type="button"
                  key={t.id || t.name}
                  className={`${styles.filterTagPill} ${isChecked ? styles.tagChecked : ''}`}
                  onClick={() => handleToggleTag(t.name)}
                >
                  #{t.name}
                </button>
              );
            })}
          </div>
        )}
        <div className={styles.divider} />
      </div>

      {/* VERIFICATION */}
      <div className={styles.section}>
        <div className={styles.sectionHeader} onClick={() => setIsVerificationOpen(!isVerificationOpen)}>
          <span className={styles.headerLabel}>Verification</span>
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
                {verification.admin && <Check size={12} strokeWidth={3} />}
              </div>
              <ShieldCheck size={15} color="#EAB308" />
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
                {verification.community && <Check size={12} strokeWidth={3} />}
              </div>
              <Sparkles size={15} color="#10B981" />
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
                {verification.bot && <Check size={12} strokeWidth={3} />}
              </div>
              <Bot size={15} color="#A855F7" />
              <span className={styles.label}>Bot Verified</span>
            </div>
          </div>
        )}
        <div className={styles.divider} />
      </div>

      {/* PRICING */}
      <div className={styles.section}>
        <div className={styles.sectionHeader} onClick={() => setIsPricingOpen(!isPricingOpen)}>
          <span className={styles.headerLabel}>Pricing</span>
          {isPricingOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
        {isPricingOpen && (
          <div className={styles.optionsList}>
            {['Free', 'Freemium', 'Paid / Enterprise'].map((p) => {
              const val = p.toLowerCase().split(' ')[0];
              const isChecked = filterPricing === val;

              return (
                <div
                  key={p}
                  className={styles.checkboxItem}
                  onClick={() => onFilterPricingChange(isChecked ? 'all' : val)}
                >
                  <div className={`${styles.squareBox} ${isChecked ? styles.checked : ''}`}>
                    {isChecked && <Check size={12} strokeWidth={3} />}
                  </div>
                  <span className={styles.label}>{p}</span>
                </div>
              );
            })}
          </div>
        )}
        <div className={styles.divider} />
      </div>

      {/* PLATFORM */}
      <div className={styles.section}>
        <div className={styles.sectionHeader} onClick={() => setIsPlatformOpen(!isPlatformOpen)}>
          <span className={styles.headerLabel}>Platform</span>
          {isPlatformOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
        {isPlatformOpen && (
          <div className={styles.optionsList}>
            {['Web App', 'Mobile App', 'API', 'Extension'].map((plat) => {
              const val = plat.toLowerCase().replace(' ', '-');
              const isChecked = platform === val;

              return (
                <div
                  key={plat}
                  className={styles.checkboxItem}
                  onClick={() => onPlatformChange && onPlatformChange(isChecked ? 'all' : val)}
                >
                  <div className={`${styles.squareBox} ${isChecked ? styles.checked : ''}`}>
                    {isChecked && <Check size={12} strokeWidth={3} />}
                  </div>
                  <span className={styles.label}>{plat}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
