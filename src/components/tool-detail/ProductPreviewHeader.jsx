import React from 'react';
import { ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { getCategoryColor } from '@/constants/categoryIcons';
import styles from './ProductPreviewHeader.module.scss';

export default function ProductPreviewHeader({ tool }) {
  const { t, translateCategory } = useLanguage();
  const categoryName = translateCategory(tool.categoryId, tool.category || 'Software Tool').toUpperCase();
  const catColor = getCategoryColor(tool.categoryId || tool.category);

  return (
    <div className={styles.heroCard}>
      <div
        className={styles.largeIcon}
        style={!tool.icon ? {
          background: `linear-gradient(135deg, ${catColor} 0%, #6366f1 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderColor: 'transparent',
        } : {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {tool.icon ? (
          <img src={tool.icon} alt={tool.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <span style={{ color: '#ffffff', fontSize: '26px', fontWeight: 800 }}>
            {tool.name ? tool.name.slice(0, 2).toUpperCase() : 'TL'}
          </span>
        )}
      </div>

      <div className={styles.detailsArea}>
        <div className={styles.categoryRow}>
          <span
            className={styles.categoryPill}
            style={{
              backgroundColor: `${catColor}18`,
              borderColor: `${catColor}40`,
              color: catColor,
            }}
          >
            {categoryName}
          </span>
          <div className={styles.trustBadges}>
            {tool.verified?.admin && <ShieldCheck size={16} color="#EAB308" title={t('filter.adminVerified', 'Admin Verified')} />}
            {tool.verified?.community && <Sparkles size={16} color="#10B981" title={t('filter.communityChoice', 'Community Choice')} />}
            {tool.verified?.bot && <CheckCircle2 size={16} color="#8B5CF6" title={t('filter.botAudited', 'Technical Audit')} />}
          </div>
        </div>

        <h1 className={styles.title}>{tool.name}</h1>
        <p className={styles.description}>{tool.fullDescription || tool.description}</p>
      </div>
    </div>
  );
}
