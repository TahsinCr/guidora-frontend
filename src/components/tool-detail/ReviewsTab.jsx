import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Star,
  ThumbsUp,
  CheckCircle2,
  MessageSquare,
  Send,
  Trash2,
  LogIn,
  AlertCircle,
  CornerDownRight,
  AtSign,
  X,
} from 'lucide-react';
import {
  getReviews,
  addReview,
  deleteReview,
  toggleReviewHelpful,
} from '@/services/toolsService';
import { getCurrentUser, getAllUsers } from '@/services/userService';
import { useLanguage } from '@/context/LanguageContext';
import styles from './ReviewsTab.module.scss';

function isImageUrl(val) {
  return (
    typeof val === 'string' &&
    (val.startsWith('http://') ||
      val.startsWith('https://') ||
      val.startsWith('/') ||
      val.startsWith('data:image/'))
  );
}

function getInitials(name, fallbackAvatar) {
  if (
    typeof fallbackAvatar === 'string' &&
    fallbackAvatar.trim().length > 0 &&
    fallbackAvatar.trim().length <= 3 &&
    !isImageUrl(fallbackAvatar)
  ) {
    return fallbackAvatar.trim().toUpperCase();
  }
  return (name || 'U')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function toUsername(author, existingUsername) {
  if (existingUsername && typeof existingUsername === 'string') {
    return existingUsername.replace(/^@/, '').toLowerCase();
  }
  return (author || 'uye')
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9_]/g, '');
}

