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

  return (
    <article
      className={`${styles.card} ${viewMode === 'list' ? styles.listView : ''}`}
      onClick={() => onOpenDetail(tool.id)}
    >
      <div className={styles.header}>
        <div className={styles.leftHead}>
          <div className={styles.thumbnail} />
          <div className={styles.info}>
            <div className={styles.titleRow}>
              <h2 className={styles.title}>{tool.name}</h2>
              {tool.isNew && <span className={styles.newBadge}>NEW</span>}
            </div>
            <div className={styles.tagRow}>
              <span className={styles.categoryTag}>{tool.tag}</span>
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
            className={styles.actionBtn}
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
