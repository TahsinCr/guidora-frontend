import React from 'react';
import { CreditCard, Monitor, Cloud, Clock } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './StatusCardGroup.module.scss';

export default function StatusCardGroup({ tool }) {
  const { t } = useLanguage();
  const widgets = [
    {
      label: t('tool.pricing', 'PRICING'),
      value: tool.pricing || 'Freemium',
      icon: <CreditCard size={17} />,
    },
    {
      label: t('tool.platform', 'PLATFORM'),
      value: tool.platformDisplay || 'Web, API',
      icon: <Monitor size={17} />,
    },
    {
      label: t('tool.access', 'ACCESS'),
      value: tool.access || 'Waitlist',
      icon: <Cloud size={17} />,
    },
    {
      label: t('tool.updated', 'UPDATED'),
      value: tool.updated || '2 days ago',
      icon: <Clock size={17} />,
    },
  ];

  return (
    <div className={styles.widgetRow}>
      {widgets.map((w, idx) => (
        <div key={idx} className={styles.card}>
          <div className={styles.gridIconBox}>{w.icon}</div>
          <div className={styles.content}>
            <span className={styles.label}>{w.label}</span>
            <span className={styles.value}>{w.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
