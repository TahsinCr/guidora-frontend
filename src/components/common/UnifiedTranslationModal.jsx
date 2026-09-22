import React, { useState, useEffect } from 'react';
import { Globe, X, CheckCheck, Plus } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './UnifiedTranslationModal.module.scss';

export default function UnifiedTranslationModal({
  isOpen,
  onClose,
  title,
  subtitle,
  itemType = 'item', // 'category' | 'tag_category' | 'tag'
  baseName = '',
  initialTranslations = {},
  onSave,
}) {
  const { t, supportedLanguages = [] } = useLanguage();
  const [translationValues, setTranslationValues] = useState({});
  const [customLangs, setCustomLangs] = useState([]);
  const [newCustomLangInput, setNewCustomLangInput] = useState('');

  // Sync state when modal opens or initialTranslations changes
  useEffect(() => {
    if (isOpen) {
      setTranslationValues({ ...(initialTranslations || {}) });
      // Identify any extra ISO codes in initialTranslations not in supportedLanguages
      const standardCodes = new Set(['en', ...supportedLanguages.map((l) => l.code)]);
      const extras = Object.keys(initialTranslations || {}).filter(
        (code) => !standardCodes.has(code) && code !== 'en'
      );
      setCustomLangs(extras);
      setNewCustomLangInput('');
    }
  }, [isOpen, initialTranslations, supportedLanguages]);

  if (!isOpen) return null;

  const handleAddCustomLang = () => {
    const code = newCustomLangInput.trim().toLowerCase();
    if (
      code &&
      !['en', ...supportedLanguages.map((l) => l.code), ...customLangs].includes(code)
    ) {
      setCustomLangs((prev) => [...prev, code]);
      setNewCustomLangInput('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      // Clean up values: trim whitespace
      const cleaned = {};
      Object.entries(translationValues).forEach(([k, v]) => {
        if (typeof v === 'string' && v.trim()) {
          cleaned[k] = v.trim();
        }
      });
      onSave(cleaned);
    }
    onClose();
  };

  // Determine friendly title based on itemType if title not explicitly provided
  const modalTitle =
    title ||
    (itemType === 'category'
      ? t('admin.translateCategory', 'Translate Category')
      : itemType === 'tag_category'
      ? t('admin.translateTagCategory', 'Translate Tag Group')
      : t('admin.translateTag', 'Translate Tag'));

  const modalSubtitle =
    subtitle ||
    t(
      'admin.translationModalDesc',
      'Configure localized names. If left blank, it will automatically fall back to the default English name.'
    );

  return (
    <div
      className={styles.modalBackdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="unified-translation-modal-title"
    >
      <div className={styles.transModalCard}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <h3 id="unified-translation-modal-title" className={styles.modalTitle}>
              <Globe size={18} className={styles.modalTitleIcon} />
              <span>{modalTitle}</span>
            </h3>
            <p className={styles.modalSubtitle}>{modalSubtitle}</p>
          </div>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Base Reference Box */}
        <div className={styles.transReferenceBox}>
          <div className={styles.refLabel}>
            {t('admin.defaultEnglishName', 'Default (English / Base Name)')}:
          </div>
          <div className={styles.refValue}>{baseName || '(Not set)'}</div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className={styles.transLangList}>
            {supportedLanguages
              .filter((l) => l.code !== 'en')
              .map((lang) => {
                const val = translationValues[lang.code] || '';
                const langTitle =
                  lang.nativeName || lang.name || lang.label || lang.code.toUpperCase();
                const isFilled = Boolean(val.trim());

                return (
                  <div key={lang.code} className={styles.transLangRow}>
                    <div className={styles.transLangMeta}>
                      <span className={styles.transLangFlag}>{lang.flag || '🌐'}</span>
                      <div className={styles.transLangInfo}>
                        <div className={styles.transLangTitle}>
                          {langTitle} ({lang.code.toUpperCase()})
                        </div>
                        <div className={styles.transStatusWrap}>
                          {isFilled ? (
                            <span className={styles.transBadgeFilled}>
                              <CheckCheck size={11} /> Active Translation
                            </span>
                          ) : (
                            <span className={styles.transBadgeFallback}>
                              Falls back to "{baseName || 'Default'}"
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <input
                      type="text"
                      className={styles.transInput}
                      placeholder={`Enter ${langTitle} localized name...`}
                      value={val}
                      onChange={(e) =>
                        setTranslationValues({
                          ...translationValues,
                          [lang.code]: e.target.value,
                        })
                      }
                    />
                  </div>
                );
              })}

            {/* Custom Dynamic Added Languages */}
            {customLangs.map((code) => {
              const val = translationValues[code] || '';
              const isFilled = Boolean(val.trim());

              return (
                <div key={code} className={styles.transLangRow}>
                  <div className={styles.transLangMeta}>
                    <span className={styles.transLangFlag}>🌐</span>
                    <div className={styles.transLangInfo}>
                      <div className={styles.transLangTitle}>
                        Custom Language ({code.toUpperCase()})
                      </div>
                      <div className={styles.transStatusWrap}>
                        {isFilled ? (
                          <span className={styles.transBadgeFilled}>
                            <CheckCheck size={11} /> Active Translation
                          </span>
                        ) : (
                          <span className={styles.transBadgeFallback}>
                            Falls back to "{baseName || 'Default'}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    className={styles.transInput}
                    placeholder={`Enter ${code.toUpperCase()} translation...`}
                    value={val}
                    onChange={(e) =>
                      setTranslationValues({
                        ...translationValues,
                        [code]: e.target.value,
                      })
                    }
                  />
                </div>
              );
            })}

            {/* Add dynamic new target language row */}
            <div className={styles.transAddCustomRow}>
              <input
                type="text"
                className={styles.customLangInput}
                placeholder="Add custom ISO language code (e.g. es, fr, de, ja)..."
                value={newCustomLangInput}
                onChange={(e) => setNewCustomLangInput(e.target.value)}
                maxLength={5}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomLang();
                  }
                }}
              />
              <button
                type="button"
                className={styles.addLangBtn}
                onClick={handleAddCustomLang}
                disabled={!newCustomLangInput.trim()}
              >
                <Plus size={14} /> Add Language
              </button>
            </div>
          </div>

          {/* Modal Footer */}
          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              {t('common.cancel', 'Cancel')}
            </button>
            <button type="submit" className={styles.primaryBtn}>
              <CheckCheck size={16} />
              <span>{t('admin.saveTranslations', 'Apply Translations')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

