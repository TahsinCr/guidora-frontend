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
} from 'lucide-react';
import {
  getCurrentUser,
  getOrganizations,
  getOrganizationById,
  adminCreateOrganization,
} from '@/services/userService';
import styles from './UserMenu.module.scss';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [user, setUser] = useState(getCurrentUser());
  const [organizations, setOrganizations] = useState(getOrganizations());
  const [userOrg, setUserOrg] = useState(null);

  // New Organization Form (Admin creation)
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgWebsite, setNewOrgWebsite] = useState('');

  useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
    if (u?.organizationId) {
      setUserOrg(getOrganizationById(u.organizationId));
    }
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
          <div className={styles.userCardHeader}>
            <div className={styles.largeAvatar}>{user?.avatar || 'TC'}</div>
            <div className={styles.userDetails}>
              <div className={styles.userNameRow}>
                <span className={styles.userName}>{user?.name || 'Tahsin Can'}</span>
                {user?.role === 'admin' && (
                  <span className={styles.adminBadge}>
                    <ShieldCheck size={10} />
                    Admin
                  </span>
                )}
              </div>
              <span className={styles.userEmail}>{user?.email || 'tahsin@guidora.io'}</span>
            </div>
          </div>

          {/* Connected Organization Section */}
          <div className={styles.orgSection}>
            <div className={styles.orgLabel}>Organization</div>
            {userOrg ? (
              <div className={styles.orgCard}>
                <div className={styles.orgBadge}>{userOrg.initials}</div>
                <div className={styles.orgMeta}>
                  <div className={styles.orgNameRow}>
                    <span className={styles.orgName}>{userOrg.name}</span>
                    {userOrg.verified && (
                      <CheckCircle2 size={12} color="#10B981" title="Verified Organization" />
                    )}
                  </div>
                  <span className={styles.orgStatus}>
                    {userOrg.verificationSource === 'admin' ? 'Admin Verified' : 'Bot Verified'}
                  </span>
                </div>
              </div>
            ) : (
              <span className={styles.orgStatus}>No organization assigned</span>
            )}
          </div>

          {/* Action List */}
          <div className={styles.actionList}>
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
              onClick={() => setIsOpen(false)}
            >
              <Settings size={15} />
              <span>Account Settings</span>
            </button>

            <div className={styles.divider} />

            <button
              type="button"
              className={styles.menuItem}
              onClick={() => setIsOpen(false)}
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
