import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Plus,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';
import {
  adminUpdateTool,
  adminDeleteTool,
  adminRestoreTool,
  getDeletedToolIds,
  adminAddLog,
} from '@/services/adminService';
import ToolStudioForm from '@/components/common/ToolStudioForm';
import styles from '../AdminDashboardPage.module.scss';

export default function ToolsTab({
  tools = [],
  categories = [],
  onRefreshTools,
  onOpenTool,
}) {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'verified' | 'unverified' | 'deleted'
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingTool, setEditingTool] = useState(null);
  const [isSavingStudio, setIsSavingStudio] = useState(false);

  const deletedIds = useMemo(() => getDeletedToolIds(), [tools]);

  // Enriched tools with deletion state
  const enrichedTools = useMemo(() => {
    return tools.map((t) => ({
      ...t,
      isDeleted: deletedIds.includes(t.id),
      isVerified: Boolean(t.verified?.admin || t.verified?.audited || t.verified),
    }));
  }, [tools, deletedIds]);

  // Filter tools
  const filteredTools = useMemo(() => {
    return enrichedTools.filter((t) => {
      // Category filter
      if (selectedCat !== 'all' && t.category !== selectedCat) {
        return false;
      }
      // Status filter
      if (statusFilter === 'verified' && (!t.isVerified || t.isDeleted)) return false;
      if (statusFilter === 'unverified' && (t.isVerified || t.isDeleted)) return false;
      if (statusFilter === 'deleted' && !t.isDeleted) return false;
      if (statusFilter !== 'deleted' && t.isDeleted) return false;

      // Search query
      if (search) {
        const q = search.toLowerCase();
        const nameMatch = (t.name || '').toLowerCase().includes(q);
        const descMatch = (t.tagline || t.description || '').toLowerCase().includes(q);
        const tagMatch = (t.tags || []).some((tg) => tg.toLowerCase().includes(q));
        if (!nameMatch && !descMatch && !tagMatch) return false;
      }

      return true;
    });
  }, [enrichedTools, selectedCat, statusFilter, search]);

  // Toggle Verification status
  const handleToggleVerify = (tool) => {
    const nextVerified = !tool.isVerified;
    const oldValues = { verified: tool.verified };
    const newValues = {
      verified: {
        admin: nextVerified,
        audited: nextVerified,
        featured: Boolean(tool.verified?.featured),
      },
    };

    adminUpdateTool(tool.id, newValues);
    adminAddLog(
      nextVerified ? 'TOOL_VERIFIED' : 'TOOL_UNVERIFIED',
      tool.name,
      nextVerified ? 'success' : 'warning',
      {
        entityName: 'Product',
        entityId: tool.id,
        category: 'CATALOG',
        oldValues,
        newValues,
      }
    );
    if (onRefreshTools) onRefreshTools();
  };

  // Soft delete / restore
  const handleToggleDelete = (tool) => {
    if (tool.isDeleted) {
      adminRestoreTool(tool.id);
      adminAddLog('TOOL_RESTORED', tool.name, 'info', {
        entityName: 'Product',
        entityId: tool.id,
        category: 'CATALOG',
      });
    } else {
      if (window.confirm(`"${tool.name}" aracını katalogdan kaldırmak (soft-delete) istediğinize emin misiniz?`)) {
        adminDeleteTool(tool.id);
        adminAddLog('TOOL_SOFT_DELETED', tool.name, 'warning', {
          entityName: 'Product',
          entityId: tool.id,
          category: 'CATALOG',
        });
      }
    }
    if (onRefreshTools) onRefreshTools();
  };

  // Batch Select Toggle
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredTools.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTools.map((t) => t.id));
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Batch Actions
  const handleBatchVerify = () => {
    selectedIds.forEach((id) => {
      adminUpdateTool(id, { verified: { admin: true, audited: true } });
    });
    adminAddLog('BATCH_TOOLS_VERIFIED', `${selectedIds.length} Araç`, 'success');
    setSelectedIds([]);
    if (onRefreshTools) onRefreshTools();
  };

  const handleBatchDelete = () => {
    if (window.confirm(`Seçili ${selectedIds.length} aracı katalogdan kaldırmak istediğinize emin misiniz?`)) {
      selectedIds.forEach((id) => adminDeleteTool(id));
      adminAddLog('BATCH_TOOLS_DELETED', `${selectedIds.length} Araç`, 'warning');
      setSelectedIds([]);
      if (onRefreshTools) onRefreshTools();
    }
  };

  // Save ToolStudioForm
  const handleSaveToolStudio = async (updatedData) => {
    setIsSavingStudio(true);
    try {
      adminUpdateTool(editingTool.id, updatedData);
      adminAddLog('TOOL_METADATA_UPDATED', updatedData.name || editingTool.name, 'info', {
        entityName: 'Product',
        entityId: editingTool.id,
        category: 'CATALOG',
        oldValues: editingTool,
        newValues: updatedData,
      });
      setEditingTool(null);
      if (onRefreshTools) onRefreshTools();
    } catch (err) {
      alert('Kaydetme hatası: ' + err.message);
    } finally {
      setIsSavingStudio(false);
    }
  };

  return (
    <div className={styles.tabContent}>
      {/* Batch Operations Bar */}
      {selectedIds.length > 0 && (
        <div className={styles.batchBar}>
          <span className={styles.batchInfo}>
            <strong>{selectedIds.length}</strong> araç seçildi
          </span>
          <div className={styles.batchActions}>
            <button
              type="button"
              className={styles.batchBtnVerify}
              onClick={handleBatchVerify}
            >
              <CheckCircle2 size={14} />
              <span>Seçilenleri Onayla</span>
            </button>
            <button
              type="button"
              className={styles.batchBtnDelete}
              onClick={handleBatchDelete}
            >
              <Trash2 size={14} />
              <span>Seçilenleri Kaldır</span>
            </button>
            <button
              type="button"
              className={styles.batchBtnClear}
              onClick={() => setSelectedIds([])}
            >
              Seçimi Temizle
            </button>
          </div>
        </div>
      )}

      {/* Toolbar Filters */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarFilters}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Araç adı, açıklama veya etiket ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.selectWrapper}>
            <select
              className={styles.adminSelect}
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              aria-label="Kategoriye Göre Filtrele"
            >
              <option value="all">Tüm Kategoriler</option>
              {categories
                .filter((c) => c.id !== 'all')
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>

          <div className={styles.selectWrapper}>
            <select
              className={styles.adminSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Duruma Göre Filtrele"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="verified">Sadece Onaylı Araçlar</option>
              <option value="unverified">Onay Bekleyenler</option>
              <option value="deleted">Silinmiş / Arşivlenmiş</option>
            </select>
          </div>
        </div>

        <div className={styles.toolbarInfo}>
          <span>{filteredTools.length} araç gösteriliyor</span>
        </div>
      </div>

      {/* Tools Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <button
                    type="button"
                    className={styles.checkboxBtn}
                    onClick={handleToggleSelectAll}
                    aria-label="Tümünü Seç"
                  >
                    {selectedIds.length > 0 && selectedIds.length === filteredTools.length ? (
                      <CheckSquare size={17} color="#6366f1" />
                    ) : (
                      <Square size={17} />
                    )}
                  </button>
                </th>
                <th>Araç Adı & Tanım</th>
                <th>Kategori</th>
                <th>Fiyatlandırma</th>
                <th>Puan & Görüntülenme</th>
                <th>Doğrulama (Audit)</th>
                <th style={{ textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredTools.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyTableTd}>
                    Arama ve filtre kriterlerinize uygun araç bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredTools.map((tool) => {
                  const isChecked = selectedIds.includes(tool.id);
                  const catObj = categories.find((c) => c.id === tool.category);

                  return (
                    <tr key={tool.id} className={tool.isDeleted ? styles.rowDeleted : ''}>
                      <td>
                        <button
                          type="button"
                          className={styles.checkboxBtn}
                          onClick={() => handleToggleSelectOne(tool.id)}
                          aria-label={`${tool.name} Seç`}
                        >
                          {isChecked ? (
                            <CheckSquare size={17} color="#6366f1" />
                          ) : (
                            <Square size={17} />
                          )}
                        </button>
                      </td>
                      <td>
                        <div className={styles.toolIdentityCell}>
                          <div className={styles.toolThumb}>
                            {tool.name ? tool.name.substring(0, 2).toUpperCase() : 'AI'}
                          </div>
                          <div>
                            <div className={styles.toolNameTitle}>
                              <strong>{tool.name}</strong>
                              {tool.isDeleted && (
                                <span className={styles.deletedPill}>Silindi</span>
                              )}
                            </div>
                            <span className={styles.toolTaglineText}>
                              {tool.tagline || tool.description || 'Açıklama yok'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={styles.categoryPill}
                          style={{ borderColor: catObj?.color || '#6366f1' }}
                        >
                          {catObj?.name || tool.category}
                        </span>
                      </td>
                      <td>
                        <span className={styles.pricingBadge}>
                          {tool.pricing || 'Freemium'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.ratingCell}>
                          <span className={styles.ratingVal}>★ {tool.rating || 4.5}</span>
                          <span className={styles.viewsVal}>{tool.views || '1.2k'} gör.</span>
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`${styles.verifyToggleBtn} ${tool.isVerified ? styles.verified : ''}`}
                          onClick={() => handleToggleVerify(tool)}
                          title="Doğrulama durumunu değiştir"
                        >
                          <ShieldCheck size={15} />
                          <span>{tool.isVerified ? 'Onaylı' : 'Onaysız'}</span>
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className={styles.rowActionsRight}>
                          {onOpenTool && (
                            <button
                              type="button"
                              className={styles.actionIconBtn}
                              onClick={() => onOpenTool(tool.id)}
                              title="Dizinde Görüntüle"
                            >
                              <ExternalLink size={15} />
                            </button>
                          )}

                          <button
                            type="button"
                            className={styles.actionIconBtn}
                            onClick={() => setEditingTool(tool)}
                            title="Aracı Düzenle"
                          >
                            <Edit2 size={15} />
                          </button>

                          <button
                            type="button"
                            className={tool.isDeleted ? styles.actionIconBtnSuccess : styles.actionIconBtnDanger}
                            onClick={() => handleToggleDelete(tool)}
                            title={tool.isDeleted ? 'Geri Yükle' : 'Kaldır (Soft-delete)'}
                          >
                            {tool.isDeleted ? <RotateCcw size={15} /> : <Trash2 size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Tool Studio Modal */}
      {editingTool && (
        <div className={styles.modalOverlay} onClick={() => setEditingTool(null)} role="dialog" aria-modal="true">
          <div className={`${styles.modalContainer} ${styles.studioModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Aracı Düzenle: {editingTool.name}</h2>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setEditingTool(null)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <ToolStudioForm
                initialData={editingTool}
                categories={categories}
                onSave={handleSaveToolStudio}
                onCancel={() => setEditingTool(null)}
                isLoading={isSavingStudio}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
