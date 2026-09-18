import React from 'react';
import CategorySlider from './CategorySlider';
import styles from './InformationCard.module.scss';

export default function InformationCard({ categories = [], selectedCategory, onSelectCategory }) {
  // Desktop pills (from popular categories or categories prop)
  const pills = categories.filter((c) => c.id !== 'all').slice(0, 5);

  return (
    <section className={styles.heroContainer}>
      {/* Desktop Hero View (> 850px) */}
      <div className={styles.desktopHero}>
        <h1 className={styles.title}>
          Discover the <span className={styles.accent}>Perfect Tool</span> for Any Task
        </h1>
        <p className={styles.description}>
          The most advanced directory with deep filtering, real-time community verification, and bot-assisted updates.
        </p>

        <nav className={styles.pillsNav} aria-label="Category Filters">
          {pills.map((pill) => {
            const isActive = selectedCategory === pill.id;

            return (
              <button
                key={pill.id}
                type="button"
                className={`${styles.categoryPill} ${isActive ? styles.active : ''}`}
                style={{
                  '--pill-color': pill.color || '#818cf8',
                  '--pill-border': 'rgba(129, 140, 248, 0.45)',
                }}
                onClick={() => onSelectCategory(isActive ? 'all' : pill.id)}
              >
                <span
                  className={styles.pillDot}
                  style={{ backgroundColor: pill.color || '#818cf8' }}
                />
                <span>@{pill.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile/Tablet Category Slider (<= 850px) - Matches user mockup */}
      <div className={styles.mobileSliderRow}>
        <CategorySlider
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
        />
      </div>
    </section>
  );
}
