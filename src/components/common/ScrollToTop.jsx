import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './ScrollToTop.module.scss';

export default function ScrollToTop() {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let rafId = null;

    const toggleVisibility = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        if (window.scrollY > 250) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
        rafId = null;
      });
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    // Check initial position
    toggleVisibility();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      type="button"
      className={`${styles.scrollToTopBtn} ${isVisible ? styles.visible : ''}`}
      onClick={scrollToTop}
      aria-label={t('common.scrollToTop', 'Scroll to top')}
      title={t('common.scrollToTop', 'Scroll to top')}
    >
      <ArrowUp size={20} strokeWidth={2.5} />
    </button>
  );
}