export default function ReviewsTab({ toolId, onReviewCountChange }) {
  const { t } = useLanguage();
  const currentUser = getCurrentUser();
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWriting, setIsWriting] = useState(false);

  // New top-level review form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [helpfulMap, setHelpfulMap] = useState({});

  // Sub-message (reply) state
  const [activeReplyTarget, setActiveReplyTarget] = useState(null); // { parentId, replyToUsername, replyToAuthor }
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const replyInputRef = useRef(null);
  const mainInputRef = useRef(null);

  // @mention autocomplete state ('main' | 'reply' | null)
  const [mentionContext, setMentionContext] = useState(null);
  const [mentionQuery, setMentionQuery] = useState('');

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

  // Mentionable users directory (platform members + thread participants)
  const mentionableUsers = useMemo(() => {
    const map = new Map();
    const systemUsers = getAllUsers() || [];
    systemUsers.forEach((u) => {
      const uname = toUsername(u.name, u.username);
      if (uname) {
        map.set(uname, {
          username: uname,
          name: u.name || uname,
          role: u.title || u.role || 'Üye',
          avatar: getInitials(u.name, u.avatar),
        });
      }
    });
    (Array.isArray(reviews) ? reviews : []).forEach((r) => {
      const uname = toUsername(r.author, r.username);
      if (uname && !map.has(uname)) {
        map.set(uname, {
          username: uname,
          name: r.author || uname,
          role: r.role || 'Topluluk Üyesi',
          avatar: getInitials(r.author, r.avatar),
        });
      }
    });
    return Array.from(map.values());
  }, [reviews]);

  const filteredMentions = useMemo(() => {
    if (!mentionContext) return [];
    const q = mentionQuery.trim().toLowerCase();
    return mentionableUsers
      .filter(
        (u) =>
          !q ||
          u.username.toLowerCase().includes(q) ||
          u.name.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [mentionContext, mentionQuery, mentionableUsers]);

  const detectMentionTrigger = (text, targetType) => {
    const match = text.match(/(?:^|\s)@([a-zA-Z0-9_.-]*)$/);
    if (match) {
      setMentionContext(targetType);
      setMentionQuery(match[1] || '');
    } else if (mentionContext === targetType) {
      setMentionContext(null);
      setMentionQuery('');
    }
  };

  const insertMention = (username, targetType) => {
    const applyReplacement = (prevText) => {
      if (/(?:^|\s)@([a-zA-Z0-9_.-]*)$/.test(prevText)) {
        return prevText.replace(/(^|\s)@([a-zA-Z0-9_.-]*)$/, `$1@${username} `);
      }
      const prefix = prevText && !prevText.endsWith(' ') ? `${prevText} ` : prevText;
      return `${prefix}@${username} `;
    };

    if (targetType === 'reply') {
      setReplyContent((prev) => applyReplacement(prev));
      setMentionContext(null);
      setTimeout(() => replyInputRef.current?.focus(), 10);
    } else {
      setContent((prev) => applyReplacement(prev));
      setMentionContext(null);
      setTimeout(() => mainInputRef.current?.focus(), 10);
    }
  };

  const handleHelpful = async (revId) => {
    const alreadyLiked = Boolean(helpfulMap[revId]);
    const delta = alreadyLiked ? -1 : 1;
    setHelpfulMap((prev) => ({ ...prev, [revId]: !alreadyLiked }));
    setReviews((prev) =>
      prev.map((r) =>
        String(r.id) === String(revId)
          ? { ...r, helpful: Math.max(0, (r.helpful || 0) + delta) }
          : r
      )
    );
    try {
      await toggleReviewHelpful(toolId, revId, delta);
    } catch (e) {
      // optimistic UI already updated
    }
  };

  const handleDeleteReview = async (revId) => {
    if (window.confirm(t('reviews.deleteConfirm', 'Bu mesajı silmek istediğinize emin misiniz?'))) {
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

  const handleStartReply = (parentReview, targetMessage = null) => {
    const target = targetMessage || parentReview;
    const uname = toUsername(target.author, target.username);
    setActiveReplyTarget({
      parentId: parentReview.id,
      replyToUsername: uname,
      replyToAuthor: target.author,
    });
    setReplyContent((prev) => {
      const mentionPrefix = `@${uname} `;
      if (!prev.trim()) return mentionPrefix;
      if (!prev.includes(`@${uname}`)) return `${mentionPrefix}${prev}`;
      return prev;
    });
    setTimeout(() => {
      replyInputRef.current?.focus();
    }, 30);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || !currentUser) return;

    setIsSubmitting(true);
    try {
      const updated = await addReview(toolId, {
        userId: currentUser.id,
        author: currentUser.name || 'Topluluk Üyesi',
        username: toUsername(currentUser.name, currentUser.username),
        role:
          currentUser.title ||
          (currentUser.role === 'admin' ? 'Platform Yöneticisi' : 'Doğrulanmış Üye'),
        avatar: getInitials(currentUser.name, currentUser.avatar),
        title: reviewTitle.trim(),
        rating,
        parentId: null,
        replyTo: null,
        content: content.trim(),
      });
      const nextList = Array.isArray(updated) ? updated : [];
      setReviews(nextList);
      setContent('');
      setReviewTitle('');
      setIsWriting(false);
      setMentionContext(null);
      if (onReviewCountChange) onReviewCountChange(nextList.length);
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (e, parentId) => {
    e.preventDefault();
    if (!replyContent.trim() || !currentUser) return;

    setIsSubmittingReply(true);
    try {
      const updated = await addReview(toolId, {
        userId: currentUser.id,
        author: currentUser.name || 'Topluluk Üyesi',
        username: toUsername(currentUser.name, currentUser.username),
        role:
          currentUser.title ||
          (currentUser.role === 'admin' ? 'Platform Yöneticisi' : 'Doğrulanmış Üye'),
        avatar: getInitials(currentUser.name, currentUser.avatar),
        title: '',
        rating: null,
        parentId,
        replyTo: activeReplyTarget?.replyToUsername || null,
        content: replyContent.trim(),
      });
      const nextList = Array.isArray(updated) ? updated : [];
      setReviews(nextList);
      setReplyContent('');
      setActiveReplyTarget(null);
      setMentionContext(null);
      if (onReviewCountChange) onReviewCountChange(nextList.length);
    } catch (err) {
      console.error('Failed to submit reply:', err);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const renderFormattedContent = (text, parentRev) => {
    if (!text) return null;
    const parts = String(text).split(/(@[a-zA-Z0-9_.-]+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('@') && part.length > 1) {
        const uname = part.slice(1).toLowerCase();
        const matchedUser = mentionableUsers.find((u) => u.username === uname);
        return (
          <button
            key={idx}
            type="button"
            className={styles.mentionBadge}
            title={matchedUser ? `${matchedUser.name} (@${matchedUser.username}) — Yanıtlamak için tıkla` : `${part} — Yanıtla`}
            onClick={() =>
              handleStartReply(parentRev, {
                author: matchedUser?.name || uname,
                username: uname,
              })
            }
          >
            {part}
          </button>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  // Separate top-level reviews and nested sub-messages
  const reviewList = Array.isArray(reviews) ? reviews : [];
  const topLevelReviews = reviewList.filter((r) => !r.parentId);
  const repliesByParent = useMemo(() => {
    const map = {};
    reviewList
      .filter((r) => Boolean(r.parentId))
      .forEach((sub) => {
        const pid = String(sub.parentId);
        if (!map[pid]) map[pid] = [];
        map[pid].push(sub);
      });
    return map;
  }, [reviewList]);

  const totalTopLevel = topLevelReviews.length;
  const totalAllMessages = reviewList.length;
  const validRatings = topLevelReviews.map((r) =>
    typeof r.rating === 'number' && !isNaN(r.rating) ? r.rating : 5
  );
  const average =
    totalTopLevel > 0 && validRatings.length > 0
      ? (validRatings.reduce((acc, r) => acc + r, 0) / totalTopLevel).toFixed(1)
      : '5.0';

  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = topLevelReviews.filter(
      (r) =>
        Math.round(typeof r.rating === 'number' && !isNaN(r.rating) ? r.rating : 5) ===
        stars
    ).length;
    const percentage = totalTopLevel > 0 ? (count / totalTopLevel) * 100 : 0;
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
            {totalTopLevel} değerlendirme &bull; {totalAllMessages - totalTopLevel} alt yanıt
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
            type="button"
            className={styles.writeReviewBtn}
            onClick={() => setIsWriting(!isWriting)}
          >
            <MessageSquare size={16} />
            <span>
              {isWriting
                ? t('reviews.cancel', 'İptal')
                : t('reviews.writeReview', 'Değerlendirme Yaz')}
            </span>
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
                <p>
                  {t(
                    'reviews.loginRequiredDesc',
                    'Topluluk değerlendirmeleri güvenilirliği için yalnızca giriş yapmış üyeler yorum ve yanıt yazabilir.'
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              className={styles.loginTriggerBtn}
              onClick={() =>
                window.dispatchEvent(new CustomEvent('guidora_open_auth', { detail: 'login' }))
              }
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
            <h3 className={styles.formTitle}>
              {t('reviews.title', 'Deneyiminizi Paylaşın')}
            </h3>
            <div className={styles.authBadge}>
              <CheckCircle2 size={13} />
              <span>
                {currentUser.name} (@{toUsername(currentUser.name, currentUser.username)})
              </span>
            </div>
          </div>

          <div className={styles.formAuthorCard}>
            <div className={styles.authorAvatar}>
              {isImageUrl(currentUser.avatar) ? (
                <img src={currentUser.avatar} alt={currentUser.name} />
              ) : (
                <span>{getInitials(currentUser.name, currentUser.avatar)}</span>
              )}
            </div>
            <div className={styles.authorMeta}>
              <div className={styles.authorNameRow}>
                <span className={styles.authorName}>{currentUser.name}</span>
                <span className={styles.authorHandle}>
                  @{toUsername(currentUser.name, currentUser.username)}
                </span>
                <span className={styles.authorVerifiedBadge}>
                  <CheckCircle2 size={11} />
                  <span>{currentUser.role === 'admin' ? 'Admin' : 'Doğrulanmış Üye'}</span>
                </span>
              </div>
              <span className={styles.authorSubtitle}>
                {currentUser.title || currentUser.email || 'Topluluk Üyesi'} &bull;{' '}
                {t('reviews.postingAsYourself', 'Yorumunuz bu profil ile yayınlanacaktır')}
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
            <label className={styles.formLabel}>
              {t('reviews.summaryLabel', 'Başlık (İsteğe bağlı)')}
            </label>
            <input
              type="text"
              className={styles.textInput}
              placeholder={t(
                'reviews.summaryPlaceholder',
                'Örn: İş akışlarımızı hızlandıran kararlı bir araç...'
              )}
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
            />
          </div>

          {/* Review Content Textarea with @mention support */}
          <div className={styles.inputGroup} style={{ position: 'relative' }}>
            <div className={styles.labelRowWithHint}>
              <label className={styles.formLabel}>
                {t('reviews.contentLabel', 'Değerlendirme Mesajınız *')}
              </label>
              <span className={styles.mentionHint}>
                <AtSign size={12} /> Bir üyeyi etiketlemek için <strong>@kullanıcı</strong> yazın
              </span>
            </div>
            <textarea
              ref={mainInputRef}
              className={styles.textArea}
              rows={4}
              placeholder={t(
                'reviews.contentPlaceholder',
                'Araç hakkındaki teknik deneyiminiz, güçlü yönleri ve geliştirmeye açık noktaları... (@kişi ile etiketleyebilirsiniz)'
              )}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                detectMentionTrigger(e.target.value, 'main');
              }}
              required
            />

            {/* Quick @mention chips */}
            <div className={styles.quickMentionBar}>
              <span className={styles.quickMentionLabel}>Hızlı etiketle:</span>
              {mentionableUsers.slice(0, 5).map((u) => (
                <button
                  key={u.username}
                  type="button"
                  className={styles.quickMentionChip}
                  onClick={() => insertMention(u.username, 'main')}
                >
                  @{u.username}
                </button>
              ))}
            </div>

            {mentionContext === 'main' && filteredMentions.length > 0 && (
              <div className={styles.mentionDropdown}>
                <div className={styles.mentionDropdownHeader}>Üye Etiketle (@mention)</div>
                {filteredMentions.map((u) => (
                  <button
                    key={u.username}
                    type="button"
                    className={styles.mentionOption}
                    onClick={() => insertMention(u.username, 'main')}
                  >
                    <span className={styles.mentionOptionAvatar}>{u.avatar}</span>
                    <div className={styles.mentionOptionInfo}>
                      <span className={styles.mentionOptionName}>{u.name}</span>
                      <span className={styles.mentionOptionHandle}>@{u.username}</span>
                    </div>
                    <span className={styles.mentionOptionRole}>{u.role}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => {
                setIsWriting(false);
                setMentionContext(null);
              }}
            >
              {t('reviews.cancel', 'İptal')}
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting || !content.trim()}
            >
              <Send size={15} />
              <span>
                {isSubmitting ? 'Gönderiliyor...' : t('reviews.postReview', 'Değerlendirmeyi Yayınla')}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* 3. Threaded Review List (Parent Message + Sub-messages) */}
      <div className={styles.reviewsList}>
        {isLoading ? (
          <div className={styles.loadingSkeleton}>
            <div className={styles.skelLine} />
            <div className={styles.skelLine} />
          </div>
        ) : topLevelReviews.length === 0 ? (
          <div className={styles.emptyState}>
            <p>
              {t(
                'reviews.noReviewsYet',
                'Henüz değerlendirme yapılmamış. İlk deneyimi paylaşan siz olun!'
              )}
            </p>
          </div>
        ) : (
          topLevelReviews.map((rev) => {
            const subMessages = repliesByParent[String(rev.id)] || [];
            const isReplyingHere =
              activeReplyTarget && String(activeReplyTarget.parentId) === String(rev.id);
            const revUsername = toUsername(rev.author, rev.username);

            return (
              <div key={rev.id} className={styles.reviewCard}>
                {/* Parent Message Header */}
                <div className={styles.revHeader}>
                  <div className={styles.authorAvatar}>
                    {isImageUrl(rev.avatar) ? (
                      <img src={rev.avatar} alt={rev.author} />
                    ) : (
                      <span>{getInitials(rev.author, rev.avatar)}</span>
                    )}
                  </div>
                  <div className={styles.authorMeta}>
                    <div className={styles.nameRow}>
                      <span className={styles.authorName}>{rev.author}</span>
                      <span className={styles.authorHandle}>@{revUsername}</span>
                      {rev.verified && (
                        <CheckCircle2
                          size={13}
                          color="#10B981"
                          fill="rgba(16, 185, 129, 0.2)"
                        />
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
                          fill={s <= (rev.rating || 5) ? '#EAB308' : 'none'}
                          color={s <= (rev.rating || 5) ? '#EAB308' : 'var(--text-muted)'}
                        />
                      ))}
                    </div>
                    <span className={styles.revDate}>{rev.date}</span>

                    {currentUser &&
                      (currentUser.id === rev.userId ||
                        currentUser.role === 'admin' ||
                        currentUser.role === 'moderator') && (
                        <button
                          type="button"
                          className={styles.deleteRevBtn}
                          onClick={() => handleDeleteReview(rev.id)}
                          title={t('reviews.deleteReview', 'Değerlendirmeyi Sil')}
                          aria-label="Delete Review"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                  </div>
                </div>

                {rev.title && <h4 className={styles.revTitle}>{rev.title}</h4>}
                <p className={styles.revContent}>{renderFormattedContent(rev.content, rev)}</p>

                <div className={styles.revFooter}>
                  <button
                    type="button"
                    className={`${styles.helpfulBtn} ${
                      helpfulMap[rev.id] ? styles.helpfulActive : ''
                    }`}
                    onClick={() => handleHelpful(rev.id)}
                    title="Bu değerlendirmeyi faydalı olarak işaretle"
                  >
                    <ThumbsUp size={13} />
                    <span>Faydalı ({rev.helpful || 0})</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.replyActionBtn} ${
                      isReplyingHere ? styles.replyActionActive : ''
                    }`}
                    onClick={() => handleStartReply(rev)}
                  >
                    <CornerDownRight size={13} />
                    <span>Yanıtla</span>
                    {subMessages.length > 0 && (
                      <span className={styles.replyCountPill}>{subMessages.length}</span>
                    )}
                  </button>
                </div>

                {/* Sub-Messages (Replies) Thread */}
                {(subMessages.length > 0 || isReplyingHere) && (
                  <div className={styles.subMessagesThread}>
                    {subMessages.map((sub) => {
                      const subUsername = toUsername(sub.author, sub.username);
                      return (
                        <div key={sub.id} className={styles.subMessageCard}>
                          <div className={styles.subHeader}>
                            <div className={styles.subAvatar}>
                              {isImageUrl(sub.avatar) ? (
                                <img src={sub.avatar} alt={sub.author} />
                              ) : (
                                <span>{getInitials(sub.author, sub.avatar)}</span>
                              )}
                            </div>
                            <div className={styles.subAuthorMeta}>
                              <div className={styles.nameRow}>
                                <span className={styles.subAuthorName}>{sub.author}</span>
                                <span className={styles.authorHandle}>@{subUsername}</span>
                                {sub.verified && (
                                  <CheckCircle2
                                    size={12}
                                    color="#10B981"
                                    fill="rgba(16, 185, 129, 0.2)"
                                  />
                                )}
                                {sub.replyTo && (
                                  <span className={styles.replyingToTag}>
                                    <CornerDownRight size={10} /> @{sub.replyTo}
                                  </span>
                                )}
                              </div>
                              <span className={styles.subAuthorRole}>{sub.role}</span>
                            </div>
                            <div className={styles.subRight}>
                              <span className={styles.revDate}>{sub.date}</span>
                              {currentUser &&
                                (currentUser.id === sub.userId ||
                                  currentUser.role === 'admin' ||
                                  currentUser.role === 'moderator') && (
                                  <button
                                    type="button"
                                    className={styles.deleteRevBtn}
                                    onClick={() => handleDeleteReview(sub.id)}
                                    title="Yanıtı Sil"
                                    aria-label="Delete Reply"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                            </div>
                          </div>

                          <p className={styles.subContent}>
                            {renderFormattedContent(sub.content, rev)}
                          </p>

                          <div className={styles.subFooter}>
                            <button
                              type="button"
                              className={`${styles.helpfulBtn} ${styles.subHelpfulBtn} ${
                                helpfulMap[sub.id] ? styles.helpfulActive : ''
                              }`}
                              onClick={() => handleHelpful(sub.id)}
                            >
                              <ThumbsUp size={12} />
                              <span>Faydalı ({sub.helpful || 0})</span>
                            </button>

                            <button
                              type="button"
                              className={styles.subReplyBtn}
                              onClick={() => handleStartReply(rev, sub)}
                            >
                              <AtSign size={12} />
                              <span>@{subUsername} yanıtla</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Inline Sub-Message Reply Composer */}
                    {isReplyingHere && (
                      <div className={styles.inlineReplyBox}>
                        {!currentUser ? (
                          <div className={styles.inlineReplyLoginPrompt}>
                            <span>
                              <strong>@{activeReplyTarget.replyToUsername}</strong> kullanıcısına yanıt
                              yazmak için giriş yapın.
                            </span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                className={styles.cancelBtn}
                                onClick={() => setActiveReplyTarget(null)}
                              >
                                İptal
                              </button>
                              <button
                                type="button"
                                className={styles.loginTriggerBtn}
                                onClick={() =>
                                  window.dispatchEvent(
                                    new CustomEvent('guidora_open_auth', { detail: 'login' })
                                  )
                                }
                              >
                                <LogIn size={13} />
                                <span>Giriş Yap</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <form
                            className={styles.inlineReplyForm}
                            onSubmit={(e) => handleReplySubmit(e, rev.id)}
                          >
                            <div className={styles.inlineReplyHeader}>
                              <div className={styles.replyingToBanner}>
                                <CornerDownRight size={13} />
                                <span>
                                  Yanıtlanıyor:{' '}
                                  <strong>@{activeReplyTarget.replyToUsername}</strong> (
                                  {activeReplyTarget.replyToAuthor})
                                </span>
                              </div>
                              <button
                                type="button"
                                className={styles.closeReplyBtn}
                                onClick={() => {
                                  setActiveReplyTarget(null);
                                  setMentionContext(null);
                                }}
                                aria-label="Yanıtı kapat"
                              >
                                <X size={14} />
                              </button>
                            </div>

                            <div style={{ position: 'relative' }}>
                              <textarea
                                ref={replyInputRef}
                                className={styles.replyTextArea}
                                rows={2}
                                placeholder={`@${activeReplyTarget.replyToUsername} kullanıcısına yanıtınızı yazın... (@kişi ile başka üyeleri de etiketleyebilirsiniz)`}
                                value={replyContent}
                                onChange={(e) => {
                                  setReplyContent(e.target.value);
                                  detectMentionTrigger(e.target.value, 'reply');
                                }}
                                required
                              />

                              {mentionContext === 'reply' && filteredMentions.length > 0 && (
                                <div className={styles.mentionDropdown}>
                                  <div className={styles.mentionDropdownHeader}>
                                    Üye Etiketle (@mention)
                                  </div>
                                  {filteredMentions.map((u) => (
                                    <button
                                      key={u.username}
                                      type="button"
                                      className={styles.mentionOption}
                                      onClick={() => insertMention(u.username, 'reply')}
                                    >
                                      <span className={styles.mentionOptionAvatar}>
                                        {u.avatar}
                                      </span>
                                      <div className={styles.mentionOptionInfo}>
                                        <span className={styles.mentionOptionName}>{u.name}</span>
                                        <span className={styles.mentionOptionHandle}>
                                          @{u.username}
                                        </span>
                                      </div>
                                      <span className={styles.mentionOptionRole}>{u.role}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className={styles.inlineReplyActions}>
                              <div className={styles.quickMentionBar}>
                                <span className={styles.quickMentionLabel}>Etiketle:</span>
                                {mentionableUsers.slice(0, 4).map((u) => (
                                  <button
                                    key={u.username}
                                    type="button"
                                    className={styles.quickMentionChip}
                                    onClick={() => insertMention(u.username, 'reply')}
                                  >
                                    @{u.username}
                                  </button>
                                ))}
                              </div>

                              <div className={styles.replyBtnGroup}>
                                <button
                                  type="button"
                                  className={styles.cancelBtn}
                                  onClick={() => {
                                    setActiveReplyTarget(null);
                                    setMentionContext(null);
                                  }}
                                >
                                  İptal
                                </button>
                                <button
                                  type="submit"
                                  className={styles.submitBtn}
                                  disabled={isSubmittingReply || !replyContent.trim()}
                                >
                                  <Send size={13} />
                                  <span>
                                    {isSubmittingReply ? 'Gönderiliyor...' : 'Yanıtı Gönder'}
                                  </span>
                                </button>
                              </div>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
