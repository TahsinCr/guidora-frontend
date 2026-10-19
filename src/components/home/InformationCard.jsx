import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import CategorySlider from './CategorySlider';
import styles from './InformationCard.module.scss';

function scrollToCatalog(smooth = true) {
  const catalogEl = document.getElementById('catalog-section');
  if (!catalogEl) return;
  const headerHeight = window.innerWidth <= 768 ? 64 : 72;
  const offset = window.innerWidth <= 768 ? 12 : 16;
  const rect = catalogEl.getBoundingClientRect();
  const targetY = Math.max(0, rect.top + window.scrollY - headerHeight - offset);

  if (!smooth) {
    window.scrollTo({ top: targetY, behavior: 'auto' });
    return;
  }

  const startY = window.scrollY;
  const distance = targetY - startY;
  if (Math.abs(distance) < 2) return;

  const duration = 460;
  const startTime = performance.now();

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Standard ease-out cubic: smooth start, natural deceleration without abrupt stops
    const ease = 1 - Math.pow(1 - progress, 3);
    window.scrollTo(0, startY + distance * ease);

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

export default function InformationCard({ categories = [], selectedCategory, onSelectCategory }) {
  const { t } = useLanguage();
  const [scrollProgress, setScrollProgress] = useState(0);
  const touchStartY = useRef(null);
  const isNavigating = useRef(false);

  // Progressive scroll interpolation: eliminates harsh threshold snapping (desktop only)
  useEffect(() => {
    let rAF = null;
    const handleScroll = () => {
      if (rAF) return;
      rAF = requestAnimationFrame(() => {
        // Below 850px, hero is already compact (only category slider), no scroll fading
        if (window.innerWidth <= 850) {
          setScrollProgress(0);
          rAF = null;
          return;
        }
        const scrollY = window.scrollY;
        // Soft, continuous transition over 150px of natural scroll
        const progress = Math.min(1, Math.max(0, scrollY / 150));
        setScrollProgress(progress);
        rAF = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rAF) cancelAnimationFrame(rAF);
    };
  }, []);

  // Wheel gesture listener: Scrolling down from the hero smoothly glides to catalog
  useEffect(() => {
    let timer = null;

    const handleWheel = (e) => {
      if (isNavigating.current) return;

      const currentScrollY = window.scrollY;
      // Require an intentional downward gesture rather than micro-twitches
      if (window.innerWidth > 850 && currentScrollY < 25 && e.deltaY > 35) {
        isNavigating.current = true;
        scrollToCatalog(true);
        clearTimeout(timer);
        timer = setTimeout(() => {
          isNavigating.current = false;
        }, 700);
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

      if (currentScrollY < 25 && delta > 40) {
        touchStartY.current = null;
        isNavigating.current = true;
        scrollToCatalog(true);
        clearTimeout(timer);
        timer = setTimeout(() => {
          isNavigating.current = false;
        }, 700);
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
      // Only auto-scroll down to catalog on desktop where large hero banner exists.
      // On screens <= 850px, hero is already compact (just categories visible), so don't scroll down!
      if (window.innerWidth > 850) {
        setTimeout(() => {
          scrollToCatalog(true);
        }, 50);
      }
    },
    [onSelectCategory]
  );

  return (
    <section
      className={styles.heroContainer}
      style={{
        opacity: Math.max(0.2, 1 - scrollProgress * 0.8),
        transform: `translateY(-${(scrollProgress * 8).toFixed(1)}px)`,
        pointerEvents: scrollProgress > 0.85 ? 'none' : 'auto',
      }}
    >
      <div className={styles.heroInner}>
        <div className={styles.headingSection}>
          <h1 className={styles.title}>
            {t('hero.titlePart1', 'Find the')}{' '}
            <span className={styles.accent}>{t('hero.titleHighlight', 'Right Tools')}</span>{' '}
            {t('hero.titlePart2', 'for Modern Engineering')}
          </h1>
          <p className={styles.description}>
            {t(
              'hero.subtitle',
              'The definitive software and developer tools directory with deep filtering, community verification, and audited catalog data.'
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
      </div>
    </section>
  );
}
