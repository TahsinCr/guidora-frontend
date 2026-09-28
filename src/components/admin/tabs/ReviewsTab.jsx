import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Star,
  Search,
  Trash2,
  ExternalLink,
  User,
  Clock,
  ThumbsUp,
} from 'lucide-react';
import { deleteReview } from '@/services/toolsService';
import { adminAddLog } from '@/services/adminService';
import styles from '../AdminDashboardPage.module.scss';

export default function ReviewsTab({
  reviews = [],
  tools = [],
  onRefreshReviews,
  onOpenTool,
}) {
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (ratingFilter !== 'all' && r.rating !== parseInt(ratingFilter, 10)) {
        return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const textMatch = (r.text || r.comment || '').toLowerCase().includes(q);
        const userMatch = (r.userName || r.author || '').toLowerCase().includes(q);
        const toolMatch = (r.toolName || r.toolId || '').toLowerCase().includes(q);
        if (!textMatch && !userMatch && !toolMatch) return false;
      }
      return true;
    });
  }, [reviews, ratingFilter, search]);

  const handleDeleteReview = (rev) => {
    if (window.confirm(`"${rev.userName}" kullanıcısının yorumunu silmek istediğinize emin misiniz?`)) {
      try {
        deleteReview(rev.toolId, rev.id);
        adminAddLog('REVIEW_DELETED', `${rev.toolName || rev.toolId} (${rev.userName})`, 'warning', {
          category: 'GOVERNANCE',
        });
        if (onRefreshReviews) onRefreshReviews();
      } catch (err) {
        alert('Yorum silme hatası: ' + err.message);
      }
    }
  };

  return (
    <div className={styles.tabContent}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarFilters}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Yorum içeriği, kullanıcı veya araç adı ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.selectWrapper}>
            <select
              className={styles.adminSelect}
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              aria-label="Puana Göre Filtrele"
            >
              <option value="all">Tüm Puanlar</option>
              <option value="5">★★★★★ 5 Yıldız</option>
              <option value="4">★★★★☆ 4 Yıldız</option>
              <option value="3">★★★☆☆ 3 Yıldız</option>
              <option value="2">★★☆☆☆ 2 Yıldız</option>
              <option value="1">★☆☆☆☆ 1 Yıldız</option>
            </select>
          </div>
        </div>

        <div className={styles.toolbarInfo}>
          <span>{filteredReviews.length} değerlendirme listeleniyor</span>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className={styles.reviewsGrid}>
        {filteredReviews.length === 0 ? (
          <div className={styles.emptyStateCard}>
            <MessageSquare size={36} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>Değerlendirme Bulunamadı</h3>
            <p className={styles.emptyDesc}>Kriterlere uyan kullanıcı yorumu veya değerlendirmesi bulunmuyor.</p>
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div key={rev.id} className={styles.reviewCard}>
              <div className={styles.reviewCardHeader}>
                <div className={styles.reviewUserBlock}>
                  <div className={styles.reviewAvatar}>
                    <User size={14} />
                  </div>
                  <div>
                    <h4 className={styles.reviewUserName}>{rev.userName || 'Kullanıcı'}</h4>
                    <span className={styles.reviewTargetTool}>
                      Araç: <strong>{rev.toolName || rev.toolId}</strong>
                      {rev.toolId && onOpenTool && (
                        <button
                          type="button"
                          className={styles.toolLinkBtn}
                          onClick={() => onOpenTool(rev.toolId)}
                          title="Araca Git"
                        >
                          <ExternalLink size={11} />
                        </button>
                      )}
                    </span>
                  </div>
                </div>

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
              </div>

              <p className={styles.reviewCardText}>
                "{rev.text || rev.comment || 'Metin yok'}"
              </p>

              <div className={styles.reviewCardFooter}>
                <span className={styles.reviewDate}>
                  <Clock size={11} />
                  {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('tr-TR') : 'Yeni'}
                </span>

                <button
                  type="button"
                  className={styles.actionIconBtnDanger}
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
    </div>
  );
}
