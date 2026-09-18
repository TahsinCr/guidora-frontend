import React, { useState } from 'react';
import { Star, Eye, Bookmark, ArrowUpRight, ShieldCheck, Sparkles, Bot } from 'lucide-react';
import styles from './ProductCard.module.scss';

// Map categoryId to accent colors for visual richness
const CATEGORY_COLORS = {
  'generative-art': { from: '#A855F7', to: '#7C3AED', accent: '#A855F7' },
  'developer-tools': { from: '#10B981', to: '#047857', accent: '#10B981' },
  'design-ui': { from: '#06B6D4', to: '#0284C7', accent: '#06B6D4' },
  'llms-ai': { from: '#EAB308', to: '#D97706', accent: '#EAB308' },
  'video-motion': { from: '#EC4899', to: '#DB2777', accent: '#EC4899' },
  'data-science': { from: '#3B82F6', to: '#1D4ED8', accent: '#3B82F6' },
  'audio-music': { from: '#F97316', to: '#EA580C', accent: '#F97316' },
  'productivity': { from: '#8B5CF6', to: '#6D28D9', accent: '#8B5CF6' },
  '3d-motion': { from: '#14B8A6', to: '#0D9488', accent: '#14B8A6' },
};

export default function ProductCard({ tool, viewMode = 'grid', onOpenDetail }) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleBookmark = (e) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  const handleExternal = (e) => {
    e.stopPropagation();
    if (tool.websiteUrl) {
      window.open(tool.websiteUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const catColors = CATEGORY_COLORS[tool.categoryId] || { from: '#4C82FB', to: '#7C3AED', accent: '#4C82FB' };

  return (
    <article
      className={`${styles.card} ${viewMode === 'list' ? styles.listView : ''}`}
      onClick={() => onOpenDetail(tool.id)}
      style={{ '--cat-accent': catColors.accent }}
    >
      {/* Top accent line */}
      <div
        className={styles.accentLine}
        style={{ background: `linear-gradient(90deg, ${catColors.from}, ${catColors.to})` }}
      />

      <div className={styles.header}>
        <div className={styles.leftHead}>
          {/* Thumbnail with category gradient */}
          <div
            className={styles.thumbnail}
            style={{ background: `linear-gradient(135deg, ${catColors.from}33 0%, ${catColors.to}55 100%)` }}
          >
            <div
              className={styles.thumbnailInner}
              style={{ background: `linear-gradient(135deg, ${catColors.from}, ${catColors.to})` }}
            />
          </div>
          <div className={styles.info}>
            <div className={styles.titleRow}>
              <h2 className={styles.title}>{tool.name}</h2>
              {tool.isNew && <span className={styles.newBadge}>NEW</span>}
            </div>
            <div className={styles.tagRow}>
              <span
                className={styles.categoryTag}
                style={{
                  background: `${catColors.accent}18`,
                  color: catColors.accent,
                  borderColor: `${catColors.accent}30`,
                }}
              >
                {tool.tag}
              </span>
              <span className={styles.versionText}>• {tool.version}</span>
              <div className={styles.verifiedIcons}>
                {tool.verified?.admin && (
                  <ShieldCheck size={14} color="#EAB308" title="Admin Verified" />
                )}
                {tool.verified?.community && (
                  <Sparkles size={14} color="#10B981" title="Community Choice" />
                )}
                {tool.verified?.audited && (
                  <Bot size={14} color="#A855F7" title="Bot Verified" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className={styles.description}>{tool.description}</p>

      <div className={styles.divider} />

      <div className={styles.bottomRow}>
        <div className={styles.metrics}>
          <div className={styles.rating}>
            <Star size={13} fill="currentColor" />
            <span>{tool.rating}</span>
          </div>
          <div className={styles.views}>
            <Eye size={13} />
            <span>({tool.views})</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={handleExternal}
            title="Visit Website"
          >
            <ArrowUpRight size={17} />
          </button>
          <button
            className={`${styles.actionBtn} ${isBookmarked ? styles.bookmarked : ''}`}
            onClick={handleBookmark}
            title={isBookmarked ? 'Remove Bookmark' : 'Save Tool'}
          >
            <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </article>
  );
}
