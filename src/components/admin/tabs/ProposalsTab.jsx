import React, { useState, useMemo } from 'react';
import {
  GitPullRequest,
  Clock,
  User,
  ExternalLink,
  Search,
  Check,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  Download,
  ShieldCheck,
  Users,
  Fingerprint,
} from 'lucide-react';
import {
  adminResolveProposal,
  adminResolveCommunityReview,
  adminAddLog,
} from '@/services/adminService';
import toastService from '@/services/toast/toastService';
import ProposalReviewModal from '../modals/ProposalReviewModal';
import styles from '../AdminDashboardPage.module.scss';

const STATUS_CHIPS = [
  { id: 'pending', label: 'Bekleyenler' },
  { id: 'accepted', label: 'Onaylananlar' },
  { id: 'rejected', label: 'Reddedilenler' },
  { id: 'all', label: 'Tüm Teklifler' },
];

export default function ProposalsTab({
  proposals = [],
  communityReviews = [],
  globalSearch = '',
  onRefreshProposals,
  onOpenTool,
}) {
  const safeProposals = Array.isArray(proposals) ? proposals : [];
  const safeCommunityReviews = Array.isArray(communityReviews) ? communityReviews : [];

  const [activeSubTab, setActiveSubTab] = useState('proposals'); // 'proposals' | 'community'
  const [filterStatus, setFilterStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [reviewNotes, setReviewNotes] = useState({});
  const [communityNotes, setCommunityNotes] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [selectedProposal, setSelectedProposal] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredProposals = useMemo(() => {
    return safeProposals.filter((p) => {
      if (filterStatus !== 'all' && p.status !== filterStatus) {
        return false;
      }
      const q = (search || globalSearch || '').trim().toLowerCase();
      if (q) {
        const toolMatch = (p.toolName || '').toLowerCase().includes(q);
        const proposerMatch = (p.proposer || '').toLowerCase().includes(q);
        const summaryMatch = (p.summary || '').toLowerCase().includes(q);
        if (!toolMatch && !proposerMatch && !summaryMatch) return false;
      }
      return true;
    });
  }, [safeProposals, filterStatus, search, globalSearch]);

  const filteredCommunityReviews = useMemo(() => {
    return safeCommunityReviews.filter((cr) => {
      if (filterStatus !== 'all') {
        const mappedStatus = cr.status === 'approved' ? 'accepted' : (cr.status || 'pending');
        if (mappedStatus !== filterStatus) return false;
      }
      const q = (search || globalSearch || '').trim().toLowerCase();
      if (q) {
        const nameMatch = (cr.toolName || '').toLowerCase().includes(q);
        const sumMatch = (cr.summary || '').toLowerCase().includes(q);
        if (!nameMatch && !sumMatch) return false;
      }
      return true;
    });
  }, [safeCommunityReviews, filterStatus, search, globalSearch]);

  // Paginated proposals
  const paginatedProposals = useMemo(() => {
    if (pageSize === 'all') return filteredProposals;
    const start = (currentPage - 1) * pageSize;
    return filteredProposals.slice(start, start + pageSize);
  }, [filteredProposals, currentPage, pageSize]);

  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(filteredProposals.length / pageSize));

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleResolve = (proposalId, status, explicitNotes) => {
    const notes = explicitNotes !== undefined ? explicitNotes : (reviewNotes[proposalId] || '');
    setActionLoading((prev) => ({ ...prev, [proposalId]: true }));

    setTimeout(() => {
      try {
        adminResolveProposal(proposalId, status, notes);
        if (status === 'accepted') {
          toastService.success('Teklif onaylandı ve değişiklikler kataloğa uygulandı.');
        } else {
          toastService.warning('Teklif reddedildi.');
        }
        if (onRefreshProposals) onRefreshProposals();
        if (selectedProposal?.id === proposalId) {
          setSelectedProposal(null);
        }
      } catch (err) {
        toastService.error('Teklif işlemi hatası: ' + err.message);
      } finally {
        setActionLoading((prev) => ({ ...prev, [proposalId]: false }));
      }
    }, 180);
  };

  const handleResolveCommunity = async (reviewItem, decision) => {
    const note = communityNotes[reviewItem.id] || '';
    setActionLoading((prev) => ({ ...prev, [reviewItem.id]: true }));
    try {
      await adminResolveCommunityReview(reviewItem, decision, note);
      adminAddLog(
        decision === 'approved' ? 'COMMUNITY_VERIFICATION_APPROVED' : 'COMMUNITY_VERIFICATION_REJECTED',
        reviewItem.toolName,
        decision === 'approved' ? 'success' : 'warning',
        { entityName: 'CommunityVerificationReview', entityId: reviewItem.id, category: 'GOVERNANCE' }
      );
      if (decision === 'approved') {
        toastService.success(`"${reviewItem.toolName}" topluluk doğrulaması onaylandı.`);
      } else {
        toastService.warning(`"${reviewItem.toolName}" topluluk doğrulaması reddedildi.`);
      }
      if (onRefreshProposals) onRefreshProposals();
    } catch (err) {
      toastService.error('İşlem hatası: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setActionLoading((prev) => ({ ...prev, [reviewItem.id]: false }));
    }
  };

  const handleExportCSV = () => {
    if (filteredProposals.length === 0) {
      toastService.warning('Dışa aktarılacak teklif bulunmuyor.');
      return;
    }
    const headers = ['ID', 'Durum', 'Araç ID', 'Araç Adı', 'Öneren', 'Özet', 'Tarih'];
    const rows = filteredProposals.map((p) => [
      `"${p.id || ''}"`,
      `"${p.status || ''}"`,
      `"${p.toolId || ''}"`,
      `"${(p.toolName || '').replace(/"/g, '""')}"`,
      `"${(p.proposer || '').replace(/"/g, '""')}"`,
      `"${(p.summary || '').replace(/"/g, '""')}"`,
      `"${p.submittedAt || ''}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `guidora_proposals_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastService.success(`${filteredProposals.length} teklif CSV olarak indirildi.`);
  };

  const renderDiffValue = (val) => {
    if (Array.isArray(val)) {
      return (
        <div className={styles.diffChipList}>
          {val.map((tag, idx) => (
            <span key={idx} className={styles.diffChipItem}>
              {String(tag)}
            </span>
          ))}
        </div>
      );
    }
    if (val && typeof val === 'object') {
      return <code>{JSON.stringify(val)}</code>;
    }
    return <span>{String(val ?? '-')}</span>;
  };

  const pendingProposalsCount = safeProposals.filter((p) => p.status === 'pending').length;
  const pendingCommCount = safeCommunityReviews.filter((c) => !c.status || c.status === 'pending').length;

  return (
    <div className={styles.tabContent}>
      {/* Sub-Tab Switcher: Edit Proposals vs Community Verification Queue */}
      <div className={styles.subTabNav}>
        <button
          type="button"
          className={`${styles.subTabBtn} ${activeSubTab === 'proposals' ? styles.subTabBtnActive : ''}`}
          onClick={() => {
            setActiveSubTab('proposals');
            setCurrentPage(1);
          }}
        >
          <GitPullRequest size={15} />
          <span>Düzenleme Teklifleri (Edit Proposals)</span>
          <span className={styles.subTabBadge}>{pendingProposalsCount}</span>
        </button>

        <button
          type="button"
          className={`${styles.subTabBtn} ${activeSubTab === 'community' ? styles.subTabBtnActive : ''}`}
          onClick={() => {
            setActiveSubTab('community');
            setCurrentPage(1);
          }}
        >
          <ShieldCheck size={15} />
          <span>Topluluk Doğrulama Kuyruğu (Community Verification)</span>
          <span className={styles.subTabBadge}>{pendingCommCount}</span>
        </button>
      </div>

      {/* Quick Status Filter Chips */}
      <div className={styles.quickFilterChips}>
        {STATUS_CHIPS.map((chip) => {
          const count =
            activeSubTab === 'proposals'
              ? chip.id === 'all'
                ? safeProposals.length
                : safeProposals.filter((p) => p.status === chip.id).length
              : chip.id === 'all'
              ? safeCommunityReviews.length
              : safeCommunityReviews.filter((c) => {
                  const st = c.status === 'approved' ? 'accepted' : (c.status || 'pending');
                  return st === chip.id;
                }).length;
          return (
            <button
              key={chip.id}
              type="button"
              className={`${styles.filterChip} ${filterStatus === chip.id ? styles.filterChipActive : ''}`}
              onClick={() => {
                setFilterStatus(chip.id);
                setCurrentPage(1);
              }}
            >
              <span>{chip.label}</span>
              <span className={styles.filterChipCount}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarFilters}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder={
                activeSubTab === 'proposals'
                  ? 'Araç veya teklif sahibi ara...'
                  : 'Doğrulama bekleyen araç ara...'
              }
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className={styles.toolbarActions}>
          {activeSubTab === 'proposals' && (
            <button
              type="button"
              className={styles.actionBtnSecondary}
              onClick={handleExportCSV}
              title="CSV Dışa Aktar"
            >
              <Download size={14} />
              <span>CSV Dışa Aktar</span>
            </button>
          )}
          <div className={styles.toolbarInfo}>
            <span>
              {activeSubTab === 'proposals'
                ? `${filteredProposals.length} teklif listeleniyor`
                : `${filteredCommunityReviews.length} doğrulama incelemesi listeleniyor`}
            </span>
          </div>
        </div>
      </div>

      {activeSubTab === 'proposals' ? (
        <>
          {/* Proposals List */}
          <div className={styles.proposalsList}>
            {filteredProposals.length === 0 ? (
              <div className={styles.emptyStateCard}>
                <GitPullRequest size={36} className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>Teklif Bulunamadı</h3>
                <p className={styles.emptyDesc}>Bu kategoride incelenecek düzenleme teklifi bulunmamaktadır.</p>
              </div>
            ) : (
              paginatedProposals.map((prop) => (
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
                        {prop.toolId && (
                          <button
                            type="button"
                            className={styles.toolLinkBtn}
                            onClick={() => {
                              if (typeof window !== 'undefined') {
                                window.open(`/?tool=${encodeURIComponent(prop.toolId)}`, '_blank');
                              } else if (onOpenTool) {
                                onOpenTool(prop.toolId);
                              }
                            }}
                            title="Aracı Yeni Sekmede Görüntüle"
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
                      <button
                        type="button"
                        className={styles.actionBtnSecondary}
                        onClick={() => setSelectedProposal(prop)}
                        title="Detaylı İnceleme & Karar Modalı"
                      >
                        <Eye size={13} />
                        <span>İncele & Karar Ver</span>
                      </button>
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
                        return (
                          <div key={field} className={styles.changeRow}>
                            <div className={styles.changeFieldCol}>
                              <code>{field}</code>
                            </div>
                            <div className={`${styles.changeValCol} ${styles.oldVal}`}>
                              {renderDiffValue(item.old)}
                            </div>
                            <div className={`${styles.changeValCol} ${styles.newVal}`}>
                              {renderDiffValue(item.new)}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Quick Inline Actions */}
                  {prop.status === 'pending' ? (
                    <div className={styles.proposalActionRow}>
                      <div className={styles.reviewNoteInputWrapper}>
                        <input
                          type="text"
                          className={styles.reviewNoteInput}
                          placeholder="Hızlı inceleme notu ekleyin (isteğe bağlı)..."
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

          {/* Pagination Bar */}
          {filteredProposals.length > 0 && (
            <div className={styles.paginationBar}>
              <div className={styles.paginationInfo}>
                <span>
                  Toplam <strong>{filteredProposals.length}</strong> tekliften <strong>{pageSize === 'all' ? filteredProposals.length : Math.min((currentPage - 1) * pageSize + 1, filteredProposals.length)}</strong> - <strong>{pageSize === 'all' ? filteredProposals.length : Math.min(currentPage * pageSize, filteredProposals.length)}</strong> arası gösteriliyor
                </span>

                <div className={styles.pageSizeSelector}>
                  <label>Sayfa Başına:</label>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10);
                      setPageSize(val);
                      setCurrentPage(1);
                    }}
                    className={styles.pageSizeSelect}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value="all">Tümü</option>
                  </select>
                </div>
              </div>

              {pageSize !== 'all' && totalPages > 1 && (
                <div className={styles.paginationNav}>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    aria-label="Önceki Sayfa"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: Math.min(totalPages, 7) }, (_, idx) => {
                    let pageNum = idx + 1;
                    if (totalPages > 7) {
                      if (currentPage <= 4) pageNum = idx + 1;
                      else if (currentPage >= totalPages - 3) pageNum = totalPages - 6 + idx;
                      else pageNum = currentPage - 3 + idx;
                    }
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        className={`${styles.pageBtn} ${currentPage === pageNum ? styles.pageBtnActive : ''}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={currentPage >= totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    aria-label="Sonraki Sayfa"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* Community Verification Review Queue (CommunityVerificationReviewsController) */
        <div className={styles.proposalsList}>
          {filteredCommunityReviews.length === 0 ? (
            <div className={styles.emptyStateCard}>
              <ShieldCheck size={36} className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>Topluluk Doğrulama Kuyruğu Boş</h3>
              <p className={styles.emptyDesc}>
                Bu filtrede bekleyen topluluk doğrulama incelemesi bulunmamaktadır.
              </p>
            </div>
          ) : (
            filteredCommunityReviews.map((cr) => {
              const isPending = !cr.status || cr.status === 'pending';
              const approvalRate = Math.round(
                ((cr.approvalCount || 1) / Math.max(1, (cr.approvalCount || 0) + (cr.rejectionCount || 0))) * 100
              );

              return (
                <div key={cr.id} className={styles.proposalCard}>
                  <div className={styles.proposalCardHeader}>
                    <div className={styles.propHeaderLeft}>
                      <div className={styles.propBadgeRow}>
                        <span
                          className={`${styles.statusBadge} ${
                            isPending ? styles.pending : cr.status === 'approved' ? styles.accepted : styles.rejected
                          }`}
                        >
                          {isPending ? 'Onay Bekliyor' : cr.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                        </span>
                        <span className={styles.propIdTag}>Product ID: #{cr.productId}</span>
                      </div>
                      <h3 className={styles.proposalToolName}>
                        {cr.toolName}
                        {cr.toolId && (
                          <button
                            type="button"
                            className={styles.toolLinkBtn}
                            onClick={() => {
                              if (typeof window !== 'undefined') {
                                window.open(`/?tool=${encodeURIComponent(cr.toolId)}`, '_blank');
                              }
                            }}
                            title="Aracı Yeni Sekmede Görüntüle"
                          >
                            <ExternalLink size={13} />
                          </button>
                        )}
                      </h3>
                      <p className={styles.proposalSummaryText}>{cr.summary}</p>
                    </div>

                    <div className={styles.propHeaderRight}>
                      <div className={styles.proposerMeta}>
                        <Users size={13} />
                        <span>
                          Onay Oyu: <strong style={{ color: '#10b981' }}>{cr.approvalCount}</strong> / Red:{' '}
                          <strong style={{ color: '#f87171' }}>{cr.rejectionCount}</strong> ({approvalRate}%)
                        </span>
                      </div>
                      <div className={styles.propTimestamp}>
                        <Fingerprint size={12} />
                        <span>
                          Tekil IP: {cr.distinctIpCount} | Tekil İstemci: {cr.distinctClientCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isPending ? (
                    <div className={styles.proposalActionRow}>
                      <div className={styles.reviewNoteInputWrapper}>
                        <input
                          type="text"
                          className={styles.reviewNoteInput}
                          placeholder="Topluluk doğrulama karar notu (PUT /api/community-verifications/reviews/{id})..."
                          value={communityNotes[cr.id] || ''}
                          onChange={(e) =>
                            setCommunityNotes((prev) => ({ ...prev, [cr.id]: e.target.value }))
                          }
                        />
                      </div>

                      <div className={styles.actionBtnGroup}>
                        <button
                          type="button"
                          className={styles.rejectBtn}
                          disabled={actionLoading[cr.id]}
                          onClick={() => handleResolveCommunity(cr, 'rejected')}
                        >
                          <X size={15} />
                          <span>Reddet</span>
                        </button>
                        <button
                          type="button"
                          className={styles.acceptBtn}
                          disabled={actionLoading[cr.id]}
                          onClick={() => handleResolveCommunity(cr, 'approved')}
                        >
                          <Check size={15} />
                          <span>Topluluk Onayını Ver</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.resolvedInfoRow}>
                      <span className={styles.resolvedBy}>
                        Karar: <strong>{cr.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}</strong>
                      </span>
                      {cr.reviewNotes && <span className={styles.resolvedNotes}>Not: "{cr.reviewNotes}"</span>}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Proposal Review Modal */}
      {selectedProposal && (
        <ProposalReviewModal
          proposal={selectedProposal}
          isOpen={Boolean(selectedProposal)}
          onClose={() => setSelectedProposal(null)}
          onResolve={handleResolve}
          onOpenTool={onOpenTool}
          isLoading={Boolean(actionLoading[selectedProposal?.id])}
        />
      )}
    </div>
  );
}
