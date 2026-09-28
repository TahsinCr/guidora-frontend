import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  Copy,
  Check,
  ShieldAlert,
  Server,
  Terminal,
  Activity,
  User,
} from 'lucide-react';
import styles from '../AdminDashboardPage.module.scss';

export default function JsonbDiffModal({
  log,
  onClose,
  onRevert,
}) {
  const [copiedTrace, setCopiedTrace] = useState(false);
  const [isReverting, setIsReverting] = useState(false);

  if (!log) return null;

  const handleCopyTrace = () => {
    if (log.traceId) {
      navigator.clipboard?.writeText(log.traceId);
      setCopiedTrace(true);
      setTimeout(() => setCopiedTrace(false), 2000);
    }
  };

  const handleRevertConfirm = () => {
    if (window.confirm(`[${log.id}] no'lu işlem geri alınsın mı? Bu işlem varlığı önceki durumuna (oldValues) döndürecektir.`)) {
      setIsReverting(true);
      try {
        onRevert(log.id);
        onClose();
      } catch (err) {
        alert('Geri alma başarısız: ' + err.message);
      } finally {
        setIsReverting(false);
      }
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
                xmin: {log.xmin || '49201'}
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
            aria-label="Kapat"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          {/* Metadata Card */}
          <div className={styles.diffMetadataCard}>
            <div className={styles.metaCol}>
              <div className={styles.metaLabel}>Aktör</div>
              <div className={styles.metaValue}>
                <User size={14} />
                <span>{log.actor}</span>
                {log.actorRole && (
                  <span className={styles.roleTag}>({log.actorRole})</span>
                )}
              </div>
            </div>

            <div className={styles.metaCol}>
              <div className={styles.metaLabel}>İstemci IP & Cihaz</div>
              <div className={styles.metaValue}>
                <Server size={14} />
                <span>{log.actorIp || '127.0.0.1'}</span>
              </div>
            </div>

            <div className={styles.metaCol}>
              <div className={styles.metaLabel}>Zaman Damgası</div>
              <div className={styles.metaValue}>
                <span>{new Date(log.timestamp).toLocaleString('tr-TR')}</span>
              </div>
            </div>

            <div className={styles.metaCol}>
              <div className={styles.metaLabel}>Trace ID (OpenTelemetry)</div>
              <div className={styles.metaValue}>
                <code className={styles.traceCode}>{log.traceId || 'N/A'}</code>
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={handleCopyTrace}
                  title="Trace ID Kopyala"
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
                <span className={styles.diffPaneTitle}>Önceki Durum (oldValues)</span>
                <span className={styles.diffStatusTag}>{oldJson ? 'Kaldırılan / Eski' : 'Yok (İlk Kayıt)'}</span>
              </div>
              <pre className={styles.diffCode}>
                {oldJson || '// Önceki kayıt mevcut değil (Yeni varlık oluşturuldu)'}
              </pre>
            </div>

            {/* Right: New Values */}
            <div className={`${styles.diffPane} ${styles.diffNew}`}>
              <div className={styles.diffPaneHeader}>
                <span className={styles.diffPaneTitle}>Yeni Durum (newValues)</span>
                <span className={styles.diffStatusTag}>Uygulanan / Güncel</span>
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
              onClick={handleRevertConfirm}
              disabled={isReverting}
              title="Bu değişikliği geri al ve önceki verilere dön"
            >
              <RotateCcw size={16} />
              <span>{isReverting ? 'Geri Alınıyor...' : 'Değişikliği Geri Al (Revert)'}</span>
            </button>
          ) : (
            <div className={styles.noRevertHint}>
              İlk kayıt oluşturma işlemi için geri alma verisi yoktur.
            </div>
          )}

          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
