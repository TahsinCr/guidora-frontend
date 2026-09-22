import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ChevronDown } from 'lucide-react';
import CategorySlider from './CategorySlider';
import styles from './InformationCard.module.scss';

export function scrollToCatalog(smooth = true) {
  const catalogEl = document.getElementById('catalog-section');
  if (!catalogEl) return;
  const headerHeight = window.innerWidth <= 768 ? 64 : 72;
  const offset = window.innerWidth <= 768 ? 12 : 16;
  const rect = catalogEl.getBoundingClientRect();
  const targetY = Math.max(0, rect.top + window.scrollY - headerHeight - offset);

  window.scrollTo({
    top: targetY,
    behavior: smooth ? 'smooth' : 'auto',
  });
}

export default function InformationCard({ categories = [], selectedCategory, onSelectCategory }) {
  const { t } = useLanguage();
  const [isScrolledPast, setIsScrolledPast] = useState(false);
  const touchStartY = useRef(null);
  const isNavigating = useRef(false);

  // Monitor scroll position for graceful fade animation
  useEffect(() => {
    const handleScroll = () => {
      const catalogEl = document.getElementById('catalog-section');
      if (!catalogEl) return;
      const headerHeight = window.innerWidth <= 768 ? 64 : 72;
      const rect = catalogEl.getBoundingClientRect();
      setIsScrolledPast(rect.top <= headerHeight + 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Wheel gesture listener: Scrolling down from the hero smoothly glides to catalog
  useEffect(() => {
    let timer = null;

    const handleWheel = (e) => {
      if (isNavigating.current) return;

      const currentScrollY = window.scrollY;
      // If at the very top of the desktop hero (> 850px) and scrolling downwards
      if (window.innerWidth > 850 && currentScrollY < 40 && e.deltaY > 15) {
        isNavigating.current = true;
        scrollToCatalog(true);
        clearTimeout(timer);
        timer = setTimeout(() => {
          isNavigating.current = false;
        }, 800);
      }
    };

    const handleTouchStart = (e) => {
      if (window.innerWidth > 850 && e.touches && e.touches.length === 1) {
        touchStartY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (window.innerWidth <= 850 || touchStartY.current === null || isNavigating.current) return;
      const currentScrollY = window.scrollY;
      const delta = touchStartY.current - e.touches[0].clientY;

      if (currentScrollY < 30 && delta > 25) {
        touchStartY.current = null;
        isNavigating.current = true;
        scrollToCatalog(true);
        clearTimeout(timer);
        timer = setTimeout(() => {
          isNavigating.current = false;
        }, 800);
      }
    };

    const handleTouchEnd = () => {
      touchStartY.current = null;
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      clearTimeout(timer);
    };
  }, []);

  const handleCategorySelect = useCallback(
    (catId) => {
      onSelectCategory(catId);
      // Smoothly animate down to the catalog section below the fixed navbar
      setTimeout(() => {
        scrollToCatalog(true);
      }, 50);
    },
    [onSelectCategory]
  );

  return (
    <section className={`${styles.heroContainer} ${isScrolledPast ? styles.isScrolledPast : ''}`}>
      <div className={styles.heroInner}>
        <div className={styles.headingSection}>
          <h1 className={styles.title}>
            {t('hero.titlePart1', 'Discover the')}{' '}
            <span className={styles.accent}>{t('hero.titleHighlight', 'Perfect Tool')}</span>{' '}
            {t('hero.titlePart2', 'for Any Task')}
          </h1>
          <p className={styles.description}>
            {t(
              'hero.subtitle',
              'The most advanced directory with deep filtering, real-time community verification, and bot-assisted updates.'
            )}
          </p>
        </div>

        {/* Elegant responsive category slider */}
        <div className={styles.sliderContainer}>
          <CategorySlider
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
          />
        </div>

        {/* Subtle quick-jump indicator to catalog & filters */}
        <button
          type="button"
          className={styles.scrollDownBtn}
          onClick={() => scrollToCatalog(true)}
          title={t('hero.exploreTools', 'Explore Tools & Filters')}
          aria-label={t('hero.exploreTools', 'Explore Tools & Filters')}
        >
          <span className={styles.scrollDownText}>
            {t('hero.exploreCatalog', 'Explore Directory & Filters')}
          </span>
          <ChevronDown size={14} className={styles.scrollChevron} />
        </button>
      </div>
    </section>
  );
}
