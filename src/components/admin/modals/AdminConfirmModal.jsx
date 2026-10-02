import React, { useEffect } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Info,
  X,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import styles from '../AdminDashboardPage.module.scss';

export default function AdminConfirmModal({
  isOpen,
  title,
  message,
  variant = 'danger', // 'danger' | 'warning' | 'primary' | 'info'
  confirmText,
  cancelText,
  isLoading = false,
  onConfirm,
  onClose,
}) {
  const { t } = useLanguage();

  const finalTitle = title || t('admin.confirmTitleDefault') || 'İşlemi Onayla';
  const finalMessage = message || t('admin.confirmMessageDefault') || 'Bu işlemi gerçekleştirmek istediğinize emin misiniz?';
  const finalConfirmText = confirmText || t('admin.confirmBtnConfirm') || 'Onayla';
  const finalCancelText = cancelText || t('admin.confirmBtnCancel') || 'Vazgeç';

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const renderIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertTriangle size={24} className={styles.confirmIconDanger} />;
      case 'warning':
        return <AlertCircle size={24} className={styles.confirmIconWarning} />;
      case 'info':
        return <Info size={24} className={styles.confirmIconInfo} />;
      default:
        return <HelpCircle size={24} className={styles.confirmIconPrimary} />;
    }
  };

  const getConfirmBtnClass = () => {
    switch (variant) {
      case 'danger':
        return styles.confirmBtnDanger;
      case 'warning':
        return styles.confirmBtnWarning;
      case 'info':
        return styles.confirmBtnInfo;
      default:
        return styles.confirmBtnPrimary;
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={() => {
        if (!isLoading) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className={`${styles.modalContainer} ${styles.confirmModalBox}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.confirmHeader}>
          <div className={styles.confirmIconWrapper}>{renderIcon()}</div>
          <div className={styles.confirmTitleArea}>
            <h3 id="confirm-modal-title" className={styles.confirmTitle}>
              {finalTitle}
            </h3>
            <p className={styles.confirmMessage}>{finalMessage}</p>
          </div>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            disabled={isLoading}
            aria-label={t('admin.close') || 'Kapat'}
          >
            <X size={18} />
          </button>
        </div>

        <div className={styles.confirmFooter}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isLoading}
          >
            {finalCancelText}
          </button>
          <button
            type="button"
            className={`${styles.confirmBtn} ${getConfirmBtnClass()}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className={styles.spinIcon} />
                <span>{t('admin.processing') || 'İşlem yapılıyor...'}</span>
              </>
            ) : (
              finalConfirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
