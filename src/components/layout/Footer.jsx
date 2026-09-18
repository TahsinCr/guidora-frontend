import React from 'react';
import { Sparkles } from 'lucide-react';
import styles from './Footer.module.scss';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.logoIcon}>
            <Sparkles size={14} />
          </div>
          <span className={styles.logoText}>Guidora</span>
        </div>

        <nav className={styles.links} aria-label="Footer navigation">
          <a href="#api" className={styles.link}>API Access</a>
          <a href="#privacy" className={styles.link}>Privacy</a>
          <a href="#about" className={styles.link}>About Us</a>
          <a href="#submit" className={styles.link}>Submit Tool</a>
        </nav>

        <p className={styles.copyright}>
          @ 2026 Guidora. The definitive AI tool directory. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
