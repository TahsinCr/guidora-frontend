import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Search,
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
  Download,
  Star,
  ChevronLeft,
  ChevronRight,
  Layers,
  FileText,
  Image as ImageIcon,
  Users,
  GitCommit,
  X,
} from 'lucide-react';
import {
  adminUpdateTool,
  adminDeleteTool,
  adminRestoreTool,
  getDeletedToolIds,
  adminAddLog,
} from '@/services/adminService';
import * as adminApi from '@/services/api/adminApi';
import { addTool } from '@/services/toolsService';
import { isMockMode } from '@/services/config/modeService';
import { getCategoryColor } from '@/constants/categoryIcons';
import toastService from '@/services/toast/toastService';
import ToolStudioForm from '@/components/common/ToolStudioForm';
import { useLanguage } from '@/context/LanguageContext';
import AdminConfirmModal from '../modals/AdminConfirmModal';
import styles from '../AdminDashboardPage.module.scss';

const FILTER_CHIPS = [
  { id: 'ALL', key: 'admin.chipAll', defaultLabel: 'Tüm Araçlar' },
  { id: 'VERIFIED', key: 'admin.chipVerified', defaultLabel: 'Onaylılar' },
  { id: 'PENDING', key: 'admin.chipPending', defaultLabel: 'Onay Bekleyenler' },
  { id: 'FEATURED', key: 'admin.chipFeatured', defaultLabel: 'Öne Çıkanlar' },
  { id: 'FREE', key: 'admin.chipFree', defaultLabel: 'Ücretsiz / Freemium' },
  { id: 'PAID', key: 'admin.chipPaid', defaultLabel: 'Ücretli / Ticari' },
  { id: 'ARCHIVED', key: 'admin.chipArchived', defaultLabel: 'Arşivlenmiş / Silinmiş' },
];

