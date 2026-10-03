import React from 'react';
import { ShieldCheck, Sparkles, Bot } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './ProductPreviewHeader.module.scss';

export default function ProductPreviewHeader({ tool }) {
  const { t, translateCategory } = useLanguage();
  const categoryName = translateCategory(tool.categoryId, tool.category || 'Generative AI').toUpperCase();

  return (
    <div className={styles.heroCard}>
      <div className={styles.largeIcon} />

      <div className={styles.detailsArea}>
        <div className={styles.categoryRow}>
          <span className={styles.categoryPill}>{categoryName}</span>
          <div className={styles.trustBadges}>
            {tool.verified?.admin && <ShieldCheck size={16} color="#EAB308" title={t('filter.adminVerified', 'Admin Verified')} />}
            {tool.verified?.community && <Sparkles size={16} color="#10B981" title={t('filter.communityChoice', 'Community Choice')} />}
            {tool.verified?.bot && <Bot size={16} color="#A855F7" title={t('filter.botAudited', 'Bot Verified')} />}
          </div>
        </div>

        <h1 className={styles.title}>{tool.name}</h1>
        <p className={styles.description}>{tool.fullDescription || tool.description}</p>
      </div>
    </div>
  );
}
