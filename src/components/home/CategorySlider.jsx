import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Circle, Terminal, Image as ImageIcon, MessageSquare, Video, Database, Music, Briefcase, Box } from 'lucide-react';
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

export default function CategorySlider({ categories = [], selectedCategory, onSelectCategory }) {
  const scrollRef = useRef(null);

  const handleScrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -240, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  // Exclude 'all' from pills
  const filteredCategories = categories.filter((c) => c.id !== 'all');

  return (
    <div className={styles.sliderWrapper} aria-label="Mobile Category Carousel">
      <button
        type="button"
        className={styles.navBtn}
        onClick={handleScrollLeft}
        aria-label="Scroll categories left"
      >
        <ChevronLeft size={16} />
      </button>

      <div className={styles.scrollTrack} ref={scrollRef}>
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
                <Icon size={12} color={cat.color || '#818cf8'} />
              </span>
              <span className={styles.catName}>{cat.name}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className={styles.navBtn}
        onClick={handleScrollRight}
        aria-label="Scroll categories right"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

