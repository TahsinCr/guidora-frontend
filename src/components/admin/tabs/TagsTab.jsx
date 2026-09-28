import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Globe,
  Sliders,
  FolderPlus,
  Search,
} from 'lucide-react';
import {
  adminGetTagCategories,
  adminAddTag,
  adminUpdateTag,
  adminDeleteTag,
  adminAddTagCategory,
  adminUpdateTagCategory,
  adminDeleteTagCategory,
  adminAddLog,
} from '@/services/adminService';
import UnifiedTranslationModal from '@/components/common/UnifiedTranslationModal';
import styles from '../AdminDashboardPage.module.scss';

export default function TagsTab({
  tagCategories = [],
  onRefreshTags,
}) {
  const [search, setSearch] = useState('');
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [addMode, setAddMode] = useState('tag'); // 'tag' | 'group'
  const [selectedGroupId, setSelectedGroupId] = useState(tagCategories[0]?.id || 'pricing');
  const [tagName, setTagName] = useState('');

  // New Group fields
  const [groupName, setGroupName] = useState('');
  const [groupSingleSelect, setGroupSingleSelect] = useState(false);

  // Translation Modal State
  const [transModalOpen, setTransModalOpen] = useState(false);
  const [transTarget, setTransTarget] = useState(null); // { item, type: 'tag' | 'tag_category' }

  // Handle Add Tag / Group
  const handleSaveTagOrGroup = (e) => {
    e.preventDefault();
    try {
      if (addMode === 'tag') {
        if (!tagName.trim()) {
          alert('Etiket adı zorunludur.');
          return;
        }
        adminAddTag(selectedGroupId, { name: tagName.trim() });
        adminAddLog('TAG_CREATED', `${tagName.trim()} (${selectedGroupId})`, 'info', {
          category: 'CATALOG',
        });
      } else {
        if (!groupName.trim()) {
          alert('Grup adı zorunludur.');
          return;
        }
        adminAddTagCategory({
          name: groupName.trim(),
          isSingleSelect: groupSingleSelect,
        });
        adminAddLog('TAG_CATEGORY_CREATED', groupName.trim(), 'success', {
          category: 'CATALOG',
        });
      }
      setTagModalOpen(false);
      setTagName('');
      setGroupName('');
      if (onRefreshTags) onRefreshTags();
    } catch (err) {
      alert('Hata: ' + err.message);
    }
  };

  const handleDeleteTag = (groupId, tagId, name) => {
    if (window.confirm(`"${name}" etiketini silmek istediğinize emin misiniz?`)) {
      try {
        adminDeleteTag(groupId, tagId);
        adminAddLog('TAG_DELETED', name, 'warning', { category: 'CATALOG' });
        if (onRefreshTags) onRefreshTags();
      } catch (err) {
        alert('Hata: ' + err.message);
      }
    }
  };

  const handleDeleteGroup = (group) => {
    if (window.confirm(`"${group.name}" etiket grubunu ve içindeki tüm etiketleri silmek istediğinize emin misiniz?`)) {
      try {
        adminDeleteTagCategory(group.id);
        adminAddLog('TAG_CATEGORY_DELETED', group.name, 'warning', { category: 'CATALOG' });
        if (onRefreshTags) onRefreshTags();
      } catch (err) {
        alert('Hata: ' + err.message);
      }
    }
  };

  const handleToggleSingleSelect = (group) => {
    try {
      adminUpdateTagCategory(group.id, { isSingleSelect: !group.isSingleSelect });
      if (onRefreshTags) onRefreshTags();
    } catch (err) {
      alert('Hata: ' + err.message);
    }
  };

  // Translations
  const handleOpenTranslate = (item, type) => {
    setTransTarget({ item, type });
    setTransModalOpen(true);
  };

  const handleSaveTranslations = (newTranslations) => {
    if (!transTarget) return;
    const { item, type } = transTarget;

    if (type === 'tag_category') {
      adminUpdateTagCategory(item.id, { translations: newTranslations });
    } else {
      adminUpdateTag(item.groupId, item.id, { translations: newTranslations });
    }
    setTransModalOpen(false);
    setTransTarget(null);
    if (onRefreshTags) onRefreshTags();
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
            placeholder="Etiket veya etiket grubu ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          type="button"
          className={styles.actionBtnPrimary}
          onClick={() => {
            setAddMode('tag');
            setTagModalOpen(true);
          }}
        >
          <Plus size={16} />
          <span>Etiket / Grup Ekle</span>
        </button>
      </div>

      {/* Tag Groups Accordion / Grid */}
      <div className={styles.tagGroupsList}>
        {tagCategories.map((group) => {
          const filteredTags = (group.tags || []).filter((tg) =>
            search ? tg.name.toLowerCase().includes(search.toLowerCase()) : true
          );

          return (
            <div key={group.id} className={styles.tagGroupCard}>
              <div className={styles.tagGroupHeader}>
                <div className={styles.tagGroupTitleBlock}>
                  <Tag size={17} className={styles.groupIcon} />
                  <div>
                    <h3 className={styles.groupTitleName}>{group.name}</h3>
                    <code className={styles.groupIdCode}>ID: {group.id}</code>
                  </div>
                  <span className={group.isSingleSelect ? styles.pillSingle : styles.pillMulti}>
                    {group.isSingleSelect ? 'Tekli Seçim (Radio)' : 'Çoklu Seçim (Checkbox)'}
                  </span>
                </div>

                <div className={styles.groupActions}>
                  <button
                    type="button"
                    className={styles.groupActionBtn}
                    onClick={() => handleToggleSingleSelect(group)}
                    title="Tekli / Çoklu Seçim Modunu Değiştir"
                  >
                    <Sliders size={13} />
                    <span>{group.isSingleSelect ? 'Çokluya Çevir' : 'Tekliye Çevir'}</span>
                  </button>

                  <button
                    type="button"
                    className={styles.groupActionBtn}
                    onClick={() => handleOpenTranslate(group, 'tag_category')}
                    title="Grup Adı Çevirileri"
                  >
                    <Globe size={13} />
                    <span>Çeviriler</span>
                  </button>

                  <button
                    type="button"
                    className={styles.groupActionBtnDanger}
                    onClick={() => handleDeleteGroup(group)}
                    title="Tüm Grubu Sil"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Tags Pills within Group */}
              <div className={styles.tagsPillContainer}>
                {filteredTags.length === 0 ? (
                  <span className={styles.noTagsNotice}>Bu grupta etiket bulunamadı.</span>
                ) : (
                  filteredTags.map((tg) => (
                    <div key={tg.id} className={styles.tagPillBadge}>
                      <span className={styles.tagPillName}>#{tg.name}</span>

                      <button
                        type="button"
                        className={styles.tagIconBtn}
                        onClick={() => handleOpenTranslate({ ...tg, groupId: group.id }, 'tag')}
                        title="Etiket Çevirisi"
                      >
                        <Globe size={11} />
                      </button>

                      <button
                        type="button"
                        className={styles.tagIconBtnDanger}
                        onClick={() => handleDeleteTag(group.id, tg.id, tg.name)}
                        title="Etiketi Sil"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Tag or Tag Group Modal */}
      {tagModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setTagModalOpen(false)} role="dialog" aria-modal="true">
          <div className={`${styles.modalContainer} ${styles.simpleModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTabsRow}>
                <button
                  type="button"
                  className={`${styles.modalTabBtn} ${addMode === 'tag' ? styles.active : ''}`}
                  onClick={() => setAddMode('tag')}
                >
                  <Tag size={15} />
                  <span>Etiket Ekle</span>
                </button>
                <button
                  type="button"
                  className={`${styles.modalTabBtn} ${addMode === 'group' ? styles.active : ''}`}
                  onClick={() => setAddMode('group')}
                >
                  <FolderPlus size={15} />
                  <span>Yeni Grup Oluştur</span>
                </button>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setTagModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTagOrGroup}>
              <div className={styles.modalBody}>
                {addMode === 'tag' ? (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Hedef Grup *</label>
                      <select
                        className={styles.formSelect}
                        value={selectedGroupId}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                      >
                        {tagCategories.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name} ({g.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Etiket Adı *</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        placeholder="örn. Claude 3.5, Open-Source, Enterprise"
                        value={tagName}
                        onChange={(e) => setTagName(e.target.value)}
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Grup Başlığı *</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        placeholder="örn. Model Ailesi, Lisans Türü"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        required
                      />
                    </div>

                    <div className={styles.checkboxGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={groupSingleSelect}
                          onChange={(e) => setGroupSingleSelect(e.target.checked)}
                        />
                        <span>Tekli Seçim (Kullanıcı bu gruptan yalnızca 1 etiket seçebilir)</span>
                      </label>
                    </div>
                  </>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setTagModalOpen(false)}
                >
                  İptal
                </button>
                <button type="submit" className={styles.confirmBtn}>
                  {addMode === 'tag' ? 'Etiketi Ekle' : 'Grubu Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Translations Modal */}
      {transModalOpen && transTarget && (
        <UnifiedTranslationModal
          isOpen={transModalOpen}
          itemType={transTarget.type}
          title={`Çeviri: ${transTarget.item.name}`}
          baseName={transTarget.item.name}
          initialValues={transTarget.item.translations || {}}
          onSave={handleSaveTranslations}
          onClose={() => {
            setTransModalOpen(false);
            setTransTarget(null);
          }}
        />
      )}
    </div>
  );
}
