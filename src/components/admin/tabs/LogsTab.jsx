import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Download,
  Trash2,
  Eye,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  adminClearLogs,
  adminRevertAuditLog,
} from '@/services/adminService';
import toastService from '@/services/toast/toastService';
import JsonbDiffModal from '../modals/JsonbDiffModal';
import AdminConfirmModal from '../modals/AdminConfirmModal';
import styles from '../AdminDashboardPage.module.scss';

const LEVEL_CHIPS = [
  { id: 'ALL', label: 'Tüm Seviyeler' },
  { id: 'CRITICAL', label: 'CRITICAL' },
  { id: 'ERROR', label: 'ERROR' },
  { id: 'WARN', label: 'WARN' },
  { id: 'AUDIT', label: 'AUDIT' },
  { id: 'INFO', label: 'INFO' },
];

export default function LogsTab({
  logs = [],
  globalSearch = '',
  onRefreshLogs,
}) {
  const safeLogs = Array.isArray(logs) ? logs : [];
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [inspectingLog, setInspectingLog] = useState(null);
  const [copiedTraceId, setCopiedTraceId] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // In-App Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
    confirmText: 'Onayla',
    onConfirm: () => {},
  });

  // Filter logs
  const filteredLogs = useMemo(() => {
    return safeLogs.filter((log) => {
      if (levelFilter !== 'ALL' && log.level !== levelFilter) {
        return false;
      }
      if (categoryFilter !== 'ALL' && log.category !== categoryFilter) {
        return false;
      }
      const q = (searchTerm || globalSearch || '').trim().toLowerCase();
      if (q) {
        const actionMatch = (log.action || '').toLowerCase().includes(q);
        const targetMatch = (log.target || '').toLowerCase().includes(q);
        const actorMatch = (log.actor || '').toLowerCase().includes(q);
        const traceMatch = (log.traceId || '').toLowerCase().includes(q);
        const ipMatch = (log.actorIp || '').toLowerCase().includes(q);
        if (!actionMatch && !targetMatch && !actorMatch && !traceMatch && !ipMatch) {
          return false;
        }
      }
      return true;
    });
  }, [safeLogs, levelFilter, categoryFilter, searchTerm, globalSearch]);

  // Paginated logs
  const paginatedLogs = useMemo(() => {
    if (pageSize === 'all') return filteredLogs;
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(filteredLogs.length / pageSize));

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Handle Audit Revert
  const handleRevertLog = (logId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Değişikliği Geri Al (Revert)',
      message: `[${logId}] numaralı denetim kaydını geri almak istediğinize emin misiniz? Varlık önceki değerlerine (oldValues) döndürülecek ve yeni bir AUDIT kaydı yazılacaktır.`,
      variant: 'warning',
      confirmText: 'Geri Al',
      onConfirm: () => {
        try {
          adminRevertAuditLog(logId);
          toastService.success('Değişiklik başarıyla geri alındı (xmin senkronize edildi).');
          if (onRefreshLogs) onRefreshLogs();
        } catch (err) {
          toastService.error('Geri alma başarısız: ' + err.message);
        }
      },
    });
  };

  // Export to JSON
  const handleExportJson = () => {
    if (!filteredLogs.length) {
      toastService.warning('Dışa aktarılacak log kaydı bulunmuyor.');
      return;
    }
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', jsonStr);
    dlAnchor.setAttribute('download', `guidora_audit_logs_${Date.now()}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    document.body.removeChild(dlAnchor);
    toastService.success(`${filteredLogs.length} denetim kaydı JSON olarak indirildi.`);
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (!filteredLogs.length) {
      toastService.warning('Dışa aktarılacak log kaydı bulunmuyor.');
      return;
    }
    const cols = ['id', 'level', 'category', 'action', 'target', 'actor', 'actorRole', 'actorIp', 'traceId', 'xmin', 'timestamp'];
    const header = cols.join(',');
    const rows = filteredLogs.map((l) =>
      cols.map((c) => JSON.stringify(l[c] ?? '')).join(',')
    );
    const csvContent = '\uFEFF' + [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `guidora_audit_logs_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastService.success(`${filteredLogs.length} denetim kaydı CSV olarak indirildi.`);
  };

  // Clear Logs
  const handleClearLogs = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Tüm Denetim Loglarını Temizle',
      message: 'Tüm denetim kayıtları sistemden silinecektir. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?',
      variant: 'danger',
      confirmText: 'Logları Temizle',
      onConfirm: () => {
        try {
          adminClearLogs();
          if (onRefreshLogs) onRefreshLogs();
          toastService.success('Tüm denetim kayıtları temizlendi.');
        } catch (err) {
          toastService.error('Logları temizleme hatası: ' + err.message);
        }
      },
    });
  };

  // Copy Trace ID
  const handleCopyTrace = (traceId) => {
    if (!traceId) return;
    navigator.clipboard?.writeText(traceId);
    setCopiedTraceId(traceId);
    toastService.success(`Trace ID kopyalandı: ${traceId.slice(0, 12)}...`);
    setTimeout(() => setCopiedTraceId(null), 2500);
  };

  return (
    <div className={styles.tabContent}>
      {/* Quick Level Filter Chips */}
      <div className={styles.quickFilterChips}>
        {LEVEL_CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            className={`${styles.filterChip} ${levelFilter === chip.id ? styles.filterChipActive : ''}`}
            onClick={() => {
              setLevelFilter(chip.id);
              setCurrentPage(1);
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Multi-Channel Filters Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarFilters}>
          {/* Search Box */}
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Eylem, hedef, aktör, IP veya Trace ID ara..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Category Filter */}
          <div className={styles.selectWrapper}>
            <select
              className={styles.adminSelect}
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Log Kategorisi Filtrele"
            >
              <option value="ALL">Tüm Kategoriler</option>
              <option value="SECURITY">SECURITY (Güvenlik)</option>
              <option value="CATALOG">CATALOG (Katalog)</option>
              <option value="GOVERNANCE">GOVERNANCE (Yönetişim)</option>
              <option value="AUTH">AUTH (Kimlik Doğrulama)</option>
              <option value="DATABASE">DATABASE (Veritabanı)</option>
              <option value="SYSTEM">SYSTEM (Sistem & Probe)</option>
            </select>
          </div>
        </div>

        {/* Export & Maintenance Actions */}
        <div className={styles.toolbarActions}>
          <button
            type="button"
            className={styles.actionBtnSecondary}
            onClick={handleExportCsv}
            disabled={!filteredLogs.length}
            title="CSV Olarak İndir"
          >
            <Download size={14} />
            <span>CSV</span>
          </button>

          <button
            type="button"
            className={styles.actionBtnSecondary}
            onClick={handleExportJson}
            disabled={!filteredLogs.length}
            title="JSON Olarak İndir"
          >
            <Download size={14} />
            <span>JSON</span>
          </button>

          <button
            type="button"
            className={styles.actionBtnDangerOutline}
            onClick={handleClearLogs}
            disabled={!safeLogs.length}
            title="Tüm Logları Temizle"
          >
            <Trash2 size={14} />
            <span>Temizle</span>
          </button>
        </div>
      </div>

      {/* Log Count Strip */}
      <div className={styles.logsMetaStrip}>
        <span>Toplam <strong>{filteredLogs.length}</strong> denetim kaydı listeleniyor (Toplam: {safeLogs.length})</span>
        <span className={styles.appendOnlyHint}>PostgreSQL 18 Append-Only Audit Stream & OpenTelemetry W3C Tracing</span>
      </div>

      {/* Logs Data Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>Seviye</th>
                <th>Zaman Damgası</th>
                <th>Kategori</th>
                <th>Eylem & Hedef Nesne</th>
                <th>Aktör (Kullanıcı / Sistem)</th>
                <th>İstemci IP</th>
                <th>Trace / xmin</th>
                <th style={{ textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.emptyTableTd}>
                    Filtre kriterlerine uygun denetim kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className={styles.logRow}>
                    <td>
                      <span className={`${styles.logLevelBadge} ${styles[log.level?.toLowerCase() || 'info']}`}>
                        {log.level || 'INFO'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.logTimeCell}>
                        <Clock size={12} className={styles.clockIcon} />
                        <span>{new Date(log.timestamp).toLocaleString('tr-TR')}</span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.logCategoryBadge}>{log.category || 'SYSTEM'}</span>
                    </td>
                    <td>
                      <div className={styles.logActionBlock}>
                        <strong className={styles.logActionText}>{log.action}</strong>
                        <span className={styles.logTargetText}>{log.target}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.actorCell}>
                        <User size={13} className={styles.actorIcon} />
                        <span>{log.actor}</span>
                        {log.actorRole && (
                          <span className={styles.roleTagSmall}>({log.actorRole})</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <code className={styles.ipCode}>{log.actorIp || '127.0.0.1'}</code>
                    </td>
                    <td>
                      <div className={styles.traceCell}>
                        {log.traceId ? (
                          <button
                            type="button"
                            className={styles.traceCopyBtn}
                            onClick={() => handleCopyTrace(log.traceId)}
                            title={`Trace ID: ${log.traceId} (Kopyalamak için tıkla)`}
                          >
                            {copiedTraceId === log.traceId ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                            <span>{log.traceId.slice(0, 8)}...</span>
                          </button>
                        ) : (
                          <span className={styles.xminPill}>xmin: {log.xmin || '49201'}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className={styles.rowActionsRight}>
                        <button
                          type="button"
                          className={styles.inspectBtn}
                          onClick={() => setInspectingLog(log)}
                          title="JSONB Değişiklik Farkını (Diff) ve Detayları Gör"
                        >
                          <Eye size={14} />
                          <span>Detay & Diff</span>
                        </button>

                        {log.oldValues && (
                          <button
                            type="button"
                            className={styles.revertBtnMini}
                            onClick={() => handleRevertLog(log.id)}
                            title="Bu değişikliği geri al (Revert to oldValues)"
                          >
                            <RotateCcw size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredLogs.length > 0 && (
          <div className={styles.paginationBar}>
            <div className={styles.paginationInfo}>
              <span>
                Toplam <strong>{filteredLogs.length}</strong> kayıttan <strong>{pageSize === 'all' ? filteredLogs.length : Math.min((currentPage - 1) * pageSize + 1, filteredLogs.length)}</strong> - <strong>{pageSize === 'all' ? filteredLogs.length : Math.min(currentPage * pageSize, filteredLogs.length)}</strong> arası gösteriliyor
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

      {/* JSONB Diff Inspection Modal */}
      {inspectingLog && (
        <JsonbDiffModal
          log={inspectingLog}
          onClose={() => setInspectingLog(null)}
          onRevert={handleRevertLog}
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
