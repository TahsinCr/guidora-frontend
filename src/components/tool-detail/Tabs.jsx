import React from 'react';
import styles from './Tabs.module.scss';

export default function Tabs({ activeTab, onTabChange, reviewCount }) {
  const tabsList = [
    { id: 'about', label: 'About & Details' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'changelog', label: 'Changelog' },
    { id: 'reviews', label: 'Reviews', count: reviewCount ? String(reviewCount) : '128' },
    { id: 'alternatives', label: 'Alternatives' },
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
