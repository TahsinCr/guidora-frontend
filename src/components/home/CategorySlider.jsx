import React, { useRef, useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Circle,
  Terminal,
  Image as ImageIcon,
  MessageSquare,
  Video,
  Database,
  Music,
  Briefcase,
  Box,
} from 'lucide-react';
import styles from './CategorySlider.module.scss';

const ICON_MAP = {
  'generative-art': Circle,
  'developer-tools': Terminal,
  'design-ui': ImageIcon,
  'llms-ai': MessageSquare,
  'video-motion': Video,
  'data-science': Database,
  'audio-music': Music,
  'productivity': Briefcase,
  '3d-motion': Box,
};

export default function CategorySlider({
  categories = [],
  selectedCategory,
  onSelectCategory,
  isCompact = false,
}) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [categories]);

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
      className={`${styles.sliderWrapper} ${!isCompact ? styles.arrowsHidden : ''}`}
      aria-label="Category Carousel"
    >
      {isCompact && (
        <button
          type="button"
          className={`${styles.navBtn} ${!canScrollLeft ? styles.navBtnDisabled : ''}`}
          onClick={handleScrollLeft}
          aria-label="Scroll categories left"
          disabled={!canScrollLeft}
        >
          <ChevronLeft size={16} />
        </button>
      )}

      <div
        className={styles.scrollTrack}
        ref={scrollRef}
        onScroll={checkScroll}
      >
        {filteredCategories.map((cat) => {
          const Icon = ICON_MAP[cat.id] || Circle;
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
              <span className={styles.catName}>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {isCompact && (
        <button
          type="button"
          className={`${styles.navBtn} ${!canScrollRight ? styles.navBtnDisabled : ''}`}
          onClick={handleScrollRight}
          aria-label="Scroll categories right"
          disabled={!canScrollRight}
        >
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}
