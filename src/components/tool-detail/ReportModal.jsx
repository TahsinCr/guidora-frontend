import React, { useState, useEffect } from 'react';
import { Flag, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { submitReport } from '@/services/toolsService';
import styles from './ReportModal.module.scss';

const REPORT_REASONS = [
  { id: 'broken_link', label: 'Broken link or service is down' },
  { id: 'outdated_info', label: 'Inaccurate or outdated information' },
  { id: 'spam_malicious', label: 'Misleading, spam, or malicious content' },
  { id: 'copyright', label: 'Copyright or trademark infringement' },
  { id: 'other', label: 'Other issue or feedback' },
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
            <div className={styles.successIcon}>
              <CheckCircle2 size={36} color="#10B981" />
            </div>
            <h3 className={styles.successTitle}>Report Received</h3>
            <p className={styles.successMessage}>
              Thank you for helping keep Guidora reliable and accurate. Our moderation team has been notified and will inspect <strong>{tool.name}</strong> shortly.
            </p>
            <button className={styles.doneBtn} onClick={handleClose}>
              Close Window
            </button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.modalHeader}>
              <div className={styles.headerIconWrapper}>
                <Flag size={18} />
              </div>
              <div className={styles.headerTexts}>
                <h3 className={styles.modalTitle}>Report Tool</h3>
                <span className={styles.modalSubtitle}>Reporting: {tool.name}</span>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>What seems to be the problem?</label>
              <div className={styles.radioList}>
                {REPORT_REASONS.map((r) => (
                  <label key={r.id} className={styles.radioItem}>
                    <input
                      type="radio"
                      name="reportReason"
                      value={r.id}
                      checked={reason === r.id}
                      onChange={() => setReason(r.id)}
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Additional Context</label>
              <textarea
                className={styles.textArea}
                rows={3}
                placeholder="Describe the issue or provide proof/links (optional)..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Your Email (Optional)</label>
              <input
                type="email"
                className={styles.textInput}
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className={styles.formFooter}>
              <button type="button" className={styles.cancelBtn} onClick={handleClose}>
                Cancel
              </button>
              <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

