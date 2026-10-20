import React, { useState, useEffect, useMemo } from 'react';
import { Star, Eye, Bookmark, ArrowUpRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { safeOpenExternal } from '@/utils/security';
import { getCategoryColor } from '@/constants/categoryIcons';
import styles from './ProductCard.module.scss';

function ProductCard({ tool, viewMode = 'grid', onOpenDetail }) {
  const { t, translateCategory, translateTag } = useLanguage();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [tool.icon]);

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

  const initials = useMemo(() => {
    if (!tool.name) return 'TL';
    const words = tool.name.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    const camelMatches = words[0].match(/[A-Z]/g);
    if (camelMatches && camelMatches.length >= 2) {
      return (camelMatches[0] + camelMatches[1]).toUpperCase();
    }
    return words[0].slice(0, 2).toUpperCase();
  }, [tool.name]);

  const pricingRaw = tool.pricing || 'Freemium';
  const pricingKey = pricingRaw.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const pricingClassKey = pricingRaw.toLowerCase().replace(/[^a-z0-9]/g, '');
  const localizedPricing = t(`tag.${pricingKey}`, pricingRaw);
  const catColor = getCategoryColor(tool.categoryId || tool.category);

  const hasVerified = Boolean(
    tool.verified &&
      (tool.verified.admin || tool.verified.community || tool.verified.audited || tool.verified.bot)
  );

  const showImage = Boolean(tool.icon && !imgError);

  const { visibleTags, extraCount, hiddenTitles } = useMemo(() => {
    const rawPool = [
      ...(Array.isArray(tool.tags) ? tool.tags : []),
      ...(Array.isArray(tool.platforms) ? tool.platforms : []),
      tool.tag,
    ]
      .map((item) => (typeof item === 'string' ? item.trim() : item?.name || item?.id || ''))
      .filter(Boolean);

    const seen = new Set();
    const pricingLower = pricingRaw.toLowerCase();
    const categoryLower = (tool.category || '').toLowerCase();

    const unique = [];
    for (const tag of rawPool) {
      const lower = tag.toLowerCase().replace(/^#/, '');
      if (!lower || lower === pricingLower || lower === categoryLower) continue;
      if (seen.has(lower)) continue;
      seen.add(lower);
      const slug = lower.replace(/[^a-z0-9]/g, '-');
      unique.push({
        key: lower,
        label: translateTag(slug, tag.replace(/^#/, '')),
      });
    }

    const maxVisible = 4;
    return {
      visibleTags: unique.slice(0, maxVisible),
      extraCount: Math.max(0, unique.length - maxVisible),
      hiddenTitles: unique
        .slice(maxVisible)
        .map((u) => `#${u.label}`)
        .join(', '),
    };
  }, [tool.tags, tool.platforms, tool.tag, pricingRaw, tool.category, translateTag]);

  const displayRating =
    tool.rating && Number(tool.rating) > 0 ? Number(tool.rating).toFixed(1) : '4.8';
  const displayReviewCount =
    tool.reviewCount && String(tool.reviewCount) !== '0' ? String(tool.reviewCount) : null;
  const displayViews = tool.views || tool.monthlyVisits || '24.5k';

  return (
    <article
      className={`${styles.card} ${viewMode === 'list' ? styles.listView : ''}`}
      style={{ '--card-accent': catColor }}
      onClick={() => onOpenDetail(tool.id)}
      onMouseEnter={() => {
        import('@/components/tool-detail/ToolDialog');
      }}
    >
      <div className={styles.header}>
        <div className={styles.leftHead}>
          <div
            className={styles.thumbnail}
            style={
              !showImage
                ? {
                    background: `linear-gradient(135deg, ${catColor} 0%, #6366f1 100%)`,
                    borderColor: 'transparent',
                    padding: 0,
                  }
                : undefined
            }
          >
            {showImage ? (
              <img
                src={tool.icon}
                alt={tool.name}
                loading="lazy"
                decoding="async"
                className={styles.thumbImg}
                onError={() => setImgError(true)}
              />
            ) : (
              <span className={styles.thumbInitials}>{initials}</span>
            )}
          </div>

          <div className={styles.info}>
            <div className={styles.titleRow}>
              <div className={styles.titleLeft}>
                <h2 className={styles.title}>{tool.name}</h2>
                {hasVerified && (
                  <div className={styles.verifiedIcons}>
                    {tool.verified?.admin && (
                      <ShieldCheck
                        size={14}
                        color="#EAB308"
                        title={t('filter.adminVerified', 'Admin Verified')}
                      />
                    )}
                    {tool.verified?.community && (
                      <Sparkles
                        size={14}
                        color="#10B981"
                        title={t('filter.communityChoice', 'Community Choice')}
                      />
                    )}
                    {(tool.verified?.audited || tool.verified?.bot) && (
                      <CheckCircle2
                        size={14}
                        color="#8B5CF6"
                        title={t('filter.botAudited', 'Technical Audit')}
                      />
                    )}
                  </div>
                )}
              </div>
              {tool.isNew && <span className={styles.newBadge}>{t('common.new', 'YENİ')}</span>}
            </div>

            <div className={styles.tagRow}>
              <span
                className={styles.categoryTag}
                style={{
                  backgroundColor: `${catColor}18`,
                  borderColor: `${catColor}42`,
                  color: catColor,
                }}
              >
                <span className={styles.categoryDot} style={{ backgroundColor: catColor }} />
                {tool.category
                  ? translateCategory(tool.category, tool.categoryName || tool.tag || tool.category)
                  : tool.tag}
              </span>
              {pricingRaw && (
                <span className={`${styles.pricingBadge} ${styles[pricingClassKey] || ''}`}>
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
      </div>

      {visibleTags.length > 0 && (
        <div className={styles.cardTagsRow}>
          {visibleTags.map((tagItem) => (
            <span key={tagItem.key} className={styles.cardTagChip}>
              <span className={styles.tagHash}>#</span>
              {tagItem.label}
            </span>
          ))}
          {extraCount > 0 && (
            <span className={styles.cardTagMore} title={hiddenTitles}>
              +{extraCount} ...
            </span>
          )}
        </div>
      )}

      <div className={styles.bottomRow}>
        <div className={styles.metrics}>
          <div className={styles.rating}>
            <Star size={13} fill="currentColor" />
            <span>{displayRating}</span>
            {displayReviewCount && (
              <span className={styles.reviewCount}>({displayReviewCount})</span>
            )}
          </div>
          <div className={styles.views}>
            <Eye size={13} />
            <span>{displayViews}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleExternal}
            title={t('tool.visitWebsite', 'Web Sitesini Ziyaret Et')}
            aria-label={t('tool.visitWebsite', 'Web Sitesini Ziyaret Et')}
          >
            <ArrowUpRight size={15} />
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${isBookmarked ? styles.bookmarked : ''}`}
            onClick={handleBookmark}
            title={isBookmarked ? t('tool.saved', 'Kaydedilenlerden Çıkar') : t('tool.save', 'Aracı Kaydet')}
            aria-label={t('tool.save', 'Aracı Kaydet')}
          >
            <Bookmark size={14} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default React.memo(ProductCard);
