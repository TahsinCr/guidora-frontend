import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  Copy,
  Check,
  Server,
  User,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import toastService from '@/services/toast/toastService';
import AdminConfirmModal from './AdminConfirmModal';
import styles from '../AdminDashboardPage.module.scss';

export default function JsonbDiffModal({
  log,
  onClose,
  onRevert,
}) {
  const { t } = useLanguage();
  const [copiedTrace, setCopiedTrace] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [confirmRevertOpen, setConfirmRevertOpen] = useState(false);

  if (!log) return null;

  const handleCopyTrace = () => {
    if (log.traceId) {
      navigator.clipboard?.writeText(log.traceId);
      setCopiedTrace(true);
      toastService.success(t('admin.traceCopied') || 'Trace ID panoya kopyalandı.');
      setTimeout(() => setCopiedTrace(false), 2000);
    }
  };

  const handleRevertConfirmed = () => {
    setIsReverting(true);
    try {
      onRevert(log.id);
      onClose();
    } catch (err) {
      toastService.error((t('admin.revertFailed') || 'Geri alma başarısız: ') + err.message);
    } finally {
      setIsReverting(false);
      setConfirmRevertOpen(false);
    }
  };

  const oldJson = log.oldValues ? JSON.stringify(log.oldValues, null, 2) : null;
  const newJson = log.newValues ? JSON.stringify(log.newValues, null, 2) : '{}';

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={`${styles.modalContainer} ${styles.diffModal}`} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderInfo}>
            <div className={styles.modalBadgeRow}>
              <span className={`${styles.logLevelBadge} ${styles[log.level?.toLowerCase() || 'info']}`}>
                {log.level || 'INFO'}
              </span>
              <span className={styles.logCategoryBadge}>
                {log.category || 'SYSTEM'}
              </span>
              <span className={styles.logXminBadge}>
                TxID: {log.txId || log.xmin || '49201'}
              </span>
            </div>
            <h2 className={styles.modalTitle}>
              {log.action}
              <span className={styles.modalSubtitle}> — {log.target}</span>
            </h2>
          </div>

          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label={t('admin.close') || 'Kapat'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          {/* Metadata Card */}
          <div className={styles.diffMetadataCard}>
            <div className={styles.metaCol}>
              <div className={styles.metaLabel}>{t('admin.colActor') || 'Aktör'}</div>
              <div className={styles.metaValue}>
                <User size={14} />
                <span>{log.actor}</span>
                {log.actorRole && (
                  <span className={styles.roleTag}>({log.actorRole})</span>
                )}
              </div>
            </div>

            <div className={styles.metaCol}>
              <div className={styles.metaLabel}>{t('admin.colClientIp') || 'İstemci IP & Cihaz'}</div>
              <div className={styles.metaValue}>
                <Server size={14} />
                <span>{log.actorIp || '127.0.0.1'}</span>
              </div>
            </div>

            <div className={styles.metaCol}>
              <div className={styles.metaLabel}>{t('admin.colTimestamp') || 'Zaman Damgası'}</div>
              <div className={styles.metaValue}>
                <span>{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            </div>

            <div className={styles.metaCol}>
              <div className={styles.metaLabel}>{t('admin.colTraceTxid') || 'Trace / TxID'}</div>
              <div className={styles.metaValue}>
                <code className={styles.traceCode}>{log.traceId || 'N/A'}</code>
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={handleCopyTrace}
                  title={t('admin.traceCopied') || 'Trace ID Kopyala'}
                >
                  {copiedTrace ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>

          {/* JSONB Side-by-Side Diff */}
          <div className={styles.diffGrid}>
            {/* Left: Old Values */}
            <div className={`${styles.diffPane} ${styles.diffOld}`}>
              <div className={styles.diffPaneHeader}>
                <span className={styles.diffPaneTitle}>{t('admin.diffOldValues') || 'Önceki Durum (oldValues)'}</span>
                <span className={styles.diffStatusTag}>{oldJson ? 'Old' : 'N/A'}</span>
              </div>
              <pre className={styles.diffCode}>
                {oldJson || '// Initial record / No prior state'}
              </pre>
            </div>

            {/* Right: New Values */}
            <div className={`${styles.diffPane} ${styles.diffNew}`}>
              <div className={styles.diffPaneHeader}>
                <span className={styles.diffPaneTitle}>{t('admin.diffNewValues') || 'Yeni Durum (newValues)'}</span>
                <span className={styles.diffStatusTag}>Current</span>
              </div>
              <pre className={styles.diffCode}>
                {newJson}
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={styles.modalFooter}>
          {log.oldValues ? (
            <button
              type="button"
              className={styles.revertBtn}
              onClick={() => setConfirmRevertOpen(true)}
              disabled={isReverting}
              title={t('admin.revertAction') || 'Bu değişikliği geri al'}
            >
              <RotateCcw size={16} />
              <span>{isReverting ? (t('admin.processing') || 'Geri Alınıyor...') : (t('admin.revertAction') || 'İşlemi Geri Al (Revert)')}</span>
            </button>
          ) : (
            <div className={styles.noRevertHint}>
              {t('admin.noOldValues') || 'İlk kayıt oluşturma işlemi için geri alma verisi yoktur.'}
            </div>
          )}

          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
          >
            {t('admin.close') || 'Kapat'}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AdminConfirmModal
        isOpen={confirmRevertOpen}
        title={t('admin.revertConfirmTitle') || 'İşlemi Geri Al (Revert)'}
        message={t('admin.revertConfirmMsg') || `[${log.id}] numaralı işlemi geri almak istediğinize emin misiniz?`}
        variant="warning"
        confirmText={t('admin.revertAction') || 'Geri Al'}
        cancelText={t('admin.confirmBtnCancel') || 'Vazgeç'}
        onConfirm={handleRevertConfirmed}
        onClose={() => setConfirmRevertOpen(false)}
      />
    </div>
  );
}

