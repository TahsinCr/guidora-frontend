import React, { useState, useMemo } from 'react';
import { Search, X, AlertCircle, Hash, Layers, Check, ChevronRight } from 'lucide-react';
import { TAG_CATEGORIES, ALL_TAGS } from '@/services/mockData';
import { validateTagSelection } from '@/services/toolsService';
import styles from './TagPicker.module.scss';

export default function TagPicker({ selectedTags = [], onChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('alphabetical'); // 'alphabetical' | 'category'
  const [conflictMessage, setConflictMessage] = useState(null);

  // Group tags alphabetically (A-Z)
  const alphabeticalGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = ALL_TAGS.filter((t) => {
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.tagCategoryName.toLowerCase().includes(q)
      );
    });

    const groups = {};
    filtered.forEach((tag) => {
      const firstLetter = tag.name.charAt(0).toUpperCase();
      if (!groups[firstLetter]) groups[firstLetter] = [];
      groups[firstLetter].push(tag);
    });

    return Object.keys(groups)
      .sort()
      .map((letter) => ({
        letter,
        tags: groups[letter],
      }));
  }, [searchQuery]);

  // Group tags by Tag Category
  const categoryGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return TAG_CATEGORIES.map((cat) => {
      const filteredTags = cat.tags.filter((t) => {
        if (!q) return true;
        return (
          t.name.toLowerCase().includes(q) ||
          cat.name.toLowerCase().includes(q)
        );
      });
      return {
        ...cat,
        tags: filteredTags,
      };
    }).filter((cat) => cat.tags.length > 0);
  }, [searchQuery]);

  const isSelected = (tagId) => {
    return selectedTags.some((t) => (typeof t === 'string' ? t === tagId : t.id === tagId));
  };

  const handleTagClick = (tag) => {
    // If already selected, remove it
    if (isSelected(tag.id)) {
      const updated = selectedTags.filter((t) =>
        (typeof t === 'string' ? t !== tag.id : t.id !== tag.id)
      );
      onChange(updated);
      setConflictMessage(null);
      return;
    }

    // Validate using only / single-select rules
    const result = validateTagSelection(selectedTags, tag);
    if (!result.valid) {
      setConflictMessage(result.reason);
      return;
    }

    // Add tag
    setConflictMessage(null);
    onChange([...selectedTags, tag]);
  };

  const handleRemoveTag = (tagId, e) => {
    if (e) e.stopPropagation();
    const updated = selectedTags.filter((t) =>
      (typeof t === 'string' ? t !== tagId : t.id !== tagId)
    );
    onChange(updated);
    setConflictMessage(null);
  };

  // Helper to check if tag is currently restricted by 'only' rule
  const isTagRestricted = (tag) => {
    if (isSelected(tag.id)) return false;
    const result = validateTagSelection(selectedTags, tag);
    return !result.valid;
  };

  return (
    <div className={styles.tagPickerContainer}>
      <div className={styles.headerRow}>
        <label className={styles.label}>
          <Hash size={14} className={styles.hashIcon} />
          <span>Tags & Capabilities (Unlimited)</span>
        </label>
        <span className={styles.countBadge}>{selectedTags.length} selected</span>
      </div>

      {/* 1. Selected Tags Input Container (2-3 lines height with auto-scroll) */}
      <div className={styles.selectedBox} aria-label="Selected tags list">
        {selectedTags.length === 0 ? (
          <span className={styles.placeholderText}>
            No tags selected yet. Search and click tags below to add them to your tool (#Web, #Freemium, #LLM)...
          </span>
        ) : (
          <div className={styles.selectedTagsWrap}>
            {selectedTags.map((tag) => {
              const tagId = typeof tag === 'string' ? tag : tag.id;
              const tagName = typeof tag === 'string'
                ? ALL_TAGS.find((t) => t.id === tag)?.name || tag
                : tag.name;

              return (
                <span key={tagId} className={styles.activeTagPill}>
                  <span className={styles.tagName}>#{tagName}</span>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={(e) => handleRemoveTag(tagId, e)}
                    title={`Remove #${tagName}`}
                    aria-label={`Remove #${tagName}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Conflict / Only Rule Warning Banner (Directly below input) */}
      {conflictMessage && (
        <div className={styles.conflictAlert}>
          <AlertCircle size={15} className={styles.alertIcon} />
          <span className={styles.alertText}>{conflictMessage}</span>
          <button
            type="button"
            className={styles.alertCloseBtn}
            onClick={() => setConflictMessage(null)}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* 3. Tag Browser / Search Panel */}
      <div className={styles.browserPanel}>
        <div className={styles.searchBarRow}>
          <div className={styles.searchWrap}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search tags by keyword (e.g. #Interface, #Web, #Free)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={() => setSearchQuery('')}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className={styles.viewToggleGroup}>
            <button
              type="button"
              className={`${styles.toggleBtn} ${viewMode === 'alphabetical' ? styles.activeToggle : ''}`}
              onClick={() => setViewMode('alphabetical')}
            >
              A-Z
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${viewMode === 'category' ? styles.activeToggle : ''}`}
              onClick={() => setViewMode('category')}
            >
              <Layers size={13} />
              <span>Category</span>
            </button>
          </div>
        </div>

        {/* Tag List Sections */}
        <div className={styles.tagsScrollList}>
          {viewMode === 'alphabetical' ? (
            alphabeticalGroups.length === 0 ? (
              <div className={styles.noResults}>No tags matching "{searchQuery}"</div>
            ) : (
              alphabeticalGroups.map((group) => (
                <div key={group.letter} className={styles.alphabeticalSection}>
                  <div className={styles.sectionHeader}>
                    <span className={styles.letterBadge}>{group.letter}</span>
                    <div className={styles.sectionDivider} />
                  </div>
                  <div className={styles.tagsPillList}>
                    {group.tags.map((tag) => {
                      const active = isSelected(tag.id);
                      const restricted = isTagRestricted(tag);

                      return (
                        <button
                          key={tag.id}
                          type="button"
                          className={`${styles.tagPill} ${active ? styles.tagActive : ''} ${
                            restricted ? styles.tagRestricted : ''
                          }`}
                          onClick={() => handleTagClick(tag)}
                          title={
                            restricted
                              ? `Single-choice restriction for ${tag.tagCategoryName}. Click to inspect.`
                              : tag.tagCategoryName
                          }
                        >
                          <span className={styles.pillBullet}>•</span>
                          <span className={styles.pillText}>#{tag.name}</span>
                          {active && <Check size={12} className={styles.checkIcon} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )
          ) : (
            categoryGroups.length === 0 ? (
              <div className={styles.noResults}>No categories matching "{searchQuery}"</div>
            ) : (
              categoryGroups.map((cat) => (
                <div key={cat.id} className={styles.categorySection}>
                  <div className={styles.catHeader}>
                    <span className={styles.catTitle}>{cat.name}</span>
                    <span className={styles.catHint}>
                      {cat.isSingleSelect ? '(Only 1 allowed)' : '(Multiple allowed)'}
                    </span>
                  </div>
                  <div className={styles.tagsPillList}>
                    {cat.tags.map((tag) => {
                      const active = isSelected(tag.id);
                      const fullTag = {
                        ...tag,
                        tagCategoryId: cat.id,
                        tagCategoryName: cat.name,
                        isCategorySingleSelect: cat.isSingleSelect,
                      };
                      const restricted = isTagRestricted(fullTag);

                      return (
                        <button
                          key={tag.id}
                          type="button"
                          className={`${styles.tagPill} ${active ? styles.tagActive : ''} ${
                            restricted ? styles.tagRestricted : ''
                          }`}
                          onClick={() => handleTagClick(fullTag)}
                        >
                          <span className={styles.pillBullet}>•</span>
                          <span className={styles.pillText}>#{tag.name}</span>
                          {active && <Check size={12} className={styles.checkIcon} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}

