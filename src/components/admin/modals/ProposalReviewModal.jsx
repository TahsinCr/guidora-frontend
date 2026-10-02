import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  GitPullRequest,
  User,
  Clock,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import styles from '../AdminDashboardPage.module.scss';

export default function ProposalReviewModal({
  proposal,
  isOpen,
  onClose,
  onResolve,
  onOpenTool,
  isLoading = false,
}) {
  const { t, language } = useLanguage();
  const [notes, setNotes] = useState('');

  const rejectionPresets = [
    t('admin.proposalPresetIncomplete', 'Eksik / Yetersiz Bilgi'),
    t('admin.proposalPresetSpam', 'Spam / Tanıtım Amaçlı'),
    t('admin.proposalPresetCategoryMismatch', 'Kategori Uyuşmazlığı'),
    t('admin.proposalPresetUnverifiedSource', 'Resmi Kaynak Doğrulanamadı'),
    t('admin.proposalPresetDuplicate', 'Mükerrer Teklif'),
  ];

  useEffect(() => {
    if (proposal) {
      setNotes(proposal.reviewNotes || '');
    }
  }, [proposal]);

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

  if (!isOpen || !proposal) return null;

  const handleSelectPreset = (preset) => {
    setNotes((prev) => (prev ? `${prev} - ${preset}` : preset));
  };

  const dateLocale = language === 'en' ? 'en-US' : language === 'ru' ? 'ru-RU' : 'tr-TR';

  return (
    <div
      className={styles.modalOverlay}
      onClick={() => {
        if (!isLoading) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`${styles.modalContainer} ${styles.proposalModalBox}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderInfo}>
            <div className={styles.propBadgeRow}>
              <span className={`${styles.statusBadge} ${styles[proposal.status]}`}>
                {proposal.status === 'pending'
                  ? t('admin.statusPendingReview', 'İnceleme Bekliyor')
                  : proposal.status === 'accepted'
                  ? t('admin.statusApproved', 'Onaylandı')
                  : t('admin.statusRejected', 'Reddedildi')}
              </span>
              <span className={styles.propIdTag}>ID: {proposal.id}</span>
            </div>
            <h2 className={styles.modalTitle}>
              {proposal.toolName} — {t('admin.proposalChangeTitle', 'Değişiklik Teklifi')}
            </h2>
          </div>

          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            disabled={isLoading}
            aria-label={t('admin.close', 'Kapat')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* Metadata Grid */}
          <div className={styles.diffMetadataCard}>
            <div className={styles.metaCol}>
              <div className={styles.metaLabel}>{t('admin.proposalProposerUser', 'Öneren Kullanıcı')}</div>
              <div className={styles.metaValue}>
                <User size={14} />
                <span>{proposal.proposer || t('admin.proposalAnonymous', 'Anonim')}</span>
                {proposal.proposerRole && (
                  <span className={styles.roleTagSmall}>({proposal.proposerRole})</span>
                )}
              </div>
            </div>

            <div className={styles.metaCol}>
              <div className={styles.metaLabel}>{t('admin.proposalSubmittedAt', 'Gönderilme Tarihi')}</div>
              <div className={styles.metaValue}>
                <Clock size={14} />
                <span>{new Date(proposal.submittedAt).toLocaleString(dateLocale)}</span>
              </div>
            </div>

            <div className={styles.metaCol}>
              <div className={styles.metaLabel}>{t('admin.proposalRelatedTool', 'İlgili Araç')}</div>
              <div className={styles.metaValue}>
                <span>{proposal.toolName}</span>
                {proposal.toolId && onOpenTool && (
                  <button
                    type="button"
                    className={styles.toolLinkBtn}
                    onClick={() => {
                      onOpenTool(proposal.toolId);
                      onClose();
                    }}
                    title={t('admin.proposalOpenTool', 'Aracı Aç')}
                    aria-label={t('admin.proposalOpenTool', 'Aracı Aç')}
                  >
                    <ExternalLink size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Proposal Summary */}
          {proposal.summary && (
            <div className={styles.propSummaryBox}>
              <strong>{t('admin.proposalSummaryTitle', 'Teklif Özeti:')}</strong>
              <p>{proposal.summary}</p>
            </div>
          )}

          {/* Delta Changes Comparison Table */}
          <div className={styles.changesHeaderTitle}>
            <h4>{t('admin.proposalDeltaTitle', 'Önerilen Alan Değişiklikleri (Delta Diff)')}</h4>
          </div>

          <div className={styles.proposalChangesTable}>
            <div className={styles.changesHeader}>
              <span>{t('admin.proposalColField', 'Alan (Field)')}</span>
              <span>{t('admin.proposalColCurrent', 'Mevcut Değer')}</span>
              <span>{t('admin.proposalColProposed', 'Önerilen Yeni Değer')}</span>
            </div>
            {proposal.changes &&
              Object.keys(proposal.changes).map((field) => {
                const item = proposal.changes[field];
                const oldStr =
                  typeof item.old === 'object'
                    ? JSON.stringify(item.old, null, 2)
                    : String(item.old ?? '-');
                const newStr =
                  typeof item.new === 'object'
                    ? JSON.stringify(item.new, null, 2)
                    : String(item.new ?? '-');

                return (
                  <div key={field} className={styles.changeRow}>
                    <div className={styles.changeFieldCol}>
                      <code>{field}</code>
                    </div>
                    <div className={`${styles.changeValCol} ${styles.oldVal}`}>
                      <span>{oldStr}</span>
                    </div>
                    <div className={`${styles.changeValCol} ${styles.newVal}`}>
                      <span>{newStr}</span>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Review Decision Notes & Presets */}
          {proposal.status === 'pending' && (
            <div className={styles.reviewDecisionBox}>
              <div className={styles.presetRow}>
                <span className={styles.presetLabel}>{t('admin.proposalQuickReasons', 'Hızlı Gerekçeler:')}</span>
                <div className={styles.presetChips}>
                  {rejectionPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={styles.presetChip}
                      onClick={() => handleSelectPreset(preset)}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.noteInputArea}>
                <label htmlFor="reviewNotes">{t('admin.proposalReviewNoteLabel', 'İnceleme Notu / Karar Açıklaması:')}</label>
                <textarea
                  id="reviewNotes"
                  className={styles.reviewTextarea}
                  rows={3}
                  maxLength={500}
                  placeholder={t('admin.proposalReviewNotePlaceholder', 'Kullanıcıya iletilecek karar notu giriniz...')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <div className={styles.charCount}>{notes.length} / 500</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isLoading}
          >
            {t('admin.close', 'Kapat')}
          </button>

          {proposal.status === 'pending' && (
            <div className={styles.decisionActions}>
              <button
                type="button"
                className={styles.rejectBtn}
                disabled={isLoading}
                onClick={() => onResolve(proposal.id, 'rejected', notes)}
              >
                {isLoading ? (
                  <Loader2 size={15} className={styles.spinIcon} />
                ) : (
                  <XCircle size={15} />
                )}
                <span>{t('admin.reject', 'Reddet')}</span>
              </button>

              <button
                type="button"
                className={styles.acceptBtn}
                disabled={isLoading}
                onClick={() => onResolve(proposal.id, 'accepted', notes)}
              >
                {isLoading ? (
                  <Loader2 size={15} className={styles.spinIcon} />
                ) : (
                  <CheckCircle2 size={15} />
                )}
                <span>{t('admin.proposalAcceptApply', 'Onayla & Uygula')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
