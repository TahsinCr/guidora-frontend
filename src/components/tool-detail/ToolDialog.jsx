import React, { useState, useEffect } from 'react';
import { getToolById } from '@/services/toolsService';
import ProductPreviewHeader from './ProductPreviewHeader';
import StatusCardGroup from './StatusCardGroup';
import Tabs from './Tabs';
import DocContent from './DocContent';
import ToolSidebar from './ToolSidebar';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './ToolDialog.module.scss';

export default function ToolDialog({ toolId, onClose, onSelectTool, onToolLoaded }) {
  const { t } = useLanguage();
  const [tool, setTool] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  const [reviewCount, setReviewCount] = useState(null);

  // Fetch tool details asynchronously
  useEffect(() => {
    if (!toolId) return;

    let isMounted = true;
    setIsLoading(true);

    getToolById(toolId)
      .then((data) => {
        if (isMounted) {
          setTool(data);
          if (onToolLoaded) onToolLoaded(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load tool detail:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [toolId, onToolLoaded]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Scroll to top when tool opens
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [toolId]);

  if (!toolId) return null;

  return (
    <section className={styles.toolDetailSection} aria-label="Tool Detail">
      <div className={styles.mobileBackRow}>
        <button className={styles.backBtn} onClick={onClose} title={t('header.backToDirectory', 'Back to directory')}>
          <ArrowLeft size={16} />
          <span>{t('header.backToDirectory', 'Back to directory')}</span>
        </button>
      </div>

      {isLoading || !tool ? (
        <div className={styles.loadingSkeleton}>
          <div className={styles.skeletonHead} />
          <div className={styles.skeletonRow} />
        </div>
      ) : (
        <div className={styles.contentBody}>
          <div className={styles.leftColumn}>
            <ProductPreviewHeader tool={tool} />
            <Tabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              reviewCount={reviewCount}
            />
            <StatusCardGroup tool={tool} />
            <DocContent
              tool={tool}
              activeTab={activeTab}
              onReviewCountChange={setReviewCount}
            />
          </div>

          <div className={styles.rightColumn}>
            <ToolSidebar
              tool={tool}
              onSelectTool={(newId) => {
                if (onSelectTool) onSelectTool(newId);
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
