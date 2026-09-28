import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Server,
  Terminal,
  Activity,
  User,
  Clock,
} from 'lucide-react';
import {
  adminGetLogs,
  adminAddLog,
  adminClearLogs,
  adminRevertAuditLog,
} from '@/services/adminService';
import JsonbDiffModal from '../modals/JsonbDiffModal';
import styles from '../AdminDashboardPage.module.scss';

export default function LogsTab({
  logs = [],
  onRefreshLogs,
}) {
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [inspectingLog, setInspectingLog] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (levelFilter !== 'ALL' && log.level !== levelFilter) {
        return false;
      }
      if (categoryFilter !== 'ALL' && log.category !== categoryFilter) {
        return false;
      }
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
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
  }, [logs, levelFilter, categoryFilter, searchTerm]);

  // Handle Audit Revert
  const handleRevertLog = (logId) => {
    try {
      const res = adminRevertAuditLog(logId);
      setFeedback({
        type: 'success',
        message: `Değişiklik başarıyla geri alındı (xmin senkronize edildi). Yeni denetim kaydı oluşturuldu.`,
      });
      if (onRefreshLogs) onRefreshLogs();
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      alert('Geri alma başarısız: ' + err.message);
    }
  };

  // Export to JSON
  const handleExportJson = () => {
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', jsonStr);
    dlAnchor.setAttribute('download', `guidora_audit_logs_${Date.now()}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    document.body.removeChild(dlAnchor);
  };

  // Export to CSV
  const handleExportCsv = () => {
    const cols = ['id', 'level', 'category', 'action', 'target', 'actor', 'actorRole', 'actorIp', 'traceId', 'xmin', 'timestamp'];
    const header = cols.join(',');
    const rows = filteredLogs.map((l) =>
      cols.map((c) => JSON.stringify(l[c] ?? '')).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `guidora_audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear Logs
  const handleClearLogs = () => {
    if (window.confirm('Tüm denetim kayıtları temizlensin mi? Bu işlem geri alınamaz.')) {
      adminClearLogs();
      if (onRefreshLogs) onRefreshLogs();
      setFeedback({
        type: 'info',
        message: 'Denetim kayıtları temizlendi.',
      });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className={styles.tabContent}>
      {/* Feedback Banner */}
      {feedback && (
        <div className={feedback.type === 'success' ? styles.alertSuccess : styles.alertInfo}>
          <CheckCircle2 size={16} />
          <span>{feedback.message}</span>
        </div>
      )}

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
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Level Filter */}
          <div className={styles.selectWrapper}>
            <select
              className={styles.adminSelect}
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              aria-label="Log Seviyesi Filtrele"
            >
              <option value="ALL">Tüm Seviyeler</option>
              <option value="CRITICAL">CRITICAL (Kritik)</option>
              <option value="ERROR">ERROR (Hata)</option>
              <option value="WARN">WARN (Uyarı)</option>
              <option value="AUDIT">AUDIT (Denetim)</option>
              <option value="INFO">INFO (Bilgi)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className={styles.selectWrapper}>
            <select
              className={styles.adminSelect}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
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
            disabled={!logs.length}
            title="Tüm Logları Temizle"
          >
            <Trash2 size={14} />
            <span>Temizle</span>
          </button>
        </div>
      </div>

      {/* Log Count Strip */}
      <div className={styles.logsMetaStrip}>
        <span>Toplam <strong>{filteredLogs.length}</strong> denetim kaydı listeleniyor (Toplam: {logs.length})</span>
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
                <th>xmin</th>
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
                filteredLogs.map((log) => (
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
                      <span className={styles.xminPill}>{log.xmin || '49201'}</span>
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
      </div>

      {/* JSONB Diff Inspection Modal */}
      {inspectingLog && (
        <JsonbDiffModal
          log={inspectingLog}
          onClose={() => setInspectingLog(null)}
          onRevert={handleRevertLog}
        />
      )}
    </div>
  );
}
