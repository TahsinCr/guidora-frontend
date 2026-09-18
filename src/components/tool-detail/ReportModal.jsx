import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  X,
  CheckCircle2,
  AlertTriangle,
  Link2,
  Clock,
  FileText,
  HelpCircle,
  ExternalLink,
  Send,
} from 'lucide-react';
import { submitReport } from '@/services/toolsService';
import styles from './ReportModal.module.scss';

const REPORT_REASONS = [
  {
    id: 'broken_link',
    icon: Link2,
    title: 'Broken Link / Service Down',
    desc: 'Website or API endpoint is dead or unreachable',
  },
  {
    id: 'outdated_info',
    icon: Clock,
    title: 'Outdated Information',
    desc: 'Pricing, feature set, or version specs are inaccurate',
  },
  {
    id: 'spam_malicious',
    icon: ShieldAlert,
    title: 'Spam or Malicious',
    desc: 'Suspected malware, deceptive copy, or unsafe service',
  },
  {
    id: 'copyright',
    icon: FileText,
    title: 'Copyright Infringement',
    desc: 'Unauthorized use of trademarks, intellectual property, or code',
  },
  {
    id: 'other',
    icon: HelpCircle,
    title: 'Other Concern',
    desc: 'Duplicate listing or general policy issue',
  },
];

export default function ReportModal({ tool, isOpen, onClose }) {
  const [reason, setReason] = useState('broken_link');
  const [details, setDetails] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !tool) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitReport(tool.id, { reason, details, email });
      setIsSuccess(true);
    } catch (err) {
      console.error('Failed to submit report:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setDetails('');
    setEmail('');
    setReason('broken_link');
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={handleClose} aria-label="Close report modal">
          <X size={18} />
        </button>

        {isSuccess ? (
          <div className={styles.successState}>
            <div className={styles.successGlow}>
              <CheckCircle2 size={44} color="#10B981" />
            </div>
            <h3 className={styles.successTitle}>Report Dispatched</h3>
            <p className={styles.successMessage}>
              Thank you for contributing to Guidora’s catalog integrity. Our moderation team has
              been notified and will review <strong>{tool.name}</strong> within 24 hours.
            </p>
            <button className={styles.doneBtn} onClick={handleClose}>
              Return to Tool
            </button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            {/* Header */}
            <div className={styles.modalHeader}>
              <div className={styles.headerIconWrapper}>
                <ShieldAlert size={20} />
              </div>
              <div className={styles.headerTexts}>
                <h3 className={styles.modalTitle}>Report Content or Issue</h3>
                <span className={styles.modalSubtitle}>Help maintain community trust & directory quality</span>
              </div>
            </div>

            {/* Target Tool Card */}
            <div className={styles.targetToolCard}>
              <div className={styles.targetIcon}>
                {tool.name.slice(0, 2).toUpperCase()}
              </div>
              <div className={styles.targetMeta}>
                <span className={styles.targetName}>{tool.name}</span>
                <span className={styles.targetCategory}>{tool.category || 'AI Tool'} • {tool.pricing || 'Free'}</span>
              </div>
              {tool.websiteUrl && (
                <a
                  href={tool.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.targetLink}
                  title="Open tool URL in new tab"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>

            {/* Reason Cards */}
            <div className={styles.inputGroup}>
              <label className={styles.sectionLabel}>Select Reason *</label>
              <div className={styles.reasonGrid}>
                {REPORT_REASONS.map((r) => {
                  const Icon = r.icon;
                  const isSelected = reason === r.id;
                  return (
                    <div
                      key={r.id}
                      className={`${styles.reasonCard} ${isSelected ? styles.selected : ''}`}
                      onClick={() => setReason(r.id)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className={styles.reasonRadio}>
                        <div className={styles.radioInner} />
                      </div>
                      <div className={styles.reasonContent}>
                        <div className={styles.reasonTitleRow}>
                          <Icon size={15} className={styles.reasonIcon} />
                          <span className={styles.reasonTitle}>{r.title}</span>
                        </div>
                        <span className={styles.reasonDesc}>{r.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Additional Details */}
            <div className={styles.inputGroup}>
              <div className={styles.labelWithCount}>
                <label className={styles.sectionLabel}>Additional Context (Optional)</label>
                <span className={styles.charCount}>{details.length}/500</span>
              </div>
              <textarea
                className={styles.textArea}
                rows={3}
                maxLength={500}
                placeholder="Provide specific links, reproduction steps, or details to help our moderation team..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>

            {/* Email Contact */}
            <div className={styles.inputGroup}>
              <label className={styles.sectionLabel}>Your Email (Optional for updates)</label>
              <input
                type="email"
                className={styles.textInput}
                placeholder="developer@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className={styles.formFooter}>
              <button type="button" className={styles.cancelBtn} onClick={handleClose}>
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting}
              >
                <Send size={14} />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Report'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
