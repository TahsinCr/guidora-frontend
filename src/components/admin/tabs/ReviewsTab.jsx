import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Star,
  Search,
  Trash2,
  ExternalLink,
  User,
  Clock,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { deleteReview } from '@/services/toolsService';
import { adminAddLog } from '@/services/adminService';
import toastService from '@/services/toast/toastService';
import AdminConfirmModal from '../modals/AdminConfirmModal';
import styles from '../AdminDashboardPage.module.scss';

const RATING_CHIPS = [
  { id: 'all', label: 'Tüm Mesajlar' },
  { id: 'replies', label: 'Alt Yanıtlar (@Reply)' },
  { id: '5', label: '★★★★★ (5 Yıldız)' },
  { id: '4', label: '★★★★☆ (4 Yıldız)' },
  { id: '3', label: '★★★☆☆ (3 Yıldız)' },
  { id: '2', label: '★★☆☆☆ (2 Yıldız)' },
  { id: '1', label: '★☆☆☆☆ (1 Yıldız)' },
];

export default function ReviewsTab({
  reviews = [],
  tools = [],
  globalSearch = '',
  onRefreshReviews,
  onOpenTool,
}) {
  const safeReviews = Array.isArray(reviews) ? reviews : [];
  const [search, setSearch] = useState('');
  const [activeChip, setActiveChip] = useState('all');

  // Normalized review field accessors
  const getAuthor = (r) => r.author || r.userName || r.name || 'Kullanıcı';
  const getContent = (r) => r.content || r.text || r.comment || '';
  const getDate = (r) => r.date || (r.createdAt ? new Date(r.createdAt).toLocaleDateString('tr-TR') : 'Yeni');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // In-App Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
    confirmText: 'Sil',
    onConfirm: () => {},
  });

  const filteredReviews = useMemo(() => {
    return safeReviews.filter((r) => {
      if (activeChip === 'replies') {
        if (!r.parentId) return false;
      } else if (activeChip !== 'all') {
        if (r.parentId || Number(r.rating) !== parseInt(activeChip, 10)) {
          return false;
        }
      }
      const q = (search || globalSearch || '').trim().toLowerCase();
      if (q) {
        const textMatch = getContent(r).toLowerCase().includes(q);
        const userMatch = getAuthor(r).toLowerCase().includes(q);
        const toolMatch = (r.toolName || r.toolId || '').toLowerCase().includes(q);
        if (!textMatch && !userMatch && !toolMatch) return false;
      }
      return true;
    });
  }, [safeReviews, activeChip, search, globalSearch]);

  // Paginated reviews
  const paginatedReviews = useMemo(() => {
    if (pageSize === 'all') return filteredReviews;
    const start = (currentPage - 1) * pageSize;
    return filteredReviews.slice(start, start + pageSize);
  }, [filteredReviews, currentPage, pageSize]);

  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(filteredReviews.length / pageSize));

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDeleteReview = (rev) => {
    const authorDisplay = getAuthor(rev);
    setConfirmModal({
      isOpen: true,
      title: rev.parentId ? 'Alt Yanıtı Sil' : 'Yorumu Sil',
      message: `"${authorDisplay}" tarafından yazılan ${rev.parentId ? 'alt yanıtı' : 'değerlendirmeyi'} silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      variant: 'danger',
      confirmText: 'Sil',
      onConfirm: async () => {
        try {
          await deleteReview(rev.toolId, rev.id);
          adminAddLog('REVIEW_DELETED', `${rev.toolName || rev.toolId} (${authorDisplay})`, 'warning', {
            category: 'GOVERNANCE',
          });
          toastService.success('Mesaj başarıyla silindi.');
          if (onRefreshReviews) onRefreshReviews();
        } catch (err) {
          toastService.error('Mesaj silme hatası: ' + err.message);
        }
      },
    });
  };

  const handleExportCSV = () => {
    if (filteredReviews.length === 0) {
      toastService.warning('Dışa aktarılacak değerlendirme bulunmuyor.');
      return;
    }
    const headers = ['ID', 'Tür', 'Kullanıcı', 'Araç ID', 'Araç Adı', 'Puan', 'Yorum', 'Tarih'];
    const rows = filteredReviews.map((r) => [
      `"${r.id || ''}"`,
      `"${r.parentId ? 'Alt Yanıt' : 'Ana Yorum'}"`,
      `"${getAuthor(r).replace(/"/g, '""')}"`,
      `"${r.toolId || ''}"`,
      `"${(r.toolName || '').replace(/"/g, '""')}"`,
      r.parentId ? 'Yanıt' : (r.rating || 5),
      `"${getContent(r).replace(/"/g, '""')}"`,
      `"${getDate(r)}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `guidora_reviews_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toastService.success(`${filteredReviews.length} değerlendirme CSV olarak indirildi.`);
  };

  return (
    <div className={styles.tabContent}>
      {/* Quick Filter Chips */}
      <div className={styles.quickFilterChips}>
        {RATING_CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            className={`${styles.filterChip} ${activeChip === chip.id ? styles.filterChipActive : ''}`}
            onClick={() => {
              setActiveChip(chip.id);
              setCurrentPage(1);
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarFilters}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Yorum içeriği, @kullanıcı veya araç adı ara..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className={styles.toolbarActions}>
          <button
            type="button"
            className={styles.actionBtnSecondary}
            onClick={handleExportCSV}
            title="CSV Dışa Aktar"
          >
            <Download size={14} />
            <span>CSV Dışa Aktar</span>
          </button>

          <div className={styles.toolbarInfo}>
            <span>{filteredReviews.length} mesaj listeleniyor</span>
          </div>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className={styles.reviewsGrid}>
        {filteredReviews.length === 0 ? (
          <div className={styles.emptyStateCard}>
            <MessageSquare size={36} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>Değerlendirme Bulunamadı</h3>
            <p className={styles.emptyDesc}>Kriterlere uyan kullanıcı yorumu veya alt yanıt bulunmuyor.</p>
          </div>
        ) : (
          paginatedReviews.map((rev) => (
            <div key={rev.id} className={styles.reviewCard}>
              <div className={styles.reviewCardHeader}>
                <div className={styles.reviewUserBlock}>
                  <div className={styles.reviewAvatar}>
                    <User size={14} />
                  </div>
                  <div>
                    <h4 className={styles.reviewUserName}>
                      {getAuthor(rev)}
                      {rev.username && (
                        <span style={{ marginLeft: '6px', fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 500 }}>
                          @{rev.username}
                        </span>
                      )}
                    </h4>
                    <span className={styles.reviewTargetTool}>
                      Araç: <strong>{rev.toolName || rev.toolId}</strong>
                      {rev.toolId && (
                        <button
                          type="button"
                          className={styles.toolLinkBtn}
                          onClick={() => {
                            if (typeof window !== 'undefined') {
                              window.open(`/?tool=${encodeURIComponent(rev.toolId)}`, '_blank');
                            } else if (onOpenTool) {
                              onOpenTool(rev.toolId);
                            }
                          }}
                          title="Aracı Yeni Sekmede Görüntüle"
                        >
                          <ExternalLink size={11} />
                        </button>
                      )}
                    </span>
                  </div>
                </div>

                {rev.parentId ? (
                  <span
                    style={{
                      padding: '3px 9px',
                      borderRadius: '6px',
                      background: 'rgba(139, 92, 246, 0.14)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      color: 'var(--accent-purple)',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    Alt Yanıt {rev.replyTo ? `→ @${rev.replyTo}` : ''}
                  </span>
                ) : (
                  <div className={styles.reviewRatingStars}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={13}
                        fill={s <= (rev.rating || 5) ? '#fbbf24' : 'none'}
                        color={s <= (rev.rating || 5) ? '#fbbf24' : 'var(--text-muted)'}
                      />
                    ))}
                  </div>
                )}
              </div>

              <p className={styles.reviewCardText}>
                "{getContent(rev) || 'Metin yok'}"
              </p>

              <div className={styles.reviewCardFooter}>
                <span className={styles.reviewDate}>
                  <Clock size={11} />
                  {getDate(rev)}
                </span>

                <button
                  type="button"
                  className={styles.reviewDeleteBtn}
                  onClick={() => handleDeleteReview(rev)}
                  title="Yorumu Sil"
                >
                  <Trash2 size={13} />
                  <span>Sil</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Bar */}
      {filteredReviews.length > 0 && (
        <div className={styles.paginationBar}>
          <div className={styles.paginationInfo}>
            <span>
              Toplam <strong>{filteredReviews.length}</strong> yorumdan <strong>{pageSize === 'all' ? filteredReviews.length : Math.min((currentPage - 1) * pageSize + 1, filteredReviews.length)}</strong> - <strong>{pageSize === 'all' ? filteredReviews.length : Math.min(currentPage * pageSize, filteredReviews.length)}</strong> arası gösteriliyor
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

      {/* In-App Confirmation Modal */}
      <AdminConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
