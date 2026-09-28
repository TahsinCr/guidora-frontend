import React, { useEffect } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Info,
  X,
  Loader2,
} from 'lucide-react';
import styles from '../AdminDashboardPage.module.scss';

export default function AdminConfirmModal({
  isOpen,
  title = 'İşlemi Onayla',
  message = 'Bu işlemi gerçekleştirmek istediğinize emin misiniz?',
  variant = 'danger', // 'danger' | 'warning' | 'primary' | 'info'
  confirmText = 'Onayla',
  cancelText = 'Vazgeç',
  isLoading = false,
  onConfirm,
  onClose,
}) {
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
              {title}
            </h3>
            <p className={styles.confirmMessage}>{message}</p>
          </div>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            disabled={isLoading}
            aria-label="Kapat"
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
            {cancelText}
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
                <span>İşleniyor...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
