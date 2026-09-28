import React, { useState } from 'react';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Globe,
  Sparkles,
  CheckCircle2,
  Search,
} from 'lucide-react';
import {
  adminAddCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminAddLog,
} from '@/services/adminService';
import UnifiedTranslationModal from '@/components/common/UnifiedTranslationModal';
import styles from '../AdminDashboardPage.module.scss';

export default function CategoriesTab({
  categories = [],
  tools = [],
  onRefreshCategories,
}) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState('#8A38F5');
  const [catPopular, setCatPopular] = useState(false);

  // Translation Modal State
  const [transModalOpen, setTransModalOpen] = useState(false);
  const [transTarget, setTransTarget] = useState(null);

  const filteredCategories = categories.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.id || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingCat(null);
    setCatName('');
    setCatColor('#8A38F5');
    setCatPopular(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatColor(cat.color || '#8A38F5');
    setCatPopular(Boolean(cat.popular));
    setModalOpen(true);
  };

  const handleSaveCategory = (e) => {
    e.preventDefault();
    if (!catName.trim()) {
      alert('Kategori adı zorunludur.');
      return;
    }

    try {
      if (editingCat) {
        adminUpdateCategory(editingCat.id, {
          name: catName.trim(),
          color: catColor,
          popular: catPopular,
        });
        adminAddLog('CATEGORY_UPDATED', catName.trim(), 'info', {
          entityName: 'Category',
          entityId: editingCat.id,
          category: 'CATALOG',
        });
      } else {
        adminAddCategory({
          name: catName.trim(),
          color: catColor,
          popular: catPopular,
        });
        adminAddLog('CATEGORY_CREATED', catName.trim(), 'success', {
          entityName: 'Category',
          category: 'CATALOG',
        });
      }
      setModalOpen(false);
      if (onRefreshCategories) onRefreshCategories();
    } catch (err) {
      alert('Hata: ' + err.message);
    }
  };

  const handleDeleteCategory = (cat) => {
    if (cat.id === 'all') {
      alert('Kök "Tüm Araçlar" kategorisi silinemez.');
      return;
    }
    if (window.confirm(`"${cat.name}" kategorisini silmek istediğinize emin misiniz?`)) {
      try {
        adminDeleteCategory(cat.id);
        adminAddLog('CATEGORY_DELETED', cat.name, 'warning', {
          entityName: 'Category',
          entityId: cat.id,
          category: 'CATALOG',
        });
        if (onRefreshCategories) onRefreshCategories();
      } catch (err) {
        alert('Hata: ' + err.message);
      }
    }
  };

  // Open Translations
  const handleOpenTranslate = (cat) => {
    setTransTarget(cat);
    setTransModalOpen(true);
  };

  const handleSaveTranslations = (newTranslations) => {
    if (!transTarget) return;
    adminUpdateCategory(transTarget.id, { translations: newTranslations });
    adminAddLog('CATEGORY_TRANSLATED', transTarget.name, 'info', {
      entityName: 'Category',
      entityId: transTarget.id,
      category: 'CATALOG',
      newValues: newTranslations,
    });
    setTransModalOpen(false);
    setTransTarget(null);
    if (onRefreshCategories) onRefreshCategories();
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
            placeholder="Kategori ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          type="button"
          className={styles.actionBtnPrimary}
          onClick={handleOpenAdd}
        >
          <Plus size={16} />
          <span>Yeni Kategori Ekle</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className={styles.categoriesGrid}>
        {filteredCategories.map((cat) => {
          const toolCount = tools.filter((t) => t.category === cat.id).length;

          return (
            <div key={cat.id} className={styles.categoryCard}>
              <div className={styles.catCardTop}>
                <div
                  className={styles.catColorCircle}
                  style={{ backgroundColor: cat.color || '#6366f1' }}
                />
                <div className={styles.catCardInfo}>
                  <h4 className={styles.catCardName}>{cat.name}</h4>
                  <code className={styles.catIdCode}>{cat.id}</code>
                </div>
                {cat.popular && (
                  <span className={styles.popularBadge}>
                    <Sparkles size={11} /> Popüler
                  </span>
                )}
              </div>

              <div className={styles.catCardStats}>
                <span>İlişkili Araç: <strong>{toolCount}</strong></span>
                <span className={styles.catHex}>{cat.color || '#6366f1'}</span>
              </div>

              <div className={styles.catCardActions}>
                <button
                  type="button"
                  className={styles.catActionBtn}
                  onClick={() => handleOpenTranslate(cat)}
                  title="Çok Dilli Çevirileri Yönet (TR / EN / RU)"
                >
                  <Globe size={14} />
                  <span>Çeviriler</span>
                </button>

                <button
                  type="button"
                  className={styles.catActionBtn}
                  onClick={() => handleOpenEdit(cat)}
                  title="Kategoriyi Düzenle"
                >
                  <Edit2 size={14} />
                  <span>Düzenle</span>
                </button>

                {cat.id !== 'all' && (
                  <button
                    type="button"
                    className={styles.catActionBtnDanger}
                    onClick={() => handleDeleteCategory(cat)}
                    title="Kategoriyi Sil"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)} role="dialog" aria-modal="true">
          <div className={`${styles.modalContainer} ${styles.simpleModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingCat ? `Kategoriyi Düzenle: ${editingCat.name}` : 'Yeni Kategori Oluştur'}
              </h2>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Kategori Adı *</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="örn. Generative Art, Geliştirici Araçları"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Vurgu Rengi (Hex)</label>
                  <div className={styles.colorInputRow}>
                    <input
                      type="color"
                      className={styles.colorPicker}
                      value={catColor}
                      onChange={(e) => setCatColor(e.target.value)}
                    />
                    <input
                      type="text"
                      className={styles.formInput}
                      value={catColor}
                      onChange={(e) => setCatColor(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.checkboxGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={catPopular}
                      onChange={(e) => setCatPopular(e.target.checked)}
                    />
                    <span>Popüler Kategori (Slider ve anasayfada öne çıkar)</span>
                  </label>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setModalOpen(false)}
                >
                  İptal
                </button>
                <button type="submit" className={styles.confirmBtn}>
                  {editingCat ? 'Güncelle' : 'Oluştur'}
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
          itemType="category"
          title={`Kategori Çevirisi: ${transTarget.name}`}
          baseName={transTarget.name}
          initialValues={transTarget.translations || {}}
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
