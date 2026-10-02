import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Search,
  ExternalLink,
  MessageSquare,
  Shield,
} from 'lucide-react';
import {
  adminGetReports,
  adminResolveReport,
  adminDismissReport,
  adminAddLog,
} from '@/services/adminService';
import { useLanguage } from '@/context/LanguageContext';
import styles from '../AdminDashboardPage.module.scss';

export default function ReportsTab({
  reports = [],
  onRefreshReports,
  onOpenTool,
}) {
  const { t, language } = useLanguage();
  const [filter, setFilter] = useState('pending'); // 'pending' | 'resolved' | 'all'
  const [search, setSearch] = useState('');
  const [actionNotes, setActionNotes] = useState({});

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const isResolved = r.status === 'resolved' || r.status === 'dismissed';
      if (filter === 'pending' && isResolved) return false;
      if (filter === 'resolved' && !isResolved) return false;

      if (search) {
        const q = search.toLowerCase();
        const reasonMatch = (r.reason || '').toLowerCase().includes(q);
        const detailsMatch = (r.details || '').toLowerCase().includes(q);
        const toolMatch = (r.toolName || r.toolId || '').toLowerCase().includes(q);
        if (!reasonMatch && !detailsMatch && !toolMatch) return false;
      }
      return true;
    });
  }, [reports, filter, search]);

  const handleResolve = (reportId, toolName) => {
    const note = actionNotes[reportId] || 'İncelendi ve çözüldü.';
    adminResolveReport(reportId, note);
    adminAddLog('REPORT_RESOLVED', toolName || reportId, 'info', {
      category: 'GOVERNANCE',
      newValues: { actionTaken: note },
    });
    if (onRefreshReports) onRefreshReports();
  };

  const handleDismiss = (reportId, toolName) => {
    adminDismissReport(reportId);
    adminAddLog('REPORT_DISMISSED', toolName || reportId, 'info', {
      category: 'GOVERNANCE',
    });
    if (onRefreshReports) onRefreshReports();
  };

  return (
    <div className={styles.tabContent}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.filterTabs}>
          <button
            type="button"
            className={`${styles.filterTabBtn} ${filter === 'pending' ? styles.active : ''}`}
            onClick={() => setFilter('pending')}
          >
            {t('admin.statusPending')} ({reports.filter((r) => !r.status || r.status === 'pending').length})
          </button>
          <button
            type="button"
            className={`${styles.filterTabBtn} ${filter === 'resolved' ? styles.active : ''}`}
            onClick={() => setFilter('resolved')}
          >
            {t('admin.statusResolved')} ({reports.filter((r) => r.status === 'resolved' || r.status === 'dismissed').length})
          </button>
          <button
            type="button"
            className={`${styles.filterTabBtn} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            {t('admin.chipAll')} ({reports.length})
          </button>
        </div>

        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder={t('admin.searchReports')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Reports List */}
      <div className={styles.reportsList}>
        {filteredReports.length === 0 ? (
          <div className={styles.emptyStateCard}>
            <CheckCircle2 size={36} color="#10b981" className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>{t('admin.reportsEmpty')}</h3>
            <p className={styles.emptyDesc}>{t('admin.reportsEmptyDesc', '0 pending user reports in the moderation queue.')}</p>
          </div>
        ) : (
          filteredReports.map((rep) => (
            <div key={rep.id} className={styles.reportCard}>
              <div className={styles.reportHeader}>
                <div className={styles.reportHeaderLeft}>
                  <div className={styles.reportBadges}>
                    <span className={`${styles.reasonBadge} ${styles[rep.reason] || styles.general}`}>
                      {rep.reason || 'General'}
                    </span>
                    <span className={`${styles.statusBadge} ${styles[rep.status || 'pending']}`}>
                      {rep.status === 'resolved' ? t('admin.statusResolved') : rep.status === 'dismissed' ? t('admin.statusDismissed') : t('admin.statusPending')}
                    </span>
                  </div>
                  <h4 className={styles.reportedToolTitle}>
                    {t('admin.colTool')}: <strong>{rep.toolName || rep.toolId || 'Unknown'}</strong>
                    {rep.toolId && onOpenTool && (
                      <button
                        type="button"
                        className={styles.toolLinkBtn}
                        onClick={() => onOpenTool(rep.toolId)}
                        title={rep.toolName}
                      >
                        <ExternalLink size={12} />
                      </button>
                    )}
                  </h4>
                </div>

                <div className={styles.reportHeaderRight}>
                  <span className={styles.reportDate}>
                    <Clock size={12} />
                    {rep.createdAt ? new Date(rep.createdAt).toLocaleString(language === 'en' ? 'en-US' : language === 'ru' ? 'ru-RU' : 'tr-TR') : 'Recent'}
                  </span>
                </div>
              </div>

              <div className={styles.reportContent}>
                <p className={styles.reportDetailsText}>
                  "{rep.details || '-'}"
                </p>
                {rep.email && (
                  <span className={styles.reporterEmail}>
                    {rep.email}
                  </span>
                )}
              </div>

              {/* Action Area */}
              {(!rep.status || rep.status === 'pending') ? (
                <div className={styles.reportActionRow}>
                  <input
                    type="text"
                    className={styles.actionNoteInput}
                    placeholder={t('admin.reviewNotes')}
                    value={actionNotes[rep.id] || ''}
                    onChange={(e) =>
                      setActionNotes((prev) => ({ ...prev, [rep.id]: e.target.value }))
                    }
                  />

                  <div className={styles.actionBtnGroup}>
                    <button
                      type="button"
                      className={styles.dismissBtn}
                      onClick={() => handleDismiss(rep.id, rep.toolName)}
                    >
                      {t('admin.dismissReport')}
                    </button>
                    <button
                      type="button"
                      className={styles.resolveBtn}
                      onClick={() => handleResolve(rep.id, rep.toolName)}
                    >
                      <CheckCircle2 size={14} />
                      <span>{t('admin.resolveReport')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.resolvedNoteBlock}>
                  <span>{t('admin.statusResolved')}: <strong>{rep.actionTaken || 'Reviewed'}</strong></span>
                  {rep.resolvedAt && (
                    <span className={styles.resolvedTime}>
                      ({new Date(rep.resolvedAt).toLocaleString(language === 'en' ? 'en-US' : language === 'ru' ? 'ru-RU' : 'tr-TR')})
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
