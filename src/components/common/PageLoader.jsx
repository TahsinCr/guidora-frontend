import React, { useState, useEffect } from 'react';
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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure all styles, layout and DOM measurements are calculated before making visible
    const timer = requestAnimationFrame(() => {
      setIsReady(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  const containerClass = `${styles.loaderContainer} ${styles[variant] || ''} ${isReady ? styles.ready : styles.hidden} ${className}`;

  return (
    <div className={containerClass} role="status" aria-live="polite">
      <div className={styles.visualStage}>
        {/* Atmospheric Ambient Glow behind compass */}
        <div className={styles.ambientGlow} />

        {/* Center Floating Enlarged Guidora Compass */}
        <div className={styles.compassFloatWrapper}>
          <svg
            className={styles.compassSvg}
            width="56"
            height="56"
            viewBox="0 0 42 42"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer Compass Target Ring */}
            <circle
              cx="21"
              cy="21"
              r="15"
              stroke="url(#compassRingGradient)"
              strokeWidth="2.8"
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
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <linearGradient id="compassNeedleGradient" x1="16" y1="16" x2="25" y2="25">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#e2e8f0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Newton's Cradle 5 Purple Dots */}
        <div className={styles.newtonCradle} aria-hidden="true">
          <span className={`${styles.cradleDot} ${styles.leftDot}`} />
          <span className={`${styles.cradleDot} ${styles.midDot1}`} />
          <span className={`${styles.cradleDot} ${styles.centerDot}`} />
          <span className={`${styles.cradleDot} ${styles.midDot2}`} />
          <span className={`${styles.cradleDot} ${styles.rightDot}`} />
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
