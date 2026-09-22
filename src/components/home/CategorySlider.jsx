import { useRef, useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getCategoryIcon } from '@/constants/categoryIcons';
import styles from './CategorySlider.module.scss';

export default function CategorySlider({
  categories = [],
  selectedCategory,
  onSelectCategory,
  isCompact = false,
}) {
  const { translateCategory } = useLanguage();
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
  }, []);

  useEffect(() => {
    checkScroll();
    let resizeTimer;
    const handleResize = () => {
      cancelAnimationFrame(resizeTimer);
      resizeTimer = requestAnimationFrame(checkScroll);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      cancelAnimationFrame(resizeTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [categories, isCompact, checkScroll]);

  const handleScrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -280, behavior: 'smooth' });
      setTimeout(checkScroll, 320);
    }
  };

  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 280, behavior: 'smooth' });
      setTimeout(checkScroll, 320);
    }
  };

  // Exclude 'all' from pills
  const filteredCategories = categories.filter((c) => c.id !== 'all');

  return (
    <div
      className={`${styles.sliderWrapper} ${isCompact ? styles.compactSlider : ''}`}
      aria-label="Category Carousel"
    >
      <button
        type="button"
        className={`${styles.navBtn} ${!canScrollLeft ? styles.navBtnDisabled : ''}`}
        onClick={handleScrollLeft}
        aria-label="Scroll categories left"
        disabled={!canScrollLeft}
      >
        <ChevronLeft size={16} />
      </button>

      <div
        className={styles.scrollTrack}
        ref={scrollRef}
        onScroll={checkScroll}
      >
        {filteredCategories.map((cat) => {
          const Icon = getCategoryIcon(cat.id);
          const isActive = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              className={`${styles.catPill} ${isActive ? styles.pillActive : ''}`}
              style={{
                '--cat-color': cat.color || '#818cf8',
              }}
              onClick={() => onSelectCategory(isActive ? 'all' : cat.id)}
            >
              <span className={styles.iconDot}>
                <Icon size={13} color={cat.color || '#818cf8'} />
              </span>
              <span className={styles.catName}>{translateCategory(cat.id, cat.name)}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className={`${styles.navBtn} ${!canScrollRight ? styles.navBtnDisabled : ''}`}
        onClick={handleScrollRight}
        aria-label="Scroll categories right"
        disabled={!canScrollRight}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
