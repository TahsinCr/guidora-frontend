import React from 'react';
import styles from './PageLoader.module.scss';

/**
 * Guidora Professional Animated Loader
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
      <div className={styles.visualStage}>
        {/* Ambient Subtle Glow */}
        <div className={styles.ambientGlow} />

        {/* Clean Precision Spinner Track & Progress Arc */}
        <div className={styles.spinnerRing}>
          <svg className={styles.spinnerSvg} viewBox="0 0 88 88" fill="none">
            <circle
              cx="44"
              cy="44"
              r="40"
              stroke="currentColor"
              strokeWidth="2.5"
              className={styles.trackCircle}
            />
            <circle
              cx="44"
              cy="44"
              r="40"
              stroke="url(#spinnerGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              className={styles.indicatorCircle}
            />
            <defs>
              <linearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4e5ce2" />
                <stop offset="50%" stopColor="#8a38f5" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Center Floating Guidora Compass (Clean, pure icon floating & spinning) */}
        <div className={styles.compassFloatWrapper}>
          <svg
            className={styles.compassSvg}
            viewBox="0 0 42 42"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer Compass Target Ring */}
            <circle
              cx="21"
              cy="21"
              r="14"
              stroke="url(#compassRingGradient)"
              strokeWidth="2.5"
              className={styles.compassTargetRing}
            />
            {/* Inner Precision Guidora Needle / Star */}
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M24.8566 16.4761L23.1424 23.1424L16.476 24.8566L18.1902 18.1903L24.8566 16.4761ZM20.6663 19.1426L22.19 20.6663L20.6663 22.1901L19.1426 20.6663L20.6663 19.1426Z"
              fill="url(#compassNeedleGradient)"
              className={styles.compassNeedle}
            />
            <defs>
              <linearGradient id="compassRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8a38f5" />
                <stop offset="100%" stopColor="#4c82fb" />
              </linearGradient>
              <linearGradient id="compassNeedleGradient" x1="16" y1="16" x2="25" y2="25">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#cbd5e1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Typography & Status Feedback */}
      <div className={styles.content}>
        <span className={styles.title}>Guidora</span>
        {text && <p className={styles.statusMessage}>{text}</p>}
        {subtext && <span className={styles.subtextMessage}>{subtext}</span>}
      </div>
    </div>
  );
}
