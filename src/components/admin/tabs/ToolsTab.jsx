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
  Download,
  Star,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
import {
  adminUpdateTool,
  adminDeleteTool,
  adminRestoreTool,
  getDeletedToolIds,
  adminAddLog,
} from '@/services/adminService';
import toastService from '@/services/toast/toastService';
import ToolStudioForm from '@/components/common/ToolStudioForm';
import AdminConfirmModal from '../modals/AdminConfirmModal';
import styles from '../AdminDashboardPage.module.scss';

const FILTER_CHIPS = [
  { id: 'ALL', label: 'Tüm Araçlar' },
  { id: 'VERIFIED', label: 'Onaylılar' },
  { id: 'PENDING', label: 'Onay Bekleyenler' },
  { id: 'FEATURED', label: 'Öne Çıkanlar' },
  { id: 'FREE', label: 'Ücretsiz / Freemium' },
  { id: 'PAID', label: 'Ücretli / Ticari' },
  { id: 'ARCHIVED', label: 'Arşivlenmiş / Silinmiş' },
];

export default function ToolsTab({
  tools = [],
  categories = [],
  onRefreshTools,
  onOpenTool,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [activeChip, setActiveChip] = useState('ALL');
  const [selectedToolIds, setSelectedToolIds] = useState([]);
  const [editingTool, setEditingTool] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal Confirmation State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
    confirmText: 'Onayla',
    onConfirm: () => {},
  });

  const deletedIds = useMemo(() => getDeletedToolIds(), []);

  // Filter tools
  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const isArchived = deletedIds.includes(tool.id) || tool.isArchived;

      // Chip Filter
      if (activeChip === 'ARCHIVED') {
        if (!isArchived) return false;
      } else {
        if (isArchived) return false; // Hide archived by default
        if (activeChip === 'VERIFIED' && !tool.isVerified) return false;
        if (activeChip === 'PENDING' && tool.isVerified) return false;
        if (activeChip === 'FEATURED' && !tool.isFeatured && !tool.featured) return false;
        if (activeChip === 'FREE' && tool.pricing !== 'Free' && tool.pricing !== 'Freemium') return false;
        if (activeChip === 'PAID' && tool.pricing !== 'Paid' && tool.pricing !== 'Contact for Pricing') return false;
      }

      // Category Dropdown Filter
      if (categoryFilter !== 'ALL' && tool.category !== categoryFilter) {
        return false;
      }

      // Search Query
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const nameMatch = (tool.name || '').toLowerCase().includes(q);
        const taglineMatch = (tool.tagline || '').toLowerCase().includes(q);
        const descMatch = (tool.overview || '').toLowerCase().includes(q);
        const tagsMatch = (tool.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!nameMatch && !taglineMatch && !descMatch && !tagsMatch) {
          return false;
        }
      }
      return true;
    });
  }, [tools, categoryFilter, activeChip, searchTerm, deletedIds]);

  // Paginated Tools
  const paginatedTools = useMemo(() => {
    if (pageSize === 'all') return filteredTools;
    const start = (currentPage - 1) * pageSize;
    return filteredTools.slice(start, start + pageSize);
  }, [filteredTools, currentPage, pageSize]);

  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(filteredTools.length / pageSize));

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Multi-select helpers
  const handleToggleSelectAll = () => {
    if (selectedToolIds.length === paginatedTools.length && paginatedTools.length > 0) {
      setSelectedToolIds([]);
    } else {
      setSelectedToolIds(paginatedTools.map((t) => t.id));
    }
  };

  const handleToggleSelectRow = (toolId) => {
    setSelectedToolIds((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
  };

  // Toggle Verification
  const handleToggleVerify = (tool) => {
    const nextVer = !tool.isVerified;
    adminUpdateTool(tool.id, { isVerified: nextVer });
    adminAddLog(
      nextVer ? 'PRODUCT_STATUS_VERIFIED' : 'PRODUCT_STATUS_UNVERIFIED',
      tool.name,
      nextVer ? 'info' : 'warning',
      { entityName: 'Product', entityId: tool.id, category: 'CATALOG' }
    );
    toastService.success(nextVer ? `"${tool.name}" onaylandı.` : `"${tool.name}" onayı kaldırıldı.`);
    if (onRefreshTools) onRefreshTools();
  };

  // Toggle Featured Star
  const handleToggleFeatured = (tool) => {
    const nextFeat = !(tool.isFeatured || tool.featured);
    adminUpdateTool(tool.id, { isFeatured: nextFeat, featured: nextFeat });
    adminAddLog(
      nextFeat ? 'PRODUCT_FEATURED' : 'PRODUCT_UNFEATURED',
      tool.name,
      'info',
      { entityName: 'Product', entityId: tool.id, category: 'CATALOG' }
    );
    toastService.success(nextFeat ? `"${tool.name}" öne çıkarıldı.` : `"${tool.name}" öne çıkarılması kaldırıldı.`);
    if (onRefreshTools) onRefreshTools();
  };

  // Delete / Soft-Delete
  const handleDeleteToolPrompt = (tool) => {
    setConfirmModal({
      isOpen: true,
      title: 'Aracı Katalogdan Kaldır',
      message: `"${tool.name}" aracını katalogdan kaldırmak istediğinize emin misiniz? Araç yumuşak silme (soft-delete) ile arşivlenecek, istendiğinde geri yüklenebilecektir.`,
      variant: 'danger',
      confirmText: 'Katalogdan Kaldır',
      onConfirm: () => {
        adminDeleteTool(tool.id);
        adminAddLog('PRODUCT_DELETED', tool.name, 'warning', {
          entityName: 'Product',
          entityId: tool.id,
          category: 'CATALOG',
        });
        toastService.success(`"${tool.name}" katalogdan kaldırıldı.`);
        if (onRefreshTools) onRefreshTools();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Restore Tool
  const handleRestoreTool = (tool) => {
    adminRestoreTool(tool.id);
    adminAddLog('PRODUCT_RESTORED', tool.name, 'success', {
      entityName: 'Product',
      entityId: tool.id,
      category: 'CATALOG',
    });
    toastService.success(`"${tool.name}" başarıyla canlı kataloğa geri yüklendi.`);
    if (onRefreshTools) onRefreshTools();
  };

  // Batch Verify
  const handleBatchVerify = (verifyStatus) => {
    selectedToolIds.forEach((id) => {
      adminUpdateTool(id, { isVerified: verifyStatus });
    });
    adminAddLog('BATCH_TOOLS_VERIFIED', `${selectedToolIds.length} araç güncellendi`, 'info', {
      category: 'CATALOG',
    });
    toastService.success(`${selectedToolIds.length} araç toplu olarak ${verifyStatus ? 'onaylandı' : 'onayı kaldırıldı'}.`);
    setSelectedToolIds([]);
    if (onRefreshTools) onRefreshTools();
  };

  // Batch Delete
  const handleBatchDeletePrompt = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Toplu Silme Onayı',
      message: `Seçilen ${selectedToolIds.length} adet aracı katalogdan kaldırmak istediğinize emin misiniz?`,
      variant: 'danger',
      confirmText: `${selectedToolIds.length} Aracı Kaldır`,
      onConfirm: () => {
        selectedToolIds.forEach((id) => {
          adminDeleteTool(id);
        });
        adminAddLog('BATCH_TOOLS_DELETED', `${selectedToolIds.length} araç kaldırıldı`, 'warning', {
          category: 'CATALOG',
        });
        toastService.success(`${selectedToolIds.length} araç katalogdan kaldırıldı.`);
        setSelectedToolIds([]);
        if (onRefreshTools) onRefreshTools();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Export to CSV
  const handleExportCsv = () => {
    const cols = ['id', 'name', 'tagline', 'category', 'pricing', 'rating', 'votes', 'isVerified', 'isFeatured', 'websiteUrl'];
    const header = cols.join(',');
    const rows = filteredTools.map((t) =>
      cols.map((c) => JSON.stringify(t[c] ?? '')).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `guidora_tools_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastService.success(`${filteredTools.length} araç CSV olarak indirildi.`);
  };

  // Export to JSON
  const handleExportJson = () => {
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredTools, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', jsonStr);
    dlAnchor.setAttribute('download', `guidora_tools_${Date.now()}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    document.body.removeChild(dlAnchor);
    toastService.success(`${filteredTools.length} araç JSON olarak indirildi.`);
  };

  return (
    <div className={styles.tabContent}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarFilters}>
          {/* Search Box */}
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Araç adı, etiket veya açıklama ara..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Category Dropdown */}
          <div className={styles.selectWrapper}>
            <select
              className={styles.adminSelect}
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Kategoriye Göre Filtrele"
            >
              <option value="ALL">Tüm Kategoriler</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Toolbar Action Buttons */}
        <div className={styles.toolbarActions}>
          <button
            type="button"
            className={styles.actionBtnSecondary}
            onClick={handleExportCsv}
            disabled={!filteredTools.length}
            title="CSV Olarak İndir"
          >
            <Download size={14} />
            <span>CSV</span>
          </button>

          <button
            type="button"
            className={styles.actionBtnSecondary}
            onClick={handleExportJson}
            disabled={!filteredTools.length}
            title="JSON Olarak İndir"
          >
            <Download size={14} />
            <span>JSON</span>
          </button>

          <button
            type="button"
            className={styles.actionBtnPrimary}
            onClick={() => {
              setEditingTool(null);
              setIsFormOpen(true);
            }}
          >
            <Plus size={16} />
            <span>Yeni Araç Tanımla</span>
          </button>
        </div>
      </div>

      {/* Quick Filter Chips Bar */}
      <div className={styles.filterChipsBar}>
        {FILTER_CHIPS.map((chip) => {
          const isActive = activeChip === chip.id;
          const count =
            chip.id === 'ALL'
              ? tools.filter((t) => !deletedIds.includes(t.id) && !t.isArchived).length
              : chip.id === 'ARCHIVED'
              ? tools.filter((t) => deletedIds.includes(t.id) || t.isArchived).length
              : chip.id === 'VERIFIED'
              ? tools.filter((t) => t.isVerified && !deletedIds.includes(t.id) && !t.isArchived).length
              : chip.id === 'PENDING'
              ? tools.filter((t) => !t.isVerified && !deletedIds.includes(t.id) && !t.isArchived).length
              : chip.id === 'FEATURED'
              ? tools.filter((t) => (t.isFeatured || t.featured) && !deletedIds.includes(t.id) && !t.isArchived).length
              : chip.id === 'FREE'
              ? tools.filter((t) => (t.pricing === 'Free' || t.pricing === 'Freemium') && !deletedIds.includes(t.id) && !t.isArchived).length
              : tools.filter((t) => (t.pricing === 'Paid' || t.pricing === 'Contact for Pricing') && !deletedIds.includes(t.id) && !t.isArchived).length;

          return (
            <button
              key={chip.id}
              type="button"
              className={`${styles.filterChip} ${isActive ? styles.filterChipActive : ''}`}
              onClick={() => {
                setActiveChip(chip.id);
                setCurrentPage(1);
              }}
            >
              <span>{chip.label}</span>
              <span className={styles.filterChipCount}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Multi-Select Floating Batch Actions Bar */}
      {selectedToolIds.length > 0 && (
        <div className={styles.batchBar}>
          <div className={styles.batchBarSelected}>
            <CheckSquare size={16} color="#6366f1" />
            <span><strong>{selectedToolIds.length}</strong> araç seçildi</span>
          </div>

          <div className={styles.batchBarActions}>
            <button
              type="button"
              className={styles.batchBtn}
              onClick={() => handleBatchVerify(true)}
            >
              <CheckCircle2 size={13} color="#10b981" />
              <span>Onayla</span>
            </button>

            <button
              type="button"
              className={styles.batchBtn}
              onClick={() => {
                selectedToolIds.forEach((id) => {
                  adminUpdateTool(id, { isFeatured: true, featured: true });
                });
                toastService.success(`${selectedToolIds.length} araç öne çıkarıldı.`);
                setSelectedToolIds([]);
                if (onRefreshTools) onRefreshTools();
              }}
            >
              <Star size={13} color="#fbbf24" />
              <span>Öne Çıkar</span>
            </button>

            <button
              type="button"
              className={`${styles.batchBtn} ${styles.batchBtnDanger}`}
              onClick={handleBatchDeletePrompt}
            >
              <Trash2 size={13} />
              <span>Kaldır</span>
            </button>

            <button
              type="button"
              className={styles.batchBtn}
              onClick={() => setSelectedToolIds([])}
            >
              Seçimi Temizle
            </button>
          </div>
        </div>
      )}

      {/* Tools Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className={styles.rowSelectBtn}
                    aria-label="Tümünü Seç"
                  >
                    {selectedToolIds.length === paginatedTools.length && paginatedTools.length > 0 ? (
                      <CheckSquare size={15} color="#6366f1" />
                    ) : (
                      <Square size={15} />
                    )}
                  </button>
                </th>
                <th>Araç Adı & Tanım</th>
                <th>Kategori</th>
                <th>Fiyatlandırma</th>
                <th>Puan & Oylar</th>
                <th>Doğrulama</th>
                <th style={{ textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTools.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyTableTd}>
                    Filtre kriterlerine uygun araç kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                paginatedTools.map((tool) => {
                  const isArchived = deletedIds.includes(tool.id) || tool.isArchived;
                  const isSelected = selectedToolIds.includes(tool.id);
                  const isFeatured = tool.isFeatured || tool.featured;

                  return (
                    <tr
                      key={tool.id}
                      className={`${styles.toolRow} ${isSelected ? styles.selectedRow : ''}`}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleSelectRow(tool.id)}
                          className={styles.rowSelectBtn}
                          aria-label={`${tool.name} Seç`}
                        >
                          {isSelected ? (
                            <CheckSquare size={15} color="#6366f1" />
                          ) : (
                            <Square size={15} />
                          )}
                        </button>
                      </td>

                      <td>
                        <div className={styles.toolTableTitleBlock}>
                          <div className={styles.toolThumbnailSmall}>
                            {tool.image ? (
                              <img src={tool.image} alt={tool.name} loading="lazy" />
                            ) : (
                              <Wrench size={16} />
                            )}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong className={styles.toolNameText}>{tool.name}</strong>
                              {isFeatured && (
                                <span title="Öne Çıkarılmış Araç">
                                  <Star size={12} fill="#fbbf24" color="#fbbf24" />
                                </span>
                              )}
                              {isArchived && (
                                <span className={styles.toolBadgeArchived}>Arşivde</span>
                              )}
                            </div>
                            <span className={styles.toolTaglineText}>{tool.tagline}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={styles.categoryBadge}>{tool.category}</span>
                      </td>

                      <td>
                        <span className={styles.pricingPill}>{tool.pricing || 'Free'}</span>
                      </td>

                      <td>
                        <div className={styles.ratingCell}>
                          <span className={styles.ratingVal}>★ {tool.rating?.toFixed(1) || '5.0'}</span>
                          <span className={styles.votesCount}>{tool.votes || 0} oy</span>
                        </div>
                      </td>

                      <td>
                        <button
                          type="button"
                          className={tool.isVerified ? styles.verifiedBadgeBtn : styles.unverifiedBadgeBtn}
                          onClick={() => handleToggleVerify(tool)}
                          title="Doğrulama durumunu değiştir"
                        >
                          {tool.isVerified ? (
                            <>
                              <ShieldCheck size={12} />
                              <span>ONAYLI</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={12} />
                              <span>ONAY BEKLİYOR</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div className={styles.rowActionsRight}>
                          {/* Star Feature Button */}
                          <button
                            type="button"
                            className={`${styles.starBtn} ${isFeatured ? styles.starBtnActive : ''}`}
                            onClick={() => handleToggleFeatured(tool)}
                            title={isFeatured ? 'Öne çıkarmayı kaldır' : 'Öne çıkar'}
                          >
                            <Star size={15} fill={isFeatured ? '#fbbf24' : 'none'} />
                          </button>

                          {/* View in catalog */}
                          {onOpenTool && (
                            <button
                              type="button"
                              className={styles.actionIconBtn}
                              onClick={() => onOpenTool(tool.id)}
                              title="Kullanıcı Görünümünde Aç"
                            >
                              <ExternalLink size={15} />
                            </button>
                          )}

                          {/* Edit Form */}
                          <button
                            type="button"
                            className={styles.actionIconBtn}
                            onClick={() => {
                              setEditingTool(tool);
                              setIsFormOpen(true);
                            }}
                            title="Aracı Düzenle"
                          >
                            <Edit2 size={15} />
                          </button>

                          {/* Delete or Restore */}
                          {isArchived ? (
                            <button
                              type="button"
                              className={styles.actionIconBtnSuccess}
                              onClick={() => handleRestoreTool(tool)}
                              title="Aracı Canlıya Geri Yükle"
                            >
                              <RotateCcw size={15} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={styles.actionIconBtnDanger}
                              onClick={() => handleDeleteToolPrompt(tool)}
                              title="Katalogdan Kaldır"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredTools.length > 0 && (
          <div className={styles.paginationBar}>
            <div className={styles.paginationInfo}>
              <span>
                Toplam <strong>{filteredTools.length}</strong> araçtan <strong>{pageSize === 'all' ? filteredTools.length : Math.min((currentPage - 1) * pageSize + 1, filteredTools.length)}</strong> - <strong>{pageSize === 'all' ? filteredTools.length : Math.min(currentPage * pageSize, filteredTools.length)}</strong> arası gösteriliyor
              </span>

              <div className={styles.pageSizeSelector}>
                <label>Sayfa Başına:</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10);
                    setPageSize(val);
                    setCurrentPage(1);
                  }}
                  className={styles.pageSizeSelect}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value="all">Tümü</option>
                </select>
              </div>
            </div>

            {pageSize !== 'all' && totalPages > 1 && (
              <div className={styles.paginationNav}>
                <button
                  type="button"
                  className={styles.pageBtn}
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  aria-label="Önceki Sayfa"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: Math.min(totalPages, 7) }, (_, idx) => {
                  let pageNum = idx + 1;
                  if (totalPages > 7) {
                    if (currentPage <= 4) pageNum = idx + 1;
                    else if (currentPage >= totalPages - 3) pageNum = totalPages - 6 + idx;
                    else pageNum = currentPage - 3 + idx;
                  }
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      className={`${styles.pageBtn} ${currentPage === pageNum ? styles.pageBtnActive : ''}`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  className={styles.pageBtn}
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  aria-label="Sonraki Sayfa"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit / Create Tool Studio Modal */}
      {isFormOpen && (
        <ToolStudioForm
          isOpen={isFormOpen}
          initialData={editingTool}
          isEditMode={Boolean(editingTool)}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTool(null);
          }}
          onSuccess={() => {
            setIsFormOpen(false);
            setEditingTool(null);
            if (onRefreshTools) onRefreshTools();
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
