import React, { useState, useEffect } from 'react';
import CategorySlider from './CategorySlider';
import styles from './InformationCard.module.scss';

export default function InformationCard({ categories = [], selectedCategory, onSelectCategory }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Hero starts shrinking after scrolling 60px down
      if (window.scrollY > 60) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className={`${styles.heroContainer} ${isScrolled ? styles.compactMode : ''}`}>
      <div className={styles.heroInner}>
        <div className={styles.headingSection}>
          <h1 className={styles.title}>
            Discover the <span className={styles.accent}>Perfect Tool</span> for Any Task
          </h1>
          <p className={styles.description}>
            The most advanced directory with deep filtering, real-time community verification, and bot-assisted updates.
          </p>
        </div>

        {/* Both desktop and mobile use the elegant slider with left/right buttons */}
        <div className={styles.sliderContainer}>
          <CategorySlider
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={onSelectCategory}
          />
        </div>
      </div>
    </section>
  );
}
