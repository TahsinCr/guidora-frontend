import React from 'react';
import styles from './PageLoader.module.scss';

/**
 * Guidora Animated Loader
 * @param {'fullscreen'|'page'|'popup'|'inline'} variant
 * @param {string} text
 * @param {string} subtext
 */
export default function PageLoader({
  variant = 'page',
  text,
  subtext,
  className = '',
}) {
  const containerClass = `${styles.loaderContainer} ${styles[variant] || ''} ${className}`;

  return (
    <div className={containerClass} role="status" aria-live="polite">
      <div className={styles.logoOrb}>
        {/* Animated Radial Pulse Aura */}
        <div className={styles.auraGlow} />

        {/* Orbit Ring */}
        <div className={styles.orbitRing}>
          <div className={styles.orbitParticle} />
        </div>

        {/* Core Compass Logo Emblem */}
        <div className={styles.coreLogo}>
          <svg
            width="34"
            height="34"
            viewBox="0 0 42 42"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={styles.compassSvg}
          >
            <circle
              cx="21"
              cy="21"
              r="12"
              stroke="currentColor"
              strokeWidth="2.5"
              className={styles.compassRing}
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M24.8566 16.4761L23.1424 23.1424L16.476 24.8566L18.1902 18.1903L24.8566 16.4761ZM20.6663 19.1426L22.19 20.6663L20.6663 22.1901L19.1426 20.6663L20.6663 19.1426Z"
              fill="currentColor"
              className={styles.compassNeedle}
            />
          </svg>
        </div>
      </div>

      {/* Brand & Loading Indicator Text */}
      <div className={styles.textWrapper}>
        <span className={styles.brandTitle}>
          Guidora <span className={styles.shimmerDots}>...</span>
        </span>
        {text && <p className={styles.statusText}>{text}</p>}
        {subtext && <span className={styles.subText}>{subtext}</span>}
      </div>
    </div>
  );
}
