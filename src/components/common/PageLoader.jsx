import React from 'react';
import styles from './PageLoader.module.scss';

export default function PageLoader({ text = 'Yükleniyor...' }) {
  return (
    <div className={styles.loaderContainer} role="status" aria-live="polite">
      <div className={styles.spinner} />
      {text && <span className={styles.loaderText}>{text}</span>}
    </div>
  );
}

