import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, CheckCircle2, MessageSquare, Send, Trash2, LogIn, AlertCircle } from 'lucide-react';
import { getReviews, addReview, deleteReview } from '@/services/toolsService';
import { getCurrentUser } from '@/services/userService';
import { useLanguage } from '@/context/LanguageContext';
import styles from './ReviewsTab.module.scss';

export default function ReviewsTab({ toolId, onReviewCountChange }) {
  const { t } = useLanguage();
  const currentUser = getCurrentUser();
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWriting, setIsWriting] = useState(false);

  // New review form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [helpfulMap, setHelpfulMap] = useState({});

  useEffect(() => {
    if (!toolId) return;
    setIsLoading(true);
    getReviews(toolId)
      .then((data) => {
        const safeData = Array.isArray(data) ? data : [];
        setReviews(safeData);
        setIsLoading(false);
        if (onReviewCountChange) onReviewCountChange(safeData.length);
      })
      .catch((err) => {
        console.error('Failed to load reviews:', err);
        setReviews([]);
        setIsLoading(false);
      });
  }, [toolId, onReviewCountChange]);

  const handleHelpful = (revId) => {
    if (helpfulMap[revId]) return;
    setHelpfulMap((prev) => ({ ...prev, [revId]: true }));
    setReviews((prev) =>
      prev.map((r) => (r.id === revId ? { ...r, helpful: (r.helpful || 0) + 1 } : r))
    );
  };

  const handleDeleteReview = async (revId) => {
    if (window.confirm(t('reviews.deleteConfirm', 'Delete this review?'))) {
      try {
        const updated = await deleteReview(toolId, revId);
        const nextList = Array.isArray(updated) ? updated : [];
        setReviews(nextList);
        if (onReviewCountChange) onReviewCountChange(nextList.length);
      } catch (err) {
        console.error('Failed to delete review:', err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || !currentUser) return;

    setIsSubmitting(true);
    try {
      const updated = await addReview(toolId, {
        userId: currentUser.id,
        author: currentUser.name || 'Anonymous Member',
        role: currentUser.title || (currentUser.role === 'admin' ? 'Guidora Admin' : 'Community Member'),
        avatar: currentUser.avatar || null,
        title: reviewTitle.trim(),
        rating,
        content: content.trim(),
      });
      const nextList = Array.isArray(updated) ? updated : [];
      setReviews(nextList);
      setContent('');
      setReviewTitle('');
      setIsWriting(false);
      if (onReviewCountChange) onReviewCountChange(nextList.length);
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate statistics
  const reviewList = Array.isArray(reviews) ? reviews : [];
  const total = reviewList.length;
  const validRatings = reviewList.map((r) => (typeof r.rating === 'number' && !isNaN(r.rating) ? r.rating : 5));
  const average = total > 0 && validRatings.length > 0
    ? (validRatings.reduce((acc, r) => acc + r, 0) / total).toFixed(1)
    : '5.0';

  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviewList.filter((r) => Math.round(typeof r.rating === 'number' && !isNaN(r.rating) ? r.rating : 5) === stars).length;
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return { stars, count, percentage };
  });

  return (
    <div className={styles.reviewsContainer}>
      {/* 1. Rating Summary Header */}
      <div className={styles.summaryCard}>
        <div className={styles.scoreCol}>
          <span className={styles.averageScore}>{average}</span>
          <div className={styles.starsGroup}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={16}
                fill={s <= Math.round(Number(average)) ? '#EAB308' : 'none'}
                color={s <= Math.round(Number(average)) ? '#EAB308' : 'var(--text-muted)'}
              />
            ))}
          </div>
          <span className={styles.totalCount}>
            {t('tool.basedOnReviews', 'Based on {count} reviews').replace('{count}', total)}
          </span>
        </div>

        <div className={styles.distCol}>
          {distribution.map((d) => (
            <div key={d.stars} className={styles.distRow}>
              <span className={styles.distLabel}>{d.stars} ★</span>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: `${d.percentage}%` }} />
              </div>
              <span className={styles.distCount}>{d.count}</span>
            </div>
          ))}
        </div>

        <div className={styles.actionCol}>
          <button
            className={styles.writeReviewBtn}
            onClick={() => setIsWriting(!isWriting)}
          >
            <MessageSquare size={16} />
            <span>{isWriting ? t('reviews.cancel', 'Cancel') : t('reviews.writeReview', 'Write a Review')}</span>
          </button>
        </div>
      </div>

      {/* 2. Write Review Form or Login Prompt */}
      {isWriting && !currentUser && (
        <div className={styles.loginRequiredCard}>
          <div className={styles.loginCardInner}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertCircle size={22} color="var(--accent-purple)" />
              <div className={styles.loginText}>
                <h4>{t('reviews.loginRequiredTitle', 'Giriş Yapmanız Gerekiyor')}</h4>
                <p>{t('reviews.loginRequiredDesc', 'Topluluk değerlendirmeleri güvenilirliği için yalnızca giriş yapmış üyeler yorum yazabilir.')}</p>
              </div>
            </div>
            <button
              type="button"
              className={styles.loginTriggerBtn}
              onClick={() => window.dispatchEvent(new CustomEvent('guidora_open_auth', { detail: 'login' }))}
            >
              <LogIn size={15} />
              <span>{t('auth.signIn', 'Giriş Yap')}</span>
            </button>
          </div>
        </div>
      )}

      {isWriting && currentUser && (
        <form className={styles.reviewForm} onSubmit={handleSubmit}>
          <div className={styles.formHeader}>
            <h3 className={styles.formTitle}>{t('reviews.title', 'Share Your Experience')}</h3>
            <div className={styles.authBadge}>
              <CheckCircle2 size={13} />
              <span>{currentUser.name} ({currentUser.role === 'admin' ? 'Admin' : t('tool.verifiedBadge', 'Verified Member')})</span>
            </div>
          </div>

          {/* Current User Identity Card (Automatic Profile - No manual typing) */}
          <div className={styles.formAuthorCard}>
            <div className={styles.authorAvatar}>
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} />
              ) : (
                <span>{(currentUser.name || 'U').slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className={styles.authorMeta}>
              <div className={styles.authorNameRow}>
                <span className={styles.authorName}>{currentUser.name}</span>
                <span className={styles.authorVerifiedBadge}>
                  <CheckCircle2 size={11} />
                  <span>{currentUser.role === 'admin' ? 'Admin' : 'Doğrulanmış Üye'}</span>
                </span>
              </div>
              <span className={styles.authorSubtitle}>
                {currentUser.title || currentUser.email || 'Topluluk Üyesi'} &bull; {t('reviews.postingAsYourself', 'Yorumunuz bu profil ile yayınlanacaktır')}
              </span>
            </div>
          </div>

          {/* Star Rating Picker */}
          <div className={styles.ratingSelectRow}>
            <span className={styles.formLabel}>{t('reviews.ratingLabel', 'Puan:')}</span>
            <div className={styles.starPickers}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  type="button"
                  key={s}
                  className={styles.starBtn}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                  aria-label={`${s} stars`}
                >
                  <Star
                    size={22}
                    fill={(hoverRating || rating) >= s ? '#EAB308' : 'none'}
                    color={(hoverRating || rating) >= s ? '#EAB308' : 'var(--text-muted)'}
                  />
                </button>
              ))}
            </div>
            <span className={styles.starPickedText}>{hoverRating || rating} / 5</span>
          </div>

          {/* Review Summary / Title Input */}
          <div className={styles.inputGroup}>
            <label className={styles.formLabel}>{t('reviews.summaryLabel', 'Başlık / Açıklama')}</label>
            <input
              type="text"
              className={styles.textInput}
              placeholder={t('reviews.summaryPlaceholder', 'Örn: İş akışlarımı hızlandıran harika bir araç...')}
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
            />
          </div>

          {/* Review Content Textarea */}
          <div className={styles.inputGroup}>
            <label className={styles.formLabel}>{t('reviews.contentLabel', 'Yorum ve Değerlendirmeniz *')}</label>
            <textarea
              className={styles.textArea}
              rows={4}
              placeholder={t('reviews.contentPlaceholder', 'Araç hakkındaki deneyiminiz, güçlü yönleri ve geliştirmeye açık noktaları...')}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => setIsWriting(false)}
            >
              {t('reviews.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting || !content.trim()}
            >
              <Send size={15} />
              <span>{isSubmitting ? 'Posting...' : t('reviews.postReview', 'Post Review')}</span>
            </button>
          </div>
        </form>
      )}

      {/* 3. Review List */}
      <div className={styles.reviewsList}>
        {isLoading ? (
          <div className={styles.loadingSkeleton}>
            <div className={styles.skelLine} />
            <div className={styles.skelLine} />
          </div>
        ) : reviewList.length === 0 ? (
          <div className={styles.emptyState}>
            <p>{t('reviews.noReviewsYet', 'No reviews yet. Be the first to share your experience!')}</p>
          </div>
        ) : (
          reviewList.map((rev) => (
            <div key={rev.id} className={styles.reviewCard}>
              <div className={styles.revHeader}>
                <div className={styles.authorAvatar}>
                  {(rev.author || 'AI').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className={styles.authorMeta}>
                  <div className={styles.nameRow}>
                    <span className={styles.authorName}>{rev.author}</span>
                    {rev.verified && (
                      <CheckCircle2 size={13} color="#10B981" fill="rgba(16, 185, 129, 0.2)" />
                    )}
                  </div>
                  <span className={styles.authorRole}>{rev.role}</span>
                </div>
                <div className={styles.revRight}>
                  <div className={styles.revStars}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={13}
                        fill={s <= rev.rating ? '#EAB308' : 'none'}
                        color={s <= rev.rating ? '#EAB308' : 'var(--text-muted)'}
                      />
                    ))}
                  </div>
                  <span className={styles.revDate}>{rev.date}</span>

                  {currentUser && (currentUser.id === rev.userId || currentUser.role === 'admin' || currentUser.role === 'moderator') && (
                    <button
                      type="button"
                      className={styles.deleteRevBtn}
                      onClick={() => handleDeleteReview(rev.id)}
                      title={t('reviews.deleteReview', 'Delete Review')}
                      aria-label="Delete Review"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {rev.title && (
                <h4 className={styles.revTitle}>{rev.title}</h4>
              )}
              <p className={styles.revContent}>{rev.content}</p>

              <div className={styles.revFooter}>
                <button
                  className={`${styles.helpfulBtn} ${helpfulMap[rev.id] ? styles.helpfulActive : ''}`}
                  onClick={() => handleHelpful(rev.id)}
                  title="Mark this review as helpful"
                >
                  <ThumbsUp size={13} />
                  <span>Helpful ({rev.helpful || 0})</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

