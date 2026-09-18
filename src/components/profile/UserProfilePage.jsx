import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  ShieldCheck,
  MapPin,
  Globe,
  Calendar,
  Award,
  Bookmark,
  Sparkles,
  ExternalLink,
  Edit3,
  CheckCircle2,
  Share2,
  X,
} from 'lucide-react';
import ProductCard from '@/components/home/ProductCard';
import { getUserById, getCurrentUser, updateCurrentUser } from '@/services/userService';
import { getTools } from '@/services/toolsService';
import styles from './UserProfilePage.module.scss';

export default function UserProfilePage({
  userId,
  onBack,
  onOpenTool,
}) {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('saved'); // 'saved' | 'submitted'
  const [savedTools, setSavedTools] = useState([]);
  const [submittedTools, setSubmittedTools] = useState([]);
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

  if (!user) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading member profile...</p>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      {/* Top Navigation Bar */}
      <div className={styles.topBar}>
        <button type="button" className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to Directory</span>
        </button>

        <div className={styles.topBarActions}>
          {isOwner && (
            <button
              type="button"
              className={styles.editProfileBtn}
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit3 size={15} />
              <span>Edit Profile</span>
            </button>
          )}

          <button type="button" className={styles.shareBtn} onClick={handleShare}>
            <Share2 size={15} />
            <span>{copyNotification ? 'Copied link!' : 'Share Profile'}</span>
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
                {user.role === 'admin' ? 'Platform Admin' : user.role === 'creator' ? 'Tool Creator' : 'Community Member'}
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
              {user.website && (
                <a
                  href={user.website}
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
                <span>Joined {user.joinedDate || 'Recently'}</span>
              </div>
              <div className={`${styles.metaItem} ${styles.reputationItem}`}>
                <Award size={13} />
                <span>{user.reputation || 100} Rep</span>
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
          <span>Saved Tools</span>
          <span className={styles.tabCounter}>{savedTools.length}</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'submitted' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('submitted')}
        >
          <Sparkles size={15} />
          <span>Submitted Tools</span>
          <span className={styles.tabCounter}>{submittedTools.length}</span>
        </button>
      </div>

      {/* Tab Content Section */}
      <div className={styles.contentSection}>
        {isLoadingTools ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p>Loading tools...</p>
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
              <h3>No saved tools yet</h3>
              <p>Tools you bookmark while browsing will appear here for easy reference.</p>
              <button type="button" className={styles.browseBtn} onClick={onBack}>
                Explore AI Directory
              </button>
            </div>
          )
        ) : submittedTools.length > 0 ? (
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
            <h3>No tools submitted yet</h3>
            <p>Tools created or verified by this user will be listed here.</p>
          </div>
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
                <span className={styles.modalTitle}>Edit Profile</span>
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
                  <label className={styles.label}>Full Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Tahsin Can"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Avatar Initials</label>
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
                <label className={styles.label}>Professional Title</label>
                <input
                  type="text"
                  className={styles.input}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Lead AI Engineer & Product Architect"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>About / Bio</label>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Share a short bio about what you're building or exploring..."
                />
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Location</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="e.g. Istanbul, Turkey"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Website / GitHub URL</label>
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
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

