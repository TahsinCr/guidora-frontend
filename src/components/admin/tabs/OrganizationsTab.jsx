import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  ExternalLink,
  ShieldCheck,
  Trash2,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import {
  getOrganizations,
  adminCreateOrganization,
  adminDeleteOrganization,
  adminToggleOrgVerification,
} from '@/services/userService';
import { adminAddLog } from '@/services/adminService';
import styles from '../AdminDashboardPage.module.scss';

export default function OrganizationsTab({
  organizations = [],
  onRefreshOrgs,
}) {
  const [search, setSearch] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');

  const filteredOrgs = organizations.filter((org) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        org.name.toLowerCase().includes(q) ||
        (org.website || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateOrg = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Kuruluş adı zorunludur.');
      return;
    }
    try {
      adminCreateOrganization({
        name: name.trim(),
        website: website.trim(),
        description: description.trim(),
      });
      adminAddLog('ORGANIZATION_CREATED', name.trim(), 'success', {
        entityName: 'Organization',
        category: 'GOVERNANCE',
      });
      setAddModalOpen(false);
      setName('');
      setWebsite('');
      setDescription('');
      if (onRefreshOrgs) onRefreshOrgs();
    } catch (err) {
      alert('Hata: ' + err.message);
    }
  };

  const handleToggleVerify = (org) => {
    try {
      const nextVer = !org.isVerified;
      adminToggleOrgVerification(org.id);
      adminAddLog(
        nextVer ? 'ORGANIZATION_VERIFIED' : 'ORGANIZATION_UNVERIFIED',
        org.name,
        nextVer ? 'success' : 'warning',
        { entityName: 'Organization', entityId: org.id, category: 'GOVERNANCE' }
      );
      if (onRefreshOrgs) onRefreshOrgs();
    } catch (err) {
      alert('Hata: ' + err.message);
    }
  };

  const handleDeleteOrg = (org) => {
    if (window.confirm(`"${org.name}" kuruluşunu silmek istediğinize emin misiniz?`)) {
      try {
        adminDeleteOrganization(org.id);
        adminAddLog('ORGANIZATION_DELETED', org.name, 'warning', {
          entityName: 'Organization',
          entityId: org.id,
          category: 'GOVERNANCE',
        });
        if (onRefreshOrgs) onRefreshOrgs();
      } catch (err) {
        alert('Hata: ' + err.message);
      }
    }
  };

  return (
    <div className={styles.tabContent}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Kuruluş veya web sitesi ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          type="button"
          className={styles.actionBtnPrimary}
          onClick={() => setAddModalOpen(true)}
        >
          <Plus size={16} />
          <span>Yeni Kuruluş Ekle</span>
        </button>
      </div>

      {/* Organizations Grid */}
      <div className={styles.orgsGrid}>
        {filteredOrgs.map((org) => (
          <div key={org.id} className={styles.orgCard}>
            <div className={styles.orgCardTop}>
              <div className={styles.orgAvatar}>
                <Building2 size={20} />
              </div>
              <div className={styles.orgInfo}>
                <h4 className={styles.orgName}>
                  {org.name}
                  {org.isVerified && (
                    <span className={styles.verifiedCheck} title="Doğrulanmış Üretici">
                      <ShieldCheck size={14} color="#10b981" />
                    </span>
                  )}
                </h4>
                {org.website && (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.orgLink}
                  >
                    <Globe size={12} />
                    <span>{org.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
              </div>
            </div>

            <p className={styles.orgDesc}>
              {org.description || 'Kuruluş hakkında ayrıntılı açıklama bulunmuyor.'}
            </p>

            <div className={styles.orgCardActions}>
              <button
                type="button"
                className={`${styles.orgVerifyBtn} ${org.isVerified ? styles.verified : ''}`}
                onClick={() => handleToggleVerify(org)}
              >
                <ShieldCheck size={14} />
                <span>{org.isVerified ? 'Doğrulamayı Kaldır' : 'Doğrula'}</span>
              </button>

              <button
                type="button"
                className={styles.actionIconBtnDanger}
                onClick={() => handleDeleteOrg(org)}
                title="Kuruluşu Sil"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Org Modal */}
      {addModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setAddModalOpen(false)} role="dialog" aria-modal="true">
          <div className={`${styles.modalContainer} ${styles.simpleModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Yeni Yapay Zeka Kuruluşu Ekle</h2>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setAddModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrg}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Kuruluş Adı *</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="örn. Anthropic, OpenAI, Mistral AI"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Web Sitesi URL</label>
                  <input
                    type="url"
                    className={styles.formInput}
                    placeholder="https://..."
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Açıklama</label>
                  <textarea
                    className={styles.formTextarea}
                    rows={3}
                    placeholder="Kuruluş hakkında kısa tanıtım"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setAddModalOpen(false)}
                >
                  İptal
                </button>
                <button type="submit" className={styles.confirmBtn}>
                  Kuruluşu Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
