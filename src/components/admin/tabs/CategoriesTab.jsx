import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Globe,
  Sparkles,
  Search,
  X,
} from 'lucide-react';
import {
  adminAddCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminAddLog,
} from '@/services/adminService';
import { getCategoryIcon } from '@/constants/categoryIcons';
import { useLanguage } from '@/context/LanguageContext';
import toastService from '@/services/toast/toastService';
import UnifiedTranslationModal from '@/components/common/UnifiedTranslationModal';
import AdminConfirmModal from '../modals/AdminConfirmModal';
import styles from '../AdminDashboardPage.module.scss';

export default function CategoriesTab({
  categories = [],
  tools = [],
  globalSearch = '',
  onRefreshCategories,
}) {
  const { lang } = useLanguage();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState('#8A38F5');
  const [catPopular, setCatPopular] = useState(false);

  // Translation Modal State
  const [transModalOpen, setTransModalOpen] = useState(false);
  const [transTarget, setTransTarget] = useState(null);

  // In-App Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
    confirmText: 'Sil',
    onConfirm: () => {},
  });

  const filteredCategories = categories
    .filter((c) => c.id !== 'all')
    .filter((c) => {
      const q = (search || globalSearch || '').trim().toLowerCase();
      if (q) {
        const localName = (c.translations?.[lang] || '').toLowerCase();
        return (
          (c.name || '').toLowerCase().includes(q) ||
          localName.includes(q) ||
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
    setCatPopular(Boolean(cat.popular || cat.isPopular));
    setModalOpen(true);
  };

  const handleSaveCategory = (e) => {
    e.preventDefault();
    if (!catName.trim()) {
      toastService.warning('Kategori adı zorunludur.');
      return;
    }

    try {
      if (editingCat) {
        adminUpdateCategory(editingCat.id, {
          name: catName.trim(),
          color: catColor,
          popular: catPopular,
          isPopular: catPopular,
        });
        adminAddLog('CATEGORY_UPDATED', catName.trim(), 'info', {
          entityName: 'Category',
          entityId: editingCat.id,
          category: 'CATALOG',
        });
        toastService.success(`"${catName}" kategorisi güncellendi.`);
      } else {
        adminAddCategory({
          name: catName.trim(),
          color: catColor,
          popular: catPopular,
          isPopular: catPopular,
        });
        adminAddLog('CATEGORY_CREATED', catName.trim(), 'success', {
          entityName: 'Category',
          category: 'CATALOG',
        });
        toastService.success(`"${catName}" kategorisi oluşturuldu.`);
      }
      setModalOpen(false);
      if (onRefreshCategories) onRefreshCategories();
    } catch (err) {
      toastService.error('Hata: ' + err.message);
    }
  };

  const handleDeleteCategory = (cat) => {
    if (cat.id === 'all') {
      toastService.warning('Kök "Tüm Araçlar" kategorisi silinemez.');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Kategoriyi Sil',
      message: `"${cat.name}" kategorisini silmek istediğinize emin misiniz? Bu kategoriye bağlı araçlar etkilenebilir.`,
      variant: 'danger',
      confirmText: 'Kategoriyi Sil',
      onConfirm: () => {
        try {
          adminDeleteCategory(cat.id);
          adminAddLog('CATEGORY_DELETED', cat.name, 'warning', {
            entityName: 'Category',
            entityId: cat.id,
            category: 'CATALOG',
          });
          toastService.success(`"${cat.name}" kategorisi silindi.`);
          if (onRefreshCategories) onRefreshCategories();
        } catch (err) {
          toastService.error('Hata: ' + err.message);
        }
      },
    });
  };

  // Open Translations
  const handleOpenTranslate = (cat) => {
    setTransTarget(cat);
    setTransModalOpen(true);
  };

  const handleSaveTranslations = (newTranslations) => {
    if (!transTarget) return;
    try {
      adminUpdateCategory(transTarget.id, { translations: newTranslations });
      adminAddLog('CATEGORY_TRANSLATED', transTarget.name, 'info', {
        entityName: 'Category',
        entityId: transTarget.id,
        category: 'CATALOG',
        newValues: newTranslations,
      });
      toastService.success(`"${transTarget.name}" çevirileri kaydedildi.`);
      setTransModalOpen(false);
      setTransTarget(null);
      if (onRefreshCategories) onRefreshCategories();
    } catch (err) {
      toastService.error('Çeviri kaydetme hatası: ' + err.message);
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
            placeholder="Kategori adı veya slug ara..."
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
          const CatIcon = getCategoryIcon(cat.id);
          const localizedTitle = cat.translations?.[lang] || cat.name;
          const toolCount = tools.filter((t) => {
            const catIdLower = String(cat.id || '').toLowerCase();
            const catNameLower = String(cat.name || '').toLowerCase();
            const toolCatLower = String(t.category || '').toLowerCase();
            const toolCatIdLower = String(t.categoryId || '').toLowerCase();
            return (
              toolCatLower === catIdLower ||
              toolCatLower === catNameLower ||
              toolCatIdLower === catIdLower ||
              toolCatIdLower === catNameLower
            );
          }).length;

          return (
            <div key={cat.id} className={styles.categoryCard}>
              <div className={styles.catCardTop}>
                <div
                  className={styles.catColorCircle}
                  style={{
                    background: `linear-gradient(135deg, ${cat.color || '#6366f1'}, ${cat.color || '#6366f1'}cc)`,
                    boxShadow: `0 6px 16px -4px ${cat.color || '#6366f1'}66`,
                  }}
                >
                  <CatIcon size={18} color="#ffffff" />
                </div>
                <div className={styles.catCardInfo}>
                  <h4 className={styles.catCardName}>{localizedTitle}</h4>
                  <code className={styles.catIdCode}>
                    {cat.id}
                    {localizedTitle !== cat.name ? ` • ${cat.name}` : ''}
                  </code>
                </div>
                {(cat.popular || cat.isPopular) && (
                  <span className={styles.popularBadge}>
                    <Sparkles size={11} /> Popüler
                  </span>
                )}
              </div>

              <div className={styles.catCardStats}>
                <span>İlişkili Araç: <strong>{toolCount}</strong></span>
                <span className={styles.catHex} style={{ color: cat.color || '#6366f1' }}>
                  {cat.color || '#6366f1'}
                </span>
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

                <button
                  type="button"
                  className={styles.catActionBtnDanger}
                  onClick={() => handleDeleteCategory(cat)}
                  title="Kategoriyi Sil"
                >
                  <Trash2 size={14} />
                </button>
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
                aria-label="Kapat"
              >
                <X size={18} />
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
                <button type="submit" className={styles.confirmBtnPrimary}>
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

      {/* In-App Confirmation Modal */}
      <AdminConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
