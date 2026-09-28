import React, { useState, useMemo } from 'react';
import {
  Database,
  Terminal,
  History,
  Layers,
  Search,
  RefreshCw,
  Play,
  Download,
  CheckCircle2,
  AlertCircle,
  FileCode,
  ShieldCheck,
  Server,
  Zap,
} from 'lucide-react';
import {
  adminGetDatabaseStats,
  adminTriggerVacuum,
  adminGetTableSchema,
  adminGetMigrations,
  adminExecuteQuery,
} from '@/services/adminService';
import TableSchemaModal from '../modals/TableSchemaModal';
import styles from '../AdminDashboardPage.module.scss';

export default function DatabaseTab({
  tools = [],
  categories = [],
  users = [],
}) {
  const [subTab, setSubTab] = useState('tables'); // 'tables' | 'migrations' | 'query'
  const [tableSearch, setTableSearch] = useState('');
  const [selectedSchemaTable, setSelectedSchemaTable] = useState(null);
  const [vacuumLoading, setVacuumLoading] = useState({});
  const [vacuumFeedback, setVacuumFeedback] = useState(null);

  // SQL Query Runner state
  const [sqlInput, setSqlInput] = useState('SELECT id, name, category, rating, views FROM products ORDER BY rating DESC LIMIT 10;');
  const [queryResult, setQueryResult] = useState(() => {
    try {
      return adminExecuteQuery('SELECT id, name, category, rating, views FROM products ORDER BY rating DESC LIMIT 10;', {
        allTools: tools,
        allCategories: categories,
        allUsers: users,
      });
    } catch (e) {
      return null;
    }
  });
  const [queryError, setQueryError] = useState(null);
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);

  // Database stats & tables
  const dbStats = useMemo(() => {
    return adminGetDatabaseStats(tools, categories, users);
  }, [tools, categories, users, vacuumFeedback]);

  // Migrations
  const migrations = useMemo(() => adminGetMigrations(), []);

  // Filtered tables
  const filteredTables = useMemo(() => {
    return dbStats.tables.filter((t) =>
      t.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
      t.engine.toLowerCase().includes(tableSearch.toLowerCase())
    );
  }, [dbStats.tables, tableSearch]);

  // Trigger VACUUM
  const handleVacuum = (tableName) => {
    setVacuumLoading((prev) => ({ ...prev, [tableName]: true }));
    setTimeout(() => {
      try {
        const res = adminTriggerVacuum(tableName);
        setVacuumFeedback({
          tableName,
          message: `${tableName} tablosunda VACUUM (VERBOSE, ANALYZE) başarıyla tamamlandı. 0 dead tuples.`,
        });
        setTimeout(() => setVacuumFeedback(null), 4000);
      } catch (err) {
        alert('Vacuum hatası: ' + err.message);
      } finally {
        setVacuumLoading((prev) => ({ ...prev, [tableName]: false }));
      }
    }, 450);
  };

  // Run SQL query
  const handleExecuteQuery = (customSql) => {
    const q = customSql || sqlInput;
    setIsExecutingQuery(true);
    setQueryError(null);

    setTimeout(() => {
      try {
        const res = adminExecuteQuery(q, {
          allTools: tools,
          allCategories: categories,
          allUsers: users,
        });
        setQueryResult(res);
      } catch (err) {
        setQueryError(err.message);
        setQueryResult(null);
      } finally {
        setIsExecutingQuery(false);
      }
    }, 150);
  };

  // Export query result to CSV
  const handleExportCsv = () => {
    if (!queryResult || !queryResult.rows.length) return;
    const cols = queryResult.columns;
    const header = cols.join(',');
    const rows = queryResult.rows.map((r) =>
      cols.map((c) => JSON.stringify(r[c] ?? '')).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `guidora_query_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const PRESET_QUERIES = [
    { label: 'En Popüler 10 Araç', sql: 'SELECT id, name, category, rating, views FROM products ORDER BY rating DESC LIMIT 10;' },
    { label: 'Son 15 Denetim Kaydı', sql: 'SELECT id, action, entity, level, actor, timestamp FROM audit_logs ORDER BY created_at DESC LIMIT 15;' },
    { label: 'Bekleyen Teklifler', sql: 'SELECT id, toolName, proposer, status, summary FROM product_edit_proposals;' },
    { label: 'Kategori Dağılımı', sql: 'SELECT id, name, color, isPopular, toolsCount FROM categories;' },
    { label: 'Kayıtlı Kullanıcılar', sql: 'SELECT id, username, email, role, reputation FROM users;' },
  ];

  return (
    <div className={styles.tabContent}>
      {/* DB Cluster Overview Banner */}
      <div className={styles.dbClusterBanner}>
        <div className={styles.dbClusterInfo}>
          <div className={styles.dbClusterTitleRow}>
            <Database size={24} className={styles.dbClusterIcon} />
            <div>
              <h2 className={styles.dbClusterName}>{dbStats.databaseName}</h2>
              <p className={styles.dbClusterVersion}>{dbStats.serverVersion}</p>
            </div>
          </div>

          <div className={styles.dbClusterMetricsGrid}>
            <div className={styles.dbMetricCard}>
              <span className={styles.dbMetricLabel}>Aktif Bağlantı Havuzu</span>
              <span className={styles.dbMetricVal}>{dbStats.connectionPool.active} / {dbStats.connectionPool.max}</span>
              <span className={styles.dbMetricSub}>Npgsql Pool %{dbStats.connectionPool.utilizationPercent}</span>
            </div>

            <div className={styles.dbMetricCard}>
              <span className={styles.dbMetricLabel}>Buffer Cache Hit Ratio</span>
              <span className={styles.dbMetricVal}>{dbStats.cacheHitRatio}</span>
              <span className={styles.dbMetricSub}>Optimal Paylaşımlı Bellek</span>
            </div>

            <div className={styles.dbMetricCard}>
              <span className={styles.dbMetricLabel}>Toplam Tablolar</span>
              <span className={styles.dbMetricVal}>{dbStats.tablesTotalCount} Tablo</span>
              <span className={styles.dbMetricSub}>public şeması</span>
            </div>

            <div className={styles.dbMetricCard}>
              <span className={styles.dbMetricLabel}>Toplam Boyut</span>
              <span className={styles.dbMetricVal}>
                {(dbStats.totalSizeBytes / 1024 / 1024).toFixed(2)} MB
              </span>
              <span className={styles.dbMetricSub}>PostgreSQL 18 NVMe</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className={styles.subTabNav}>
        <button
          type="button"
          className={`${styles.subTabBtn} ${subTab === 'tables' ? styles.active : ''}`}
          onClick={() => setSubTab('tables')}
        >
          <Layers size={16} />
          <span>Tablo Depolama & VACUUM</span>
        </button>

        <button
          type="button"
          className={`${styles.subTabBtn} ${subTab === 'migrations' ? styles.active : ''}`}
          onClick={() => setSubTab('migrations')}
        >
          <History size={16} />
          <span>EF Core 10 Migrations ({migrations.length})</span>
        </button>

        <button
          type="button"
          className={`${styles.subTabBtn} ${subTab === 'query' ? styles.active : ''}`}
          onClick={() => setSubTab('query')}
        >
          <Terminal size={16} />
          <span>Güvenli SQL Sorgu Gezgini</span>
        </button>
      </div>

      {/* Sub-Tab Content */}

      {/* 1. TABLES & VACUUM */}
      {subTab === 'tables' && (
        <div className={styles.tableStorageSection}>
          {/* Action Notification */}
          {vacuumFeedback && (
            <div className={styles.alertSuccess}>
              <CheckCircle2 size={16} />
              <span>{vacuumFeedback.message}</span>
            </div>
          )}

          {/* Filter Bar */}
          <div className={styles.toolbar}>
            <div className={styles.searchWrapper}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Tablo adına göre filtrele (örn. products, audit_logs)..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
              />
            </div>
            <div className={styles.toolbarInfo}>
              <span>{filteredTables.length} tablo listeleniyor</span>
            </div>
          </div>

          {/* Tables Data Grid */}
          <div className={styles.tableCard}>
            <div className={styles.tableResponsive}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>Tablo Adı (Şema)</th>
                    <th>Depolama Motoru</th>
                    <th>Tahmini Satır</th>
                    <th>Tablo Boyutu</th>
                    <th>İndeks Boyutu</th>
                    <th>Toplam Boyut</th>
                    <th>Dead Tuples</th>
                    <th>Son Auto-Vacuum</th>
                    <th>Durum</th>
                    <th style={{ textAlign: 'right' }}>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTables.map((tbl) => (
                    <tr key={tbl.name}>
                      <td>
                        <div className={styles.tableNameCell}>
                          <Database size={15} className={styles.tableRowIcon} />
                          <div>
                            <div className={styles.tableNameMain}>
                              {tbl.schema}.<strong>{tbl.name}</strong>
                            </div>
                            <span className={styles.tableIdxCount}>{tbl.indexesCount} indeks</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={styles.engineBadge}>{tbl.engine}</span>
                      </td>
                      <td>
                        <strong>{tbl.rowCount.toLocaleString()}</strong>
                      </td>
                      <td>{tbl.tableSize}</td>
                      <td>{tbl.indexSize}</td>
                      <td>
                        <strong>{tbl.totalSize}</strong>
                      </td>
                      <td>
                        <span className={tbl.deadTuples > 5 ? styles.deadTuplesWarn : styles.deadTuplesOk}>
                          {tbl.deadTuples}
                        </span>
                      </td>
                      <td>
                        <span className={styles.vacuumTime}>{tbl.lastVacuum}</span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[tbl.status.toLowerCase()]}`}>
                          {tbl.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className={styles.rowActionsRight}>
                          <button
                            type="button"
                            className={styles.actionBtnSecondary}
                            onClick={() => setSelectedSchemaTable(tbl.name)}
                            title="Tablo Şemasını İncele (Sütunlar & İndeksler)"
                          >
                            <FileCode size={14} />
                            <span>Şema</span>
                          </button>

                          <button
                            type="button"
                            className={styles.actionBtnVacuum}
                            disabled={vacuumLoading[tbl.name]}
                            onClick={() => handleVacuum(tbl.name)}
                            title="VACUUM ANALYZE Çalıştır"
                          >
                            <RefreshCw
                              size={14}
                              className={vacuumLoading[tbl.name] ? styles.spinIcon : ''}
                            />
                            <span>{vacuumLoading[tbl.name] ? 'İşleniyor...' : 'VACUUM'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. EF CORE MIGRATIONS TIMELINE */}
      {subTab === 'migrations' && (
        <div className={styles.migrationsSection}>
          <div className={styles.migrationsIntro}>
            <div className={styles.introLeft}>
              <h3 className={styles.sectionHeading}>Entity Framework Core 10 Şema Geçişleri</h3>
              <p className={styles.sectionSubtext}>
                `__EFMigrationsHistory` tablosu üzerinde kayıtlı ve PostgreSQL 18'e atomik transaction ile uygulanan migration zinciri.
              </p>
            </div>
            <div className={styles.introRight}>
              <span className={styles.appliedCountBadge}>
                <CheckCircle2 size={14} /> {migrations.length} Migration Aktif & Senkron
              </span>
            </div>
          </div>

          <div className={styles.timelineWrapper}>
            {migrations.map((mig, idx) => (
              <div key={mig.migrationId} className={styles.timelineItem}>
                <div className={styles.timelineLine} />
                <div className={styles.timelineMarker}>
                  <CheckCircle2 size={16} color="#10b981" />
                </div>
                <div className={styles.timelineCard}>
                  <div className={styles.timelineHeader}>
                    <div className={styles.migrationTitleRow}>
                      <code className={styles.migrationIdCode}>{mig.migrationId}</code>
                      <span className={styles.migrationStatusPill}>{mig.status}</span>
                    </div>
                    <span className={styles.appliedDate}>{mig.appliedAt}</span>
                  </div>
                  <p className={styles.migrationDesc}>{mig.description}</p>
                  <div className={styles.migrationFooter}>
                    <span className={styles.productVersion}>{mig.productVersion}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. SAFE READ-ONLY SQL QUERY RUNNER */}
      {subTab === 'query' && (
        <div className={styles.queryRunnerSection}>
          <div className={styles.queryHeaderRow}>
            <div>
              <h3 className={styles.sectionHeading}>Güvenli SQL Sorgu Çalıştırıcısı (Safe Read-Only)</h3>
              <p className={styles.sectionSubtext}>
                PostgreSQL 18 motorunda salt-okunur (SELECT) analitik sorguları çalıştırabilir, performansı ölçebilir ve CSV olarak dışa aktarabilirsiniz.
              </p>
            </div>
          </div>

          {/* Preset Queries Bar */}
          <div className={styles.presetQueriesBar}>
            <span className={styles.presetLabel}>Hazır Sorgular:</span>
            <div className={styles.presetPills}>
              {PRESET_QUERIES.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={styles.presetPill}
                  onClick={() => {
                    setSqlInput(p.sql);
                    handleExecuteQuery(p.sql);
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* SQL Editor Box */}
          <div className={styles.sqlEditorCard}>
            <div className={styles.editorToolbar}>
              <div className={styles.editorLang}>
                <Terminal size={14} />
                <span>SQL / PostgreSQL 18 Dialect</span>
              </div>
              <button
                type="button"
                className={styles.runQueryBtn}
                onClick={() => handleExecuteQuery()}
                disabled={isExecutingQuery}
              >
                <Play size={14} />
                <span>{isExecutingQuery ? 'Çalıştırılıyor...' : 'Sorguyu Çalıştır (F5)'}</span>
              </button>
            </div>

            <textarea
              className={styles.sqlTextarea}
              rows={4}
              value={sqlInput}
              onChange={(e) => setSqlInput(e.target.value)}
              placeholder="SELECT * FROM products WHERE is_verified = true;"
              spellCheck="false"
            />
          </div>

          {/* Query Error Notice */}
          {queryError && (
            <div className={styles.alertDanger}>
              <AlertCircle size={16} />
              <span>{queryError}</span>
            </div>
          )}

          {/* Query Results Data Grid */}
          {queryResult && (
            <div className={styles.queryResultCard}>
              <div className={styles.resultHeader}>
                <div className={styles.resultMeta}>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>Sorgu Başarılı: <strong>{queryResult.rowCount} satır</strong> döndü</span>
                  <span className={styles.execTime}>({queryResult.executionTimeMs} ms)</span>
                </div>

                <button
                  type="button"
                  className={styles.exportCsvBtn}
                  onClick={handleExportCsv}
                  disabled={!queryResult.rows.length}
                >
                  <Download size={14} />
                  <span>CSV Dışa Aktar</span>
                </button>
              </div>

              <div className={styles.tableResponsive}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      {queryResult.columns.map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.rows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {queryResult.columns.map((col) => (
                          <td key={col}>
                            {typeof row[col] === 'boolean' ? (
                              row[col] ? 'true' : 'false'
                            ) : typeof row[col] === 'object' && row[col] !== null ? (
                              <code>{JSON.stringify(row[col])}</code>
                            ) : (
                              String(row[col] ?? '')
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schema Detail Modal */}
      {selectedSchemaTable && (
        <TableSchemaModal
          tableName={selectedSchemaTable}
          schema={adminGetTableSchema(selectedSchemaTable)}
          onClose={() => setSelectedSchemaTable(null)}
        />
      )}
    </div>
  );
}
