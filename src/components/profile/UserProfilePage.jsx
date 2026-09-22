import React, { useState, useEffect } from 'react';
import {
  User,
  ArrowLeft,
  Settings,
  ShieldCheck,
  Bookmark,
  Send,
  Star,
  Globe,
  MapPin,
  Calendar,
  Award,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  Share2,
  Check,
  Wrench,
  X,
  Lock,
} from 'lucide-react';
import { getUserById, getCurrentUser, adminUpdateUserDetails } from '@/services/userService';
import { getToolById, getAllReviews, deleteReview } from '@/services/toolsService';
import { useLanguage } from '@/context/LanguageContext';
import { sanitizeUrl, sanitizePlainText } from '@/utils/security';
import styles from './UserProfilePage.module.scss';

export default function UserProfilePage({ userId, onBack, onOpenTool, onOpenAdmin }) {
  const { t, translateCategory } = useLanguage();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('saved'); // 'saved' | 'submitted' | 'reviews'
  const [savedTools, setSavedTools] = useState([]);
  const [submittedTools, setSubmittedTools] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [isLoadingTools, setIsLoadingTools] = useState(true);
  const [copyNotification, setCopyNotification] = useState(false);

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  const currentUser = getCurrentUser();
  const isOwner = user && (!userId || user.id === currentUser?.id);
  const canDeleteAnyReview = currentUser && (currentUser.role === 'admin' || currentUser.role === 'moderator');

  useEffect(() => {
    const loadedUser = getUserById(userId);
    setUser(loadedUser);
    if (loadedUser) {
      setEditName(loadedUser.name || '');
      setEditTitle(loadedUser.title || '');
      setEditBio(loadedUser.bio || '');
      setEditLocation(loadedUser.location || '');
      setEditWebsite(loadedUser.website || '');
      setEditAvatar(loadedUser.avatar || '');

      // Fetch user reviews
      getUserReviews(loadedUser.id).then((revs) => {
        setUserReviews(revs || []);
      });
    }
  }, [userId]);

  // Load saved and submitted tools
  useEffect(() => {
    if (!user) return;
    setIsLoadingTools(true);

    getTools({ limit: 100 })
      .then((data) => {
        const all = data.items || [];
        const saved = all.filter((t) => (user.savedToolIds || []).includes(t.id));
        const submitted = all.filter(
          (t) =>
            (user.submittedToolIds || []).includes(t.id) ||
            t.creator?.id === user.id ||
            t.creator?.name?.toLowerCase() === user.name?.toLowerCase()
        );
        setSavedTools(saved);
        setSubmittedTools(submitted);
        setIsLoadingTools(false);
      })
      .catch((err) => {
        console.error('Error fetching user tools:', err);
        setIsLoadingTools(false);
      });
  }, [user]);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopyNotification(true);
    setTimeout(() => setCopyNotification(false), 2000);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!editName.trim()) return;

    const initials = editAvatar.trim()
      ? editAvatar.trim().slice(0, 2).toUpperCase()
      : editName.trim().split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

    const updated = updateCurrentUser({
      name: editName.trim(),
      title: editTitle.trim(),
      bio: editBio.trim(),
      location: editLocation.trim(),
      website: editWebsite.trim(),
      avatar: initials,
    });

    setUser(updated);
    setIsEditModalOpen(false);
  };

  const handleDeleteUserReview = async (toolId, reviewId) => {
    if (window.confirm(t('user.confirmDeleteReview', 'Are you sure you want to delete this review?'))) {
      try {
        await deleteReview(toolId, reviewId);
        setUserReviews((prev) => prev.filter((r) => r.id !== reviewId));
      } catch (err) {
        console.error('Failed to delete review:', err);
      }
    }
  };

  if (!user) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>{t('user.loadingProfile', 'Loading member profile...')}</p>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      {/* Top Navigation Bar */}
      <div className={styles.topBar}>
        <button type="button" className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={16} />
          <span>{t('header.backToDirectory', 'Back to Directory')}</span>
        </button>

        <div className={styles.topBarActions}>
          {isOwner && user.role === 'admin' && (
            <button
              type="button"
              className={styles.editProfileBtn}
              onClick={onOpenAdmin}
              style={{
                background: 'rgba(138, 56, 245, 0.12)',
                color: 'var(--primary-color)',
                borderColor: 'rgba(138, 56, 245, 0.3)',
              }}
            >
              <LayoutDashboard size={15} />
              <span>{t('user.adminDashboard', 'Admin Panel')}</span>
            </button>
          )}

          {isOwner && (
            <button
              type="button"
              className={styles.editProfileBtn}
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit3 size={15} />
              <span>{t('user.editProfile', 'Edit Profile')}</span>
            </button>
          )}

          <button type="button" className={styles.shareBtn} onClick={handleShare}>
            <Share2 size={15} />
            <span>{copyNotification ? t('user.copiedLink', 'Copied link!') : t('user.shareProfile', 'Share Profile')}</span>
          </button>
        </div>
      </div>

      {/* Main Header / Banner & Card */}
      <div className={styles.headerCard}>
        <div className={styles.bannerGlow} />

        <div className={styles.profileMain}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatarLarge}>{user.avatar || 'U'}</div>
            {user.role === 'admin' && (
              <span className={styles.adminBadgeIcon} title="Platform Admin">
                <ShieldCheck size={14} />
              </span>
            )}
          </div>

          <div className={styles.profileInfo}>
            <div className={styles.nameRow}>
              <h1 className={styles.userName}>{user.name}</h1>
              <span className={`${styles.rolePill} ${styles[user.role] || ''}`}>
                {user.role === 'admin'
                  ? t('user.platformAdmin', 'Platform Admin')
                  : user.role === 'moderator'
                  ? t('user.moderatorRole', 'Community Moderator')
                  : user.role === 'creator'
                  ? t('user.toolCreator', 'Tool Creator')
                  : t('user.communityMember', 'Community Member')}
              </span>
            </div>

            <p className={styles.titleText}>{user.title || 'AI Directory Contributor'}</p>

            {/* Quick Meta Items */}
            <div className={styles.metaRow}>
              {user.location && (
                <div className={styles.metaItem}>
                  <MapPin size={13} />
                  <span>{user.location}</span>
                </div>
              )}
              {user.website && sanitizeUrl(user.website) && (
                <a
                  href={sanitizeUrl(user.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.metaItem} ${styles.metaLink}`}
                >
                  <Globe size={13} />
                  <span>{user.website.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink size={10} />
                </a>
              )}
              <div className={styles.metaItem}>
                <Calendar size={13} />
                <span>{t('user.joined', 'Joined')} {user.joinedDate || 'Recently'}</span>
              </div>
              <div className={`${styles.metaItem} ${styles.reputationItem}`}>
                <Award size={13} />
                <span>{user.reputation || 100} {t('user.reputation', 'Rep')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Bio / About */}
        {user.bio && (
          <div className={styles.bioSection}>
            <p className={styles.bioText}>{user.bio}</p>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className={styles.tabsBar}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'saved' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          <Bookmark size={15} />
          <span>{t('user.savedTools', 'Saved Tools')}</span>
          <span className={styles.tabCounter}>{savedTools.length}</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'submitted' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('submitted')}
        >
          <Sparkles size={15} />
          <span>{t('user.submittedTools', 'Submitted Tools')}</span>
          <span className={styles.tabCounter}>{submittedTools.length}</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'reviews' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          <MessageSquare size={15} />
          <span>{t('user.reviews', 'My Reviews')}</span>
          <span className={styles.tabCounter}>{userReviews.length}</span>
        </button>
      </div>

      {/* Tab Content Section */}
      <div className={styles.contentSection}>
        {isLoadingTools ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p>{t('user.loadingTools', 'Loading tools...')}</p>
          </div>
        ) : activeTab === 'saved' ? (
          savedTools.length > 0 ? (
            <div className={styles.toolGrid}>
              {savedTools.map((tool) => (
                <ProductCard
                  key={tool.id}
                  tool={tool}
                  viewMode="grid"
                  onOpenDetail={onOpenTool}
                />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Bookmark size={36} className={styles.emptyIcon} />
              <h3>{t('user.savedTools', 'Saved Tools')}</h3>
              <p>{t('sorter.tryAdjusting', 'Tools you bookmark while browsing will appear here for easy reference.')}</p>
              <button type="button" className={styles.browseBtn} onClick={onBack}>
                {t('hero.allTools', 'Explore AI Directory')}
              </button>
            </div>
          )
        ) : activeTab === 'submitted' ? (
          submittedTools.length > 0 ? (
            <div className={styles.toolGrid}>
              {submittedTools.map((tool) => (
                <ProductCard
                  key={tool.id}
                  tool={tool}
                  viewMode="grid"
                  onOpenDetail={onOpenTool}
                />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Sparkles size={36} className={styles.emptyIcon} />
              <h3>{t('user.submittedTools', 'Submitted Tools')}</h3>
              <p>{t('user.submittedEmptyDesc', 'Tools created or verified by this user will be listed here.')}</p>
            </div>
          )
        ) : (
          /* Reviews Tab */
          userReviews.length > 0 ? (
            <div className={styles.reviewsList}>
              {userReviews.map((rev) => (
                <div key={rev.id} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <div
                      className={styles.toolMetaLeft}
                      onClick={() => onOpenTool && onOpenTool(rev.toolId)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className={styles.toolThumb}>
                        {(rev.toolName || 'AI').slice(0, 2).toUpperCase()}
                      </div>
                      <div className={styles.toolMetaInfo}>
                        <h4 className={styles.toolTitle}>{rev.toolName || 'Tool'}</h4>
                        <span className={styles.reviewDate}>{rev.date}</span>
                      </div>
                    </div>

                    <div className={styles.reviewHeaderRight}>
                      <div className={styles.reviewStars}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            fill={s <= rev.rating ? '#EAB308' : 'none'}
                            color={s <= rev.rating ? '#EAB308' : 'var(--text-muted)'}
                          />
                        ))}
                      </div>

                      {(isOwner || canDeleteAnyReview) && (
                        <button
                          type="button"
                          className={styles.deleteReviewBtn}
                          onClick={() => handleDeleteUserReview(rev.toolId, rev.id)}
                          title={t('user.deleteReview', 'Delete Review')}
                          aria-label="Delete Review"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className={styles.reviewContent}>{rev.content}</p>

                  <div className={styles.reviewFooter}>
                    <button
                      type="button"
                      className={styles.viewToolLink}
                      onClick={() => onOpenTool && onOpenTool(rev.toolId)}
                    >
                      <span>{t('user.viewTool', 'View Tool')}</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <MessageSquare size={36} className={styles.emptyIcon} />
              <h3>{t('user.noReviews', 'No reviews posted yet')}</h3>
              <p>{t('user.noReviewsDesc', 'When you review tools in the directory, your ratings and evaluations will appear here.')}</p>
              <button type="button" className={styles.browseBtn} onClick={onBack}>
                {t('hero.allTools', 'Explore AI Directory')}
              </button>
            </div>
          )
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditModalOpen(false);
          }}
        >
          <div className={styles.modalContent} role="dialog" aria-modal="true">
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrap}>
                <Edit3 size={18} color="var(--primary-color)" />
                <span className={styles.modalTitle}>{t('user.editProfileTitle', 'Edit Profile')}</span>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsEditModalOpen(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className={styles.editForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>{t('user.fullName', 'Full Name')}</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder={t('user.fullNamePlaceholder', 'e.g. Tahsin Cr')}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>{t('user.avatarInitials', 'Avatar Initials')}</label>
                  <input
                    type="text"
                    maxLength={2}
                    className={styles.input}
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value.toUpperCase())}
                    placeholder="e.g. TC"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{t('user.professionalTitle', 'Professional Title')}</label>
                <input
                  type="text"
                  className={styles.input}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder={t('user.professionalTitlePlaceholder', 'e.g. Lead AI Engineer & Product Architect')}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{t('user.aboutBio', 'About / Bio')}</label>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder={t('user.aboutBioPlaceholder', "Share a short bio about what you're building or exploring...")}
                />
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>{t('user.location', 'Location')}</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder={t('user.locationPlaceholder', 'e.g. Istanbul, Turkey')}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>{t('user.websiteUrl', 'Website / GitHub URL')}</label>
                  <input
                    type="url"
                    className={styles.input}
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    placeholder="https://github.com/username"
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsEditModalOpen(false)}
                >
                  {t('user.cancel', 'Cancel')}
                </button>
                <button type="submit" className={styles.saveBtn}>
                  {t('user.saveChanges', 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

