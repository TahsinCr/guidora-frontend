import React, { useState, useMemo } from 'react';
import {
  GitPullRequest,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ExternalLink,
  Search,
  Check,
  X,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { adminGetProposals, adminResolveProposal } from '@/services/adminService';
import styles from '../AdminDashboardPage.module.scss';

export default function ProposalsTab({
  proposals = [],
  onRefreshProposals,
  onOpenTool,
}) {
  const [filterStatus, setFilterStatus] = useState('pending'); // 'pending' | 'accepted' | 'rejected' | 'all'
  const [search, setSearch] = useState('');
  const [reviewNotes, setReviewNotes] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [feedback, setFeedback] = useState(null);

  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      if (filterStatus !== 'all' && p.status !== filterStatus) {
        return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const toolMatch = (p.toolName || '').toLowerCase().includes(q);
        const proposerMatch = (p.proposer || '').toLowerCase().includes(q);
        const summaryMatch = (p.summary || '').toLowerCase().includes(q);
        if (!toolMatch && !proposerMatch && !summaryMatch) return false;
      }
      return true;
    });
  }, [proposals, filterStatus, search]);

  const handleResolve = (proposalId, status) => {
    const notes = reviewNotes[proposalId] || '';
    setActionLoading((prev) => ({ ...prev, [proposalId]: true }));

    setTimeout(() => {
      try {
        adminResolveProposal(proposalId, status, notes);
        setFeedback({
          type: status === 'accepted' ? 'success' : 'warning',
          message: status === 'accepted'
            ? `Teklif onaylandı ve değişiklikler kataloğa uygulandı.`
            : `Teklif reddedildi.`,
        });
        if (onRefreshProposals) onRefreshProposals();
        setTimeout(() => setFeedback(null), 4000);
      } catch (err) {
        alert('Teklif işlemi hatası: ' + err.message);
      } finally {
        setActionLoading((prev) => ({ ...prev, [proposalId]: false }));
      }
    }, 200);
  };

  return (
    <div className={styles.tabContent}>
      {/* Feedback Banner */}
      {feedback && (
        <div className={feedback.type === 'success' ? styles.alertSuccess : styles.alertWarning}>
          <CheckCircle2 size={16} />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header & Sub-Tabs Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.filterTabs}>
          <button
            type="button"
            className={`${styles.filterTabBtn} ${filterStatus === 'pending' ? styles.active : ''}`}
            onClick={() => setFilterStatus('pending')}
          >
            Bekleyenler ({proposals.filter((p) => p.status === 'pending').length})
          </button>
          <button
            type="button"
            className={`${styles.filterTabBtn} ${filterStatus === 'accepted' ? styles.active : ''}`}
            onClick={() => setFilterStatus('accepted')}
          >
            Onaylananlar ({proposals.filter((p) => p.status === 'accepted').length})
          </button>
          <button
            type="button"
            className={`${styles.filterTabBtn} ${filterStatus === 'rejected' ? styles.active : ''}`}
            onClick={() => setFilterStatus('rejected')}
          >
            Reddedilenler ({proposals.filter((p) => p.status === 'rejected').length})
          </button>
          <button
            type="button"
            className={`${styles.filterTabBtn} ${filterStatus === 'all' ? styles.active : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            Tümü ({proposals.length})
          </button>
        </div>

        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Araç veya teklif sahibi ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Proposals List */}
      <div className={styles.proposalsList}>
        {filteredProposals.length === 0 ? (
          <div className={styles.emptyStateCard}>
            <GitPullRequest size={36} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>Teklif Bulunamadı</h3>
            <p className={styles.emptyDesc}>Bu kategoride incelenecek düzenleme teklifi bulunmamaktadır.</p>
          </div>
        ) : (
          filteredProposals.map((prop) => (
            <div key={prop.id} className={styles.proposalCard}>
              {/* Proposal Header */}
              <div className={styles.proposalCardHeader}>
                <div className={styles.propHeaderLeft}>
                  <div className={styles.propBadgeRow}>
                    <span className={`${styles.statusBadge} ${styles[prop.status]}`}>
                      {prop.status === 'pending' ? 'Bekliyor' : prop.status === 'accepted' ? 'Onaylandı' : 'Reddedildi'}
                    </span>
                    <span className={styles.propIdTag}>ID: {prop.id}</span>
                  </div>
                  <h3 className={styles.proposalToolName}>
                    {prop.toolName}
                    {onOpenTool && prop.toolId && (
                      <button
                        type="button"
                        className={styles.toolLinkBtn}
                        onClick={() => onOpenTool(prop.toolId)}
                        title="Aracı Görüntüle"
                      >
                        <ExternalLink size={13} />
                      </button>
                    )}
                  </h3>
                  <p className={styles.proposalSummaryText}>{prop.summary}</p>
                </div>

                <div className={styles.propHeaderRight}>
                  <div className={styles.proposerMeta}>
                    <User size={13} />
                    <span>Öneren: <strong>{prop.proposer}</strong></span>
                    {prop.proposerRole && <span className={styles.roleTagSmall}>({prop.proposerRole})</span>}
                  </div>
                  <div className={styles.propTimestamp}>
                    <Clock size={12} />
                    <span>{new Date(prop.submittedAt).toLocaleString('tr-TR')}</span>
                  </div>
                </div>
              </div>

              {/* Proposal Delta Changes Table */}
              <div className={styles.proposalChangesTable}>
                <div className={styles.changesHeader}>
                  <span>Alan (Field)</span>
                  <span>Mevcut Değer</span>
                  <span>Önerilen Yeni Değer</span>
                </div>
                {prop.changes &&
                  Object.keys(prop.changes).map((field) => {
                    const item = prop.changes[field];
                    const oldStr = typeof item.old === 'object' ? JSON.stringify(item.old) : String(item.old ?? '-');
                    const newStr = typeof item.new === 'object' ? JSON.stringify(item.new) : String(item.new ?? '-');

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

              {/* Review Section */}
              {prop.status === 'pending' ? (
                <div className={styles.proposalActionRow}>
                  <div className={styles.reviewNoteInputWrapper}>
                    <input
                      type="text"
                      className={styles.reviewNoteInput}
                      placeholder="İnceleme notu ekleyin (isteğe bağlı)..."
                      value={reviewNotes[prop.id] || ''}
                      onChange={(e) =>
                        setReviewNotes((prev) => ({ ...prev, [prop.id]: e.target.value }))
                      }
                    />
                  </div>

                  <div className={styles.actionBtnGroup}>
                    <button
                      type="button"
                      className={styles.rejectBtn}
                      disabled={actionLoading[prop.id]}
                      onClick={() => handleResolve(prop.id, 'rejected')}
                    >
                      <X size={15} />
                      <span>Reddet</span>
                    </button>

                    <button
                      type="button"
                      className={styles.acceptBtn}
                      disabled={actionLoading[prop.id]}
                      onClick={() => handleResolve(prop.id, 'accepted')}
                    >
                      <Check size={15} />
                      <span>{actionLoading[prop.id] ? 'Uygulanıyor...' : 'Onayla & Uygula'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.resolvedInfoRow}>
                  <span className={styles.resolvedBy}>
                    İnceleyen: <strong>{prop.reviewedBy || 'Admin'}</strong>
                  </span>
                  {prop.reviewNotes && (
                    <span className={styles.resolvedNotes}>
                      Not: "{prop.reviewNotes}"
                    </span>
                  )}
                  {prop.reviewedAt && (
                    <span className={styles.resolvedTime}>
                      ({new Date(prop.reviewedAt).toLocaleString('tr-TR')})
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
