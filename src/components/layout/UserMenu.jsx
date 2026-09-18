import React, { useState, useEffect } from 'react';
import {
  Building2,
  CheckCircle2,
  ShieldAlert,
  Bot,
  Plus,
  X,
  ExternalLink,
  ShieldCheck,
  User,
  LogOut,
  Settings,
  LayoutDashboard,
  LogIn,
} from 'lucide-react';
import {
  getCurrentUser,
  getOrganizations,
  adminCreateOrganization,
} from '@/services/userService';
import { logout } from '@/services/authService';
import styles from './UserMenu.module.scss';

export default function UserMenu({ onOpenProfile, onOpenAdmin, onOpenSettings, onOpenAuth, onUserChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [user, setUser] = useState(getCurrentUser());
  const [organizations, setOrganizations] = useState(getOrganizations());

  // New Organization Form (Admin creation)
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgWebsite, setNewOrgWebsite] = useState('');

  useEffect(() => {
    setUser(getCurrentUser());
  }, [isOpen, isOrgModalOpen]);

  const handleCreateOrg = (e) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    const created = adminCreateOrganization({
      name: newOrgName.trim(),
      website: newOrgWebsite.trim() || 'https://example.com',
      description: 'Verified organization registered via Guidora Admin Portal.',
    });

    setOrganizations(getOrganizations());
    setNewOrgName('');
    setNewOrgWebsite('');
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    if (onOpenProfile) {
      onOpenProfile(user?.id);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setIsOpen(false);
    if (onUserChange) onUserChange(null);
  };

  // If NOT logged in, show sleek "Sign In" button!
  if (!user) {
    return (
      <button
        type="button"
        className={styles.loginTriggerBtn}
        onClick={() => onOpenAuth && onOpenAuth('welcome')}
        title="Sign In to Guidora"
      >
        <LogIn size={15} />
        <span>Sign In</span>
      </button>
    );
  }

  return (
    <div className={styles.dropdownWrapper}>
      {/* Trigger: User Avatar */}
      <button
        type="button"
        className={`${styles.avatarTrigger} ${isOpen ? styles.triggerActive : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={`${user?.name || 'User'} (${user?.role || 'Member'})`}
        aria-label="User menu"
      >
        {user?.avatar || 'TC'}
      </button>

      {/* Dropdown Backdrop */}
      {isOpen && (
        <div className={styles.menuBackdrop} onClick={() => setIsOpen(false)} />
      )}

      {/* User Dropdown Menu */}
      {isOpen && (
        <div className={styles.menuDropdown}>
          {/* User Card Header */}
          <div
            className={styles.userCardHeader}
            onClick={handleProfileClick}
            style={{ cursor: 'pointer' }}
            title="View full profile"
          >
            <div className={styles.largeAvatar}>{user?.avatar || 'TC'}</div>
            <div className={styles.userDetails}>
              <div className={styles.userNameRow}>
                <span className={styles.userName}>{user?.name || 'Tahsin Cr'}</span>
                {user?.role === 'admin' && (
                  <span className={styles.adminBadge}>
                    <ShieldCheck size={10} />
                    Admin
                  </span>
                )}
              </div>
              <span className={styles.userEmail}>{user?.email || 'tahsincrs@gmail.com'}</span>
            </div>
          </div>

          {/* Action List */}
          <div className={styles.actionList}>
            <button
              type="button"
              className={styles.menuItem}
              onClick={handleProfileClick}
            >
              <User size={15} />
              <span>View Profile</span>
            </button>

            {user?.role === 'admin' && (
              <button
                type="button"
                className={`${styles.menuItem} ${styles.adminMenuItem}`}
                onClick={() => {
                  setIsOpen(false);
                  if (onOpenAdmin) onOpenAdmin();
                }}
              >
                <LayoutDashboard size={15} color="var(--primary-color)" />
                <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>
                  Admin Dashboard
                </span>
              </button>
            )}

            <button
              type="button"
              className={styles.menuItem}
              onClick={() => {
                setIsOpen(false);
                setIsOrgModalOpen(true);
              }}
            >
              <Building2 size={15} />
              <span>Organizations & Verification</span>
            </button>

            <button
              type="button"
              className={styles.menuItem}
              onClick={() => {
                setIsOpen(false);
                if (onOpenSettings) onOpenSettings();
              }}
            >
              <Settings size={15} />
              <span>Account Settings</span>
            </button>

            <div className={styles.divider} />

            <button
              type="button"
              className={styles.menuItem}
              onClick={handleLogout}
            >
              <LogOut size={15} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}

      {/* Organization & Verification Modal */}
      {isOrgModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOrgModalOpen(false);
          }}
        >
          <div className={styles.modalContent} role="dialog" aria-modal="true">
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrap}>
                <Building2 size={18} color="var(--primary-color)" />
                <span className={styles.modalTitle}>Organizations & Verification</span>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsOrgModalOpen(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Informational Policy Notice */}
              <div className={styles.infoNotice}>
                <ShieldCheck size={18} className={styles.infoIcon} />
                <div className={styles.infoText}>
                  <strong>Platform Verification Policy:</strong> Organizations cannot be registered via regular tool submission. They are strictly verified through <strong>Admin Approval</strong> or future <strong>Automated Bot Verification</strong> hooks to guarantee trust and credibility across Guidora.
                </div>
              </div>

              {/* Verified Organizations List */}
              <div className={styles.orgListWrap}>
                {organizations.map((org) => (
                  <div key={org.id} className={styles.orgListItem}>
                    <div className={styles.itemAvatar}>{org.initials}</div>
                    <div className={styles.itemInfo}>
                      <div className={styles.itemTitleRow}>
                        <span className={styles.itemName}>{org.name}</span>
                        {org.verified && (
                          <CheckCircle2 size={13} color="#10B981" title="Verified Organization" />
                        )}
                      </div>
                      <span className={styles.itemDesc}>{org.description}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Admin-only Organization Registration */}
              {user?.role === 'admin' && (
                <form className={styles.addOrgForm} onSubmit={handleCreateOrg}>
                  <span className={styles.formTitle}>Add Verified Organization (Admin Only)</span>
                  <div className={styles.formRow}>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="Organization Name (e.g. Mistral AI)"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                      required
                    />
                    <input
                      type="url"
                      className={styles.formInput}
                      placeholder="Website URL"
                      value={newOrgWebsite}
                      onChange={(e) => setNewOrgWebsite(e.target.value)}
                    />
                    <button type="submit" className={styles.createOrgBtn}>
                      Add Org
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

