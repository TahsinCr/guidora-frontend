import React, { useState } from 'react';
import { Star, Eye, Bookmark, ArrowUpRight, ShieldCheck, Sparkles, Bot } from 'lucide-react';
import styles from './ProductCard.module.scss';

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

  const initials = tool.name
    ? tool.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AI';

  return (
    <article
      className={`${styles.card} ${viewMode === 'list' ? styles.listView : ''}`}
      onClick={() => onOpenDetail(tool.id)}
    >
      <div className={styles.header}>
        <div className={styles.leftHead}>
          <div className={styles.thumbnail}>
            <span className={styles.thumbInitials}>{initials}</span>
          </div>

          <div className={styles.info}>
            <div className={styles.titleRow}>
              <div className={styles.titleLeft}>
                <h2 className={styles.title}>{tool.name}</h2>
                {tool.verified && (
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
                )}
              </div>
              {tool.isNew && <span className={styles.newBadge}>NEW</span>}
            </div>

            <div className={styles.tagRow}>
              <span className={styles.categoryTag}>{tool.tag || tool.category}</span>
              {tool.pricing && (
                <span className={`${styles.pricingBadge} ${styles[tool.pricing.toLowerCase().replace(/[^a-z0-9]/g, '')] || ''}`}>
                  {tool.pricing}
                </span>
              )}
              {tool.version && <span className={styles.versionText}>• {tool.version}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.descriptionSection}>
        <p className={styles.description}>{tool.description}</p>
        {viewMode === 'list' && tool.platforms && tool.platforms.length > 0 && (
          <div className={styles.platformPills}>
            {tool.platforms.slice(0, 3).map((p) => (
              <span key={p} className={styles.platformPill}>{p}</span>
            ))}
          </div>
        )}
      </div>

      <div className={styles.divider} />

      <div className={styles.bottomRow}>
        <div className={styles.metrics}>
          <div className={styles.rating}>
            <Star size={13} fill="currentColor" />
            <span>{tool.rating}</span>
            {tool.reviewCount && <span className={styles.reviewCount}>({tool.reviewCount})</span>}
          </div>
          <div className={styles.views}>
            <Eye size={13} />
            <span>{tool.views}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleExternal}
            title="Visit Website"
            aria-label="Visit Website"
          >
            <ArrowUpRight size={17} />
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${isBookmarked ? styles.bookmarked : ''}`}
            onClick={handleBookmark}
            title={isBookmarked ? 'Remove Bookmark' : 'Save Tool'}
            aria-label="Save Tool"
          >
            <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </article>
  );
}
