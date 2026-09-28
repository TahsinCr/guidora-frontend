import React from 'react';
import { X, Database, Key, Layers, Shield } from 'lucide-react';
import styles from '../AdminDashboardPage.module.scss';

export default function TableSchemaModal({
  tableName,
  schema = [],
  onClose,
}) {
  if (!tableName) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={`${styles.modalContainer} ${styles.schemaModal}`} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderInfo}>
            <div className={styles.modalBadgeRow}>
              <span className={styles.schemaDbBadge}>
                <Database size={13} />
                PostgreSQL 18.0
              </span>
              <span className={styles.schemaSchemaBadge}>schema: public</span>
            </div>
            <h2 className={styles.modalTitle}>
              Tablo Şeması: <span className={styles.tableNameHighlight}>{tableName}</span>
            </h2>
          </div>

          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label="Kapat"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          <div className={styles.schemaInfoCard}>
            <div className={styles.schemaStat}>
              <span className={styles.schemaStatLabel}>Sütun Sayısı:</span>
              <span className={styles.schemaStatVal}>{schema.length}</span>
            </div>
            <div className={styles.schemaStat}>
              <span className={styles.schemaStatLabel}>Birincil Anahtar:</span>
              <span className={styles.schemaStatVal}>
                {schema.find((c) => c.key === 'PK')?.column || 'None'}
              </span>
            </div>
            <div className={styles.schemaStat}>
              <span className={styles.schemaStatLabel}>Eşzamanlılık Belirteci (Concurrency):</span>
              <span className={styles.schemaStatVal}>
                {schema.find((c) => c.key === 'SYS')?.column ? 'xmin (PostgreSQL MVCC xid)' : 'Optimistic'}
              </span>
            </div>
          </div>

          <div className={styles.schemaTableWrapper}>
            <table className={styles.schemaTable}>
              <thead>
                <tr>
                  <th>Sütun Adı</th>
                  <th>Veri Tipi</th>
                  <th>Boş Olabilir (Null)</th>
                  <th>Anahtar</th>
                  <th>Varsayılan</th>
                  <th>İndeks / Açıklama</th>
                </tr>
              </thead>
              <tbody>
                {schema.map((col, idx) => (
                  <tr key={idx}>
                    <td>
                      <code className={styles.columnNameCode}>{col.column}</code>
                    </td>
                    <td>
                      <span className={styles.typeBadge}>{col.type}</span>
                    </td>
                    <td>
                      <span className={col.nullable ? styles.nullYes : styles.nullNo}>
                        {col.nullable ? 'NULL' : 'NOT NULL'}
                      </span>
                    </td>
                    <td>
                      {col.key ? (
                        <span className={`${styles.keyBadge} ${styles[col.key.toLowerCase()]}`}>
                          <Key size={11} />
                          {col.key}
                        </span>
                      ) : (
                        <span className={styles.dash}>-</span>
                      )}
                    </td>
                    <td>
                      <code className={styles.defaultValueCode}>
                        {col.default || '-'}
                      </code>
                    </td>
                    <td>
                      <span className={styles.indexInfo}>
                        {col.index || col.note || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
