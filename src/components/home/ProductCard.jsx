import React, { useState } from 'react';
import { Star, Eye, Bookmark, ArrowUpRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { safeOpenExternal } from '@/utils/security';
import { getCategoryColor } from '@/constants/categoryIcons';
import styles from './ProductCard.module.scss';

function ProductCard({ tool, viewMode = 'grid', onOpenDetail }) {
  const { t, translateCategory, translateTag } = useLanguage();
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleBookmark = (e) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  const handleExternal = (e) => {
    e.stopPropagation();
    if (tool.websiteUrl) {
      safeOpenExternal(tool.websiteUrl);
    }
  };

  const initials = tool.name
    ? tool.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'TL';

  // Translate pricing if possible
  const pricingKey = tool.pricing ? tool.pricing.toLowerCase().replace(/[^a-z0-9]/g, '-') : '';
  const localizedPricing = tool.pricing ? t(`tag.${pricingKey}`, tool.pricing) : '';
  const catColor = getCategoryColor(tool.categoryId || tool.category);

  return (
    <article
      className={`${styles.card} ${viewMode === 'list' ? styles.listView : ''}`}
      onClick={() => onOpenDetail(tool.id)}
      onMouseEnter={() => {
        // High-performance prefetch: load the ToolDialog chunk during hover before click
        import('@/components/tool-detail/ToolDialog');
      }}
    >
      <div className={styles.header}>
        <div className={styles.leftHead}>
          <div
            className={styles.thumbnail}
            style={!tool.icon ? {
              background: `linear-gradient(135deg, ${catColor} 0%, #6366f1 100%)`,
              borderColor: 'transparent',
              padding: 0,
            } : undefined}
          >
            {tool.icon ? (
              <img
                src={tool.icon}
                alt={tool.name}
                loading="lazy"
                decoding="async"
                className={styles.thumbImg}
              />
            ) : (
              <span className={styles.thumbInitials} style={{ color: '#ffffff' }}>{initials}</span>
            )}
          </div>

          <div className={styles.info}>
            <div className={styles.titleRow}>
              <div className={styles.titleLeft}>
                <h2 className={styles.title}>{tool.name}</h2>
                {tool.verified && (
                  <div className={styles.verifiedIcons}>
                    {tool.verified?.admin && (
                      <ShieldCheck size={14} color="#EAB308" title={t('filter.adminVerified', 'Admin Verified')} />
                    )}
                    {tool.verified?.community && (
                      <Sparkles size={14} color="#10B981" title={t('filter.communityChoice', 'Community Choice')} />
                    )}
                    {tool.verified?.audited && (
                      <CheckCircle2 size={14} color="#8B5CF6" title={t('filter.botAudited', 'Technical Audit')} />
                    )}
                  </div>
                )}
              </div>
              {tool.isNew && <span className={styles.newBadge}>{t('common.new', 'NEW')}</span>}
            </div>

            <div className={styles.tagRow}>
              <span
                className={styles.categoryTag}
                style={{
                  backgroundColor: `${catColor}14`,
                  borderColor: `${catColor}35`,
                  color: catColor,
                }}
              >
                <span className={styles.categoryDot} style={{ backgroundColor: catColor }} />
                {tool.category ? translateCategory(tool.category, tool.tag || tool.category) : tool.tag}
              </span>
              {tool.pricing && (
                <span className={`${styles.pricingBadge} ${styles[tool.pricing.toLowerCase().replace(/[^a-z0-9]/g, '')] || ''}`}>
                  {localizedPricing}
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
            {tool.platforms.slice(0, 3).map((p) => {
              const pSlug = p.toLowerCase().replace(/[^a-z0-9]/g, '-');
              return (
                <span key={p} className={styles.platformPill}>
                  {translateTag(pSlug, p)}
                </span>
              );
            })}
          </div>
        )}
      </div>

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
            title={t('tool.visitWebsite', 'Visit Website')}
            aria-label={t('tool.visitWebsite', 'Visit Website')}
          >
            <ArrowUpRight size={17} />
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${isBookmarked ? styles.bookmarked : ''}`}
            onClick={handleBookmark}
            title={isBookmarked ? t('tool.saved', 'Remove Bookmark') : t('tool.save', 'Save Tool')}
            aria-label={t('tool.save', 'Save Tool')}
          >
            <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default React.memo(ProductCard);