export default function ToolsTab({
  tools = [],
  categories = [],
  globalSearch = '',
  onRefreshTools,
  onOpenTool,
}) {
  const { t, language, lang } = useLanguage();
  const activeLang = lang || language || 'tr';
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [activeChip, setActiveChip] = useState('ALL');
  const [selectedToolIds, setSelectedToolIds] = useState([]);
  const [editingTool, setEditingTool] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [failedImages, setFailedImages] = useState({});

  // Sub-Resource Manager Modal State (Changelogs, Documents, Media, Contributors)
  const [resourceModalTool, setResourceModalTool] = useState(null);
  const [resourceTab, setResourceTab] = useState('changelogs');
  const [resourceLoading, setResourceLoading] = useState(false);
  const [changelogs, setChangelogs] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [mediaItems, setMediaItems] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [newChangelog, setNewChangelog] = useState({ version: '', releaseNotes: '' });
  const [newDoc, setNewDoc] = useState({ title: '', content: '', sortOrder: 1 });
  const [newMedia, setNewMedia] = useState({ mediaUrl: '', mediaType: 'image', sortOrder: 1 });
  const [newContributorId, setNewContributorId] = useState('');

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

  const deletedIds = useMemo(() => getDeletedToolIds(), [tools]);

  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((c) => {
      if (c?.id) map.set(String(c.id).toLowerCase(), c);
      if (c?.name) map.set(String(c.name).toLowerCase(), c);
    });
    return map;
  }, [categories]);

  const resolveCategoryDisplay = (catKey) => {
    if (!catKey) return { label: 'Genel', color: '#8A38F5' };
    const found = categoryMap.get(String(catKey).toLowerCase());
    if (found) {
      return {
        label: found.translations?.[activeLang] || found.name || catKey,
        color: found.color || getCategoryColor(found.id) || '#8A38F5',
      };
    }
    return {
      label: catKey,
      color: getCategoryColor(catKey) || '#8A38F5',
    };
  };

  // Open Sub-Resource Modal and fetch live sub-resources
  const handleOpenResourceManager = async (tool) => {
    setResourceModalTool(tool);
    setResourceTab('changelogs');
    const numId = Number(tool.numericId ?? tool.id);
    if (isMockMode() || isNaN(numId) || numId <= 0) {
      setChangelogs(tool.changelog || []);
      setDocuments(tool.documentation ? [{ id: 1, title: 'Overview Docs', content: tool.documentation, sortOrder: 1 }] : []);
      setMediaItems(tool.media || []);
      setContributors([]);
      return;
    }
    setResourceLoading(true);
    try {
      await adminApi.ensureAdminBackendSession();
      const [cl, docs, med, contr] = await Promise.allSettled([
        adminApi.fetchProductChangelogs(numId),
        adminApi.fetchProductDocuments(numId),
        adminApi.fetchProductMedia(numId),
        adminApi.fetchProductContributors(numId),
      ]);
      setChangelogs(cl.status === 'fulfilled' && Array.isArray(cl.value) ? cl.value : []);
      setDocuments(docs.status === 'fulfilled' && Array.isArray(docs.value) ? docs.value : []);
      setMediaItems(med.status === 'fulfilled' && Array.isArray(med.value) ? med.value : []);
      setContributors(contr.status === 'fulfilled' && Array.isArray(contr.value) ? contr.value : []);
    } catch {
      // Fallback gracefully
    } finally {
      setResourceLoading(false);
    }
  };

  const handleAddChangelog = async (e) => {
    e.preventDefault();
    if (!newChangelog.version.trim() || !newChangelog.releaseNotes.trim() || !resourceModalTool) return;
    const numId = Number(resourceModalTool.numericId ?? resourceModalTool.id);
    try {
      if (!isMockMode() && !isNaN(numId) && numId > 0) {
        await adminApi.createProductChangelog(numId, {
          version: newChangelog.version.trim(),
          releaseNotes: newChangelog.releaseNotes.trim(),
          releasedAt: new Date().toISOString(),
        });
        const refreshed = await adminApi.fetchProductChangelogs(numId);
        setChangelogs(Array.isArray(refreshed) ? refreshed : []);
      } else {
        setChangelogs((prev) => [
          { id: Date.now(), version: newChangelog.version.trim(), releaseNotes: newChangelog.releaseNotes.trim(), releasedAt: new Date().toISOString() },
          ...prev,
        ]);
      }
      setNewChangelog({ version: '', releaseNotes: '' });
      toastService.success('Sürüm notu (Changelog) eklendi.');
    } catch (err) {
      toastService.error('Sürüm notu eklenemedi: ' + (err.message || 'Hata'));
    }
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!newDoc.title.trim() || !newDoc.content.trim() || !resourceModalTool) return;
    const numId = Number(resourceModalTool.numericId ?? resourceModalTool.id);
    try {
      if (!isMockMode() && !isNaN(numId) && numId > 0) {
        await adminApi.createProductDocument(numId, {
          title: newDoc.title.trim(),
          content: newDoc.content.trim(),
          sortOrder: Number(newDoc.sortOrder) || 1,
        });
        const refreshed = await adminApi.fetchProductDocuments(numId);
        setDocuments(Array.isArray(refreshed) ? refreshed : []);
      } else {
        setDocuments((prev) => [...prev, { id: Date.now(), ...newDoc }]);
      }
      setNewDoc({ title: '', content: '', sortOrder: documents.length + 2 });
      toastService.success('Doküman eklendi.');
    } catch (err) {
      toastService.error('Doküman eklenemedi: ' + (err.message || 'Hata'));
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!resourceModalTool) return;
    const numId = Number(resourceModalTool.numericId ?? resourceModalTool.id);
    try {
      if (!isMockMode() && !isNaN(numId) && numId > 0) {
        await adminApi.deleteProductDocument(numId, docId);
      }
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      toastService.success('Doküman kaldırıldı.');
    } catch (err) {
      toastService.error('Doküman silinemedi: ' + (err.message || 'Hata'));
    }
  };

  const handleAddMedia = async (e) => {
    e.preventDefault();
    if (!newMedia.mediaUrl.trim() || !resourceModalTool) return;
    const numId = Number(resourceModalTool.numericId ?? resourceModalTool.id);
    try {
      if (!isMockMode() && !isNaN(numId) && numId > 0) {
        await adminApi.createProductMedia(numId, {
          mediaUrl: newMedia.mediaUrl.trim(),
          mediaType: newMedia.mediaType || 'image',
          sortOrder: Number(newMedia.sortOrder) || 1,
        });
        const refreshed = await adminApi.fetchProductMedia(numId);
        setMediaItems(Array.isArray(refreshed) ? refreshed : []);
      } else {
        setMediaItems((prev) => [...prev, { id: Date.now(), ...newMedia }]);
      }
      setNewMedia({ mediaUrl: '', mediaType: 'image', sortOrder: mediaItems.length + 2 });
      toastService.success('Medya öğesi eklendi.');
    } catch (err) {
      toastService.error('Medya eklenemedi: ' + (err.message || 'Hata'));
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    if (!resourceModalTool) return;
    const numId = Number(resourceModalTool.numericId ?? resourceModalTool.id);
    try {
      if (!isMockMode() && !isNaN(numId) && numId > 0) {
        await adminApi.deleteProductMedia(numId, mediaId);
      }
      setMediaItems((prev) => prev.filter((m) => m.id !== mediaId));
      toastService.success('Medya öğesi silindi.');
    } catch (err) {
      toastService.error('Medya silinemedi: ' + (err.message || 'Hata'));
    }
  };

  const handleAddContributor = async (e) => {
    e.preventDefault();
    const uid = Number(newContributorId);
    if (!uid || isNaN(uid) || !resourceModalTool) return;
    const numId = Number(resourceModalTool.numericId ?? resourceModalTool.id);
    try {
      if (!isMockMode() && !isNaN(numId) && numId > 0) {
        await adminApi.addProductContributor(numId, uid);
        const refreshed = await adminApi.fetchProductContributors(numId);
        setContributors(Array.isArray(refreshed) ? refreshed : []);
      } else {
        setContributors((prev) => [...prev, { userId: uid, addedAt: new Date().toISOString() }]);
      }
      setNewContributorId('');
      toastService.success(`Katkıcı (#${uid}) eklendi.`);
    } catch (err) {
      toastService.error('Katkıcı eklenemedi: ' + (err.message || 'Hata'));
    }
  };

  const handleRemoveContributor = async (userId) => {
    if (!resourceModalTool) return;
    const numId = Number(resourceModalTool.numericId ?? resourceModalTool.id);
    try {
      if (!isMockMode() && !isNaN(numId) && numId > 0) {
        await adminApi.removeProductContributor(numId, userId);
      }
      setContributors((prev) => prev.filter((c) => (c.userId ?? c.id) !== userId));
      toastService.success('Katkıcı kaldırıldı.');
    } catch (err) {
      toastService.error('Katkıcı kaldırılamadı: ' + (err.message || 'Hata'));
    }
  };

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
      const q = (searchTerm || globalSearch || '').trim().toLowerCase();
      if (q) {
        const nameMatch = (tool.name || '').toLowerCase().includes(q);
        const taglineMatch = (tool.tagline || '').toLowerCase().includes(q);
        const descMatch = (tool.overview || tool.description || '').toLowerCase().includes(q);
        const tagsMatch = (tool.tags || []).some((t) => (typeof t === 'string' ? t : t.name || '').toLowerCase().includes(q));
        if (!nameMatch && !taglineMatch && !descMatch && !tagsMatch) {
          return false;
        }
      }
      return true;
    });
  }, [tools, categoryFilter, activeChip, searchTerm, globalSearch, deletedIds]);

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
    adminUpdateTool(tool.id, { isVerified: nextVer }, tool);
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
    adminUpdateTool(tool.id, { isFeatured: nextFeat, featured: nextFeat }, tool);
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
        adminDeleteTool(tool.id, tool.numericId);
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
      const target = tools.find((t) => t.id === id);
      adminUpdateTool(id, { isVerified: verifyStatus }, target);
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
          const target = tools.find((t) => t.id === id);
          adminDeleteTool(id, target?.numericId);
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

  // Save / Update Tool from ToolStudioForm
  const handleSaveTool = async (toolPayload) => {
    try {
      if (editingTool) {
        adminUpdateTool(editingTool.id, toolPayload, editingTool);
        adminAddLog('PRODUCT_UPDATED', toolPayload.name, 'info', {
          entityName: 'Product',
          entityId: editingTool.id,
          category: 'CATALOG',
          newValues: toolPayload,
        });
        toastService.success(`"${toolPayload.name}" başarıyla güncellendi.`);
      } else {
        const newTool = await addTool(toolPayload);
        adminAddLog('PRODUCT_CREATED', toolPayload.name, 'success', {
          entityName: 'Product',
          entityId: newTool?.id,
          category: 'CATALOG',
        });
        toastService.success(`"${toolPayload.name}" kataloğa eklendi.`);
      }
      setIsFormOpen(false);
      setEditingTool(null);
      if (onRefreshTools) onRefreshTools();
    } catch (err) {
      toastService.error('Kaydetme hatası: ' + err.message);
    }
  };

  // Open Tool Live View in new tab without navigating away from Admin
  const handleOpenToolLive = (toolId) => {
    if (typeof window !== 'undefined') {
      window.open(`/?tool=${encodeURIComponent(toolId)}`, '_blank');
    } else if (onOpenTool) {
      onOpenTool(toolId);
    }
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
              placeholder={t('admin.searchToolOrCat', 'Araç adı, etiket veya açıklama ara...')}
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
              aria-label={t('admin.filterByCategory', 'Kategoriye Göre Filtrele')}
            >
              <option value="ALL">{t('admin.allCategories', 'Tüm Kategoriler')}</option>
              {categories
                .filter((c) => c.id !== 'all')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.translations?.[activeLang] || c.name}
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
            title={t('admin.exportCsv', 'CSV Dışa Aktar')}
          >
            <Download size={14} />
            <span>CSV</span>
          </button>

          <button
            type="button"
            className={styles.actionBtnSecondary}
            onClick={handleExportJson}
            disabled={!filteredTools.length}
            title={t('admin.exportJson', 'JSON Dışa Aktar')}
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
            <span>{t('admin.createNewTool', 'Yeni Araç Ekle')}</span>
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
              <span>{t(chip.key, chip.defaultLabel)}</span>
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
            <span><strong>{selectedToolIds.length}</strong> {t('admin.toolsSuffix', 'araç')} {language === 'tr' ? 'seçildi' : language === 'ru' ? 'выбрано' : 'selected'}</span>
          </div>

          <div className={styles.batchBarActions}>
            <button
              type="button"
              className={styles.batchBtn}
              onClick={() => handleBatchVerify(true)}
            >
              <CheckCircle2 size={13} color="#10b981" />
              <span>{t('admin.batchVerify', 'Onayla')}</span>
            </button>

            <button
              type="button"
              className={styles.batchBtn}
              onClick={() => {
                selectedToolIds.forEach((id) => {
                  const target = tools.find((t) => t.id === id);
                  adminUpdateTool(id, { isFeatured: true, featured: true }, target);
                });
                toastService.success(`${selectedToolIds.length} ${language === 'tr' ? 'araç öne çıkarıldı.' : language === 'ru' ? 'инструментов выделено.' : 'tools featured.'}`);
                setSelectedToolIds([]);
                if (onRefreshTools) onRefreshTools();
              }}
            >
              <Star size={13} color="#fbbf24" />
              <span>{language === 'tr' ? 'Öne Çıkar' : language === 'ru' ? 'В избранное' : 'Feature'}</span>
            </button>

            <button
              type="button"
              className={`${styles.batchBtn} ${styles.batchBtnDanger}`}
              onClick={handleBatchDeletePrompt}
            >
              <Trash2 size={13} />
              <span>{t('admin.batchDelete', 'Sil')}</span>
            </button>

            <button
              type="button"
              className={styles.batchBtn}
              onClick={() => setSelectedToolIds([])}
            >
              {language === 'tr' ? 'Seçimi Temizle' : language === 'ru' ? 'Снять выделение' : 'Clear Selection'}
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
                    aria-label={t('admin.selectAll', 'Tümünü Seç')}
                  >
                    {selectedToolIds.length === paginatedTools.length && paginatedTools.length > 0 ? (
                      <CheckSquare size={15} color="#6366f1" />
                    ) : (
                      <Square size={15} />
                    )}
                  </button>
                </th>
                <th>{t('admin.colTool', 'Araç Adı & Tanım')}</th>
                <th>{t('admin.colCategory', 'Kategori')}</th>
                <th>{t('admin.colPricing', 'Fiyatlandırma')}</th>
                <th>{t('admin.colRatingVotes', 'Puan & Oylar')}</th>
                <th>{t('filter.verification', 'Doğrulama')}</th>
                <th style={{ textAlign: 'right' }}>{t('admin.colActions', 'İşlemler')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTools.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyTableTd}>
                    {language === 'tr' ? 'Filtre kriterlerine uygun araç kaydı bulunamadı.' : language === 'ru' ? 'Записей инструментов по критериям фильтра не найдено.' : 'No tool listings found matching these criteria.'}
                  </td>
                </tr>
              ) : (
                paginatedTools.map((tool) => {
                  const isArchived = deletedIds.includes(tool.id) || tool.isArchived;
                  const isSelected = selectedToolIds.includes(tool.id);
                  const isFeatured = tool.isFeatured || tool.featured;
                  const rawImg = tool.image || tool.logo || (typeof tool.icon === 'string' && tool.icon.startsWith('http') ? tool.icon : null);
                  const showImg = rawImg && !failedImages[tool.id];
                  const catMeta = resolveCategoryDisplay(tool.category);
                  const monogram = (tool.name || 'AI')
                    .split(/[\s-]+/)
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase();

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
                          <div
                            className={styles.toolThumbnailSmall}
                            style={
                              !showImg
                                ? {
                                    background: `linear-gradient(135deg, ${catMeta.color}30, ${catMeta.color}12)`,
                                    borderColor: `${catMeta.color}45`,
                                    color: catMeta.color,
                                  }
                                : undefined
                            }
                          >
                            {showImg ? (
                              <img
                                src={rawImg}
                                alt={tool.name}
                                loading="lazy"
                                onError={() =>
                                  setFailedImages((prev) => ({ ...prev, [tool.id]: true }))
                                }
                              />
                            ) : (
                              <span className={styles.toolMonogramText}>{monogram}</span>
                            )}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong className={styles.toolNameText}>{tool.name}</strong>
                              {isFeatured && (
                                <span title="Öne Çıkarılmış Araç" style={{ display: 'inline-flex' }}>
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
                        <span
                          className={styles.categoryBadge}
                          style={{
                            borderColor: `${catMeta.color}45`,
                            backgroundColor: `${catMeta.color}18`,
                            color: catMeta.color,
                          }}
                        >
                          {catMeta.label}
                        </span>
                      </td>

                      <td>
                        <span className={styles.pricingPill}>{tool.pricing || 'Free'}</span>
                      </td>

                      <td>
                        <div className={styles.ratingCell}>
                          <span className={styles.ratingVal}>
                            <Star size={12} fill="#fbbf24" color="#fbbf24" />
                            <span>{Number(tool.rating || 5.0).toFixed(1)}</span>
                          </span>
                          <span className={styles.votesCount}>{tool.votes ?? tool.reviewCount ?? 0} oy</span>
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

                          {/* Sub-Resource Manager (Changelogs, Docs, Media, Contributors) */}
                          <button
                            type="button"
                            className={styles.actionIconBtn}
                            onClick={() => handleOpenResourceManager(tool)}
                            title="Alt Kaynaklar (Sürüm Notları, Dokümanlar, Medya, Katkıcılar)"
                          >
                            <Layers size={15} />
                          </button>

                          {/* View in catalog */}
                          <button
                            type="button"
                            className={styles.actionIconBtn}
                            onClick={() => handleOpenToolLive(tool.id)}
                            title="Kullanıcı Görünümünde Aç (Yeni Sekme)"
                          >
                            <ExternalLink size={15} />
                          </button>

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
                {language === 'tr'
                  ? <>Toplam <strong>{filteredTools.length}</strong> araçtan <strong>{pageSize === 'all' ? filteredTools.length : Math.min((currentPage - 1) * pageSize + 1, filteredTools.length)}</strong> - <strong>{pageSize === 'all' ? filteredTools.length : Math.min(currentPage * pageSize, filteredTools.length)}</strong> arası gösteriliyor</>
                  : language === 'ru'
                  ? <>Показано <strong>{pageSize === 'all' ? filteredTools.length : Math.min((currentPage - 1) * pageSize + 1, filteredTools.length)}</strong> - <strong>{pageSize === 'all' ? filteredTools.length : Math.min(currentPage * pageSize, filteredTools.length)}</strong> из <strong>{filteredTools.length}</strong> инструментов</>
                  : <>Showing <strong>{pageSize === 'all' ? filteredTools.length : Math.min((currentPage - 1) * pageSize + 1, filteredTools.length)}</strong> - <strong>{pageSize === 'all' ? filteredTools.length : Math.min(currentPage * pageSize, filteredTools.length)}</strong> of <strong>{filteredTools.length}</strong> tools</>}
              </span>

              <div className={styles.pageSizeSelector}>
                <label>{t('admin.pageSize', 'Sayfa Başına')}:</label>
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
                  <option value="all">{language === 'tr' ? 'Tümü' : language === 'ru' ? 'Все' : 'All'}</option>
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

      {/* Product Sub-Resources Manager Modal (Changelogs, Documents, Media, Contributors) */}
      {resourceModalTool && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setResourceModalTool(null)}
        >
          <div
            className={styles.modalCard}
            style={{ maxWidth: '720px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>
                  {resourceModalTool.name} — Alt Kaynak Yönetimi
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                  REST API uç noktaları (`/api/products/{resourceModalTool.numericId || resourceModalTool.id}/...`) üzerinden sürüm geçmişi, doküman, medya ve katkıcıları yönetin.
                </p>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setResourceModalTool(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.subTabNav} style={{ margin: '0 24px 16px' }}>
              <button
                type="button"
                className={`${styles.subTabBtn} ${resourceTab === 'changelogs' ? styles.subTabBtnActive : ''}`}
                onClick={() => setResourceTab('changelogs')}
              >
                <GitCommit size={14} />
                <span>Sürüm Notları ({changelogs.length})</span>
              </button>
              <button
                type="button"
                className={`${styles.subTabBtn} ${resourceTab === 'documents' ? styles.subTabBtnActive : ''}`}
                onClick={() => setResourceTab('documents')}
              >
                <FileText size={14} />
                <span>Dokümanlar ({documents.length})</span>
              </button>
              <button
                type="button"
                className={`${styles.subTabBtn} ${resourceTab === 'media' ? styles.subTabBtnActive : ''}`}
                onClick={() => setResourceTab('media')}
              >
                <ImageIcon size={14} />
                <span>Medya ({mediaItems.length})</span>
              </button>
              <button
                type="button"
                className={`${styles.subTabBtn} ${resourceTab === 'contributors' ? styles.subTabBtnActive : ''}`}
                onClick={() => setResourceTab('contributors')}
              >
                <Users size={14} />
                <span>Katkıcılar ({contributors.length})</span>
              </button>
            </div>

            <div className={styles.modalBody} style={{ maxHeight: '62vh', overflowY: 'auto' }}>
              {resourceLoading ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                  Alt kaynak verileri yükleniyor...
                </div>
              ) : resourceTab === 'changelogs' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <form onSubmit={handleAddChangelog} className={styles.subResourceForm}>
                    <div className={styles.formRowGrid}>
                      <input
                        type="text"
                        className={styles.formInput}
                        placeholder="Sürüm (örn. v2.4.0)"
                        value={newChangelog.version}
                        onChange={(e) => setNewChangelog({ ...newChangelog, version: e.target.value })}
                        required
                      />
                      <input
                        type="text"
                        className={styles.formInput}
                        placeholder="Sürüm notları / değişiklik özeti..."
                        value={newChangelog.releaseNotes}
                        onChange={(e) => setNewChangelog({ ...newChangelog, releaseNotes: e.target.value })}
                        required
                      />
                    </div>
                    <button type="submit" className={styles.actionBtnPrimary} style={{ alignSelf: 'flex-start' }}>
                      <Plus size={14} />
                      <span>Sürüm Notu Ekle</span>
                    </button>
                  </form>

                  <div className={styles.subResourceList}>
                    {changelogs.length === 0 ? (
                      <div className={styles.emptySubResource}>Henüz kayıtlı sürüm notu bulunmuyor.</div>
                    ) : (
                      changelogs.map((cl, idx) => (
                        <div key={cl.id || idx} className={styles.subResourceItem}>
                          <div>
                            <strong style={{ color: '#a855f7', fontFamily: 'monospace' }}>{cl.version}</strong>
                            <p style={{ margin: '4px 0 0', fontSize: '0.82rem' }}>{cl.releaseNotes || cl.notes || cl.description}</p>
                          </div>
                          <span style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)' }}>
                            {cl.releasedAt ? new Date(cl.releasedAt).toLocaleDateString('tr-TR') : 'Aktif'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : resourceTab === 'documents' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <form onSubmit={handleAddDocument} className={styles.subResourceForm}>
                    <div className={styles.formRowGrid}>
                      <input
                        type="text"
                        className={styles.formInput}
                        placeholder="Doküman Başlığı (örn. Kurulum Rehberi)"
                        value={newDoc.title}
                        onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                        required
                      />
                      <input
                        type="number"
                        className={styles.formInput}
                        placeholder="Sıra (1)"
                        value={newDoc.sortOrder}
                        onChange={(e) => setNewDoc({ ...newDoc, sortOrder: e.target.value })}
                      />
                    </div>
                    <textarea
                      className={styles.formTextarea}
                      rows={3}
                      placeholder="Markdown / Doküman içeriği..."
                      value={newDoc.content}
                      onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                      required
                    />
                    <button type="submit" className={styles.actionBtnPrimary} style={{ alignSelf: 'flex-start' }}>
                      <Plus size={14} />
                      <span>Doküman Ekle</span>
                    </button>
                  </form>

                  <div className={styles.subResourceList}>
                    {documents.length === 0 ? (
                      <div className={styles.emptySubResource}>Henüz kayıtlı doküman bulunmuyor.</div>
                    ) : (
                      documents.map((doc) => (
                        <div key={doc.id} className={styles.subResourceItem}>
                          <div>
                            <strong>{doc.title}</strong>
                            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
                              {(doc.content || '').slice(0, 140)}
                            </p>
                          </div>
                          <button
                            type="button"
                            className={styles.actionIconBtnDanger}
                            onClick={() => handleDeleteDocument(doc.id)}
                            title="Dokümanı Sil"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : resourceTab === 'media' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <form onSubmit={handleAddMedia} className={styles.subResourceForm}>
                    <div className={styles.formRowGrid}>
                      <input
                        type="url"
                        className={styles.formInput}
                        placeholder="Görsel veya Video URL (https://...)"
                        value={newMedia.mediaUrl}
                        onChange={(e) => setNewMedia({ ...newMedia, mediaUrl: e.target.value })}
                        required
                      />
                      <select
                        className={styles.adminSelect}
                        value={newMedia.mediaType}
                        onChange={(e) => setNewMedia({ ...newMedia, mediaType: e.target.value })}
                      >
                        <option value="image">Görsel (Image)</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                    <button type="submit" className={styles.actionBtnPrimary} style={{ alignSelf: 'flex-start' }}>
                      <Plus size={14} />
                      <span>Medya Ekle</span>
                    </button>
                  </form>

                  <div className={styles.subResourceList}>
                    {mediaItems.length === 0 ? (
                      <div className={styles.emptySubResource}>Henüz kayıtlı medya öğesi bulunmuyor.</div>
                    ) : (
                      mediaItems.map((m, idx) => (
                        <div key={m.id || idx} className={styles.subResourceItem}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className={styles.categoryBadge}>{m.mediaType || 'image'}</span>
                            <span style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{m.mediaUrl || m.url}</span>
                          </div>
                          {m.id && (
                            <button
                              type="button"
                              className={styles.actionIconBtnDanger}
                              onClick={() => handleDeleteMedia(m.id)}
                              title="Medyayı Sil"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <form onSubmit={handleAddContributor} className={styles.subResourceForm}>
                    <div className={styles.formRowGrid}>
                      <input
                        type="number"
                        className={styles.formInput}
                        placeholder="Kullanıcı Numeric ID (örn. 242)"
                        value={newContributorId}
                        onChange={(e) => setNewContributorId(e.target.value)}
                        required
                      />
                      <button type="submit" className={styles.actionBtnPrimary}>
                        <Plus size={14} />
                        <span>Katkıcı Ekle</span>
                      </button>
                    </div>
                  </form>

                  <div className={styles.subResourceList}>
                    {contributors.length === 0 ? (
                      <div className={styles.emptySubResource}>Henüz atanmış katkıcı bulunmuyor.</div>
                    ) : (
                      contributors.map((c, idx) => {
                        const uid = c.userId ?? c.id;
                        return (
                          <div key={uid || idx} className={styles.subResourceItem}>
                            <div>
                              <strong>Kullanıcı #{uid}</strong>
                              {c.username && <span style={{ marginLeft: '8px', color: 'var(--admin-text-muted)' }}>@{c.username}</span>}
                            </div>
                            <button
                              type="button"
                              className={styles.actionIconBtnDanger}
                              onClick={() => handleRemoveContributor(uid)}
                              title="Katkıcıyı Kaldır"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit / Create Tool Studio Modal */}
      {isFormOpen && (
        <ToolStudioForm
          isOpen={isFormOpen}
          initialData={editingTool}
          isEditMode={Boolean(editingTool)}
          onSave={handleSaveTool}
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
