import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './LanguageDropdown.module.scss';

export default function LanguageDropdown() {
  const { lang, setLang, supportedLanguages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentLang = supportedLanguages.find((l) => l.code === lang) || supportedLanguages[0];

  return (
    <div className={styles.wrapper} ref={dropdownRef}>
      <button
        type="button"
        className={`${styles.langTrigger} ${isOpen ? styles.active : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select Language"
        title="Change language / Dil seçimi / Выбор языка"
      >
        <Globe size={16} className={styles.globeIcon} />
        <span className={styles.langCode}>{currentLang.code.toUpperCase()}</span>
        <ChevronDown size={13} className={`${styles.chevron} ${isOpen ? styles.rotated : ''}`} />
      </button>

      {isOpen && (
        <div className={styles.menu}>
          <div className={styles.menuHeader}>{t('lang.selectLanguage', 'Select Language')}</div>
          <div className={styles.optionsList}>
            {supportedLanguages.map((item) => {
              const isSelected = item.code === lang;
              return (
                <button
                  key={item.code}
                  type="button"
                  className={`${styles.optionItem} ${isSelected ? styles.selected : ''}`}
                  onClick={() => {
                    setLang(item.code);
                    setIsOpen(false);
                  }}
                >
                  <span className={styles.flag}>{item.flag}</span>
                  <div className={styles.langLabels}>
                    <span className={styles.langName}>{item.nativeName}</span>
                    <span className={styles.langSub}>({item.name})</span>
                  </div>
                  {isSelected && <Check size={14} className={styles.checkIcon} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
