import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './Tabs.module.scss';

export default function Tabs({ activeTab, onTabChange, reviewCount }) {
  const { t } = useLanguage();
  const tabsList = [
    { id: 'about', label: t('tabs.about', 'About & Details') },
    { id: 'gallery', label: t('tabs.gallery', 'Gallery') },
    { id: 'changelog', label: t('tabs.changelog', 'Changelog') },
    { id: 'license', label: t('tabs.license', 'License') },
    { id: 'reviews', label: t('tabs.reviews', 'Reviews'), count: reviewCount ? String(reviewCount) : '128' },
    { id: 'alternatives', label: t('tabs.alternatives', 'Alternatives') },
  ];

  return (
    <div className={styles.tabsContainer}>
      {tabsList.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`${styles.tabBtn} ${isActive ? styles.active : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span>{tab.label}</span>
            {tab.count && <span className={styles.pillBadge}>{tab.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
