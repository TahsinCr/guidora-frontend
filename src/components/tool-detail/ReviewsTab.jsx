import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, CheckCircle2, MessageSquare, Send } from 'lucide-react';
import { getReviews, addReview } from '@/services/toolsService';
import styles from './ReviewsTab.module.scss';

export default function ReviewsTab({ toolId, onReviewCountChange }) {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWriting, setIsWriting] = useState(false);

  // New review form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [author, setAuthor] = useState('');
  const [role, setRole] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [helpfulMap, setHelpfulMap] = useState({});

  useEffect(() => {
    if (!toolId) return;
    setIsLoading(true);
    getReviews(toolId)
      .then((data) => {
        setReviews(data);
        setIsLoading(false);
        if (onReviewCountChange) onReviewCountChange(data.length);
      })
      .catch((err) => {
        console.error('Failed to load reviews:', err);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const updated = await addReview(toolId, {
        author: author.trim() || 'Anonymous Engineer',
        role: role.trim() || 'AI Practitioner',
        rating,
        content: content.trim(),
      });
      setReviews(updated);
      setContent('');
      setAuthor('');
      setRole('');
      setIsWriting(false);
      if (onReviewCountChange) onReviewCountChange(updated.length);
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate statistics
  const total = reviews.length;
  const average = total > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / total).toFixed(1) : '5.0';

  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => Math.round(r.rating) === stars).length;
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
          <span className={styles.totalCount}>Based on {total} reviews</span>
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
            <span>{isWriting ? 'Cancel' : 'Write a Review'}</span>
          </button>
        </div>
      </div>

      {/* 2. Write Review Form */}
      {isWriting && (
        <form className={styles.reviewForm} onSubmit={handleSubmit}>
          <div className={styles.formHeader}>
            <h3 className={styles.formTitle}>Share Your Experience</h3>
            <div className={styles.authBadge}>
              <CheckCircle2 size={13} />
              <span>Posting as TahsinCr (Verified Member)</span>
            </div>
          </div>

          <div className={styles.ratingSelectRow}>
            <span className={styles.formLabel}>Your Rating:</span>
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

          <div className={styles.inputGrid}>
            <div className={styles.inputGroup}>
              <label className={styles.formLabel}>Your Name</label>
              <input
                type="text"
                className={styles.textInput}
                placeholder="e.g. Alex Morgan"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.formLabel}>Your Role or Company</label>
              <input
                type="text"
                className={styles.textInput}
                placeholder="e.g. AI Researcher @ Studio"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.formLabel}>Your Review *</label>
            <textarea
              className={styles.textArea}
              rows={4}
              placeholder="What do you think about this tool? What are its strengths and areas for improvement?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          <div className={styles.authNotice}>
            ℹ️ <strong>Backend Auth Readiness</strong>: Preview session active. Non-registered user restrictions will be enforced once the user authentication service is connected.
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => setIsWriting(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting || !content.trim()}
            >
              <Send size={15} />
              <span>{isSubmitting ? 'Submitting...' : 'Post Review'}</span>
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
        ) : reviews.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No reviews yet. Be the first to share your experience!</p>
          </div>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className={styles.reviewCard}>
              <div className={styles.revHeader}>
                <div className={styles.authorAvatar}>
                  {rev.author.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
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
                </div>
              </div>

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

