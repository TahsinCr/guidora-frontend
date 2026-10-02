import React from 'react';
import { X, Database, Key, Layers, Shield } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import styles from '../AdminDashboardPage.module.scss';

export default function TableSchemaModal({
  tableName,
  schema = [],
  onClose,
}) {
  const { t } = useLanguage();

  if (!tableName) return null;

  const pkColumn = schema.find((c) => c.key === 'PK')?.column || 'None';
  const concurrencyToken = schema.find((c) => c.key === 'SYS' || c.column === 'xmin' || c.column === 'version')?.column
    ? 'TxID / Version (Optimistic Concurrency)'
    : 'Optimistic (Row Version)';

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={`${styles.modalContainer} ${styles.schemaModal}`} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderInfo}>
            <div className={styles.modalBadgeRow}>
              <span className={styles.schemaDbBadge}>
                <Database size={13} />
                {t('admin.schemaContractBadge', 'İlişkisel Veri Sözleşmesi')}
              </span>
              <span className={styles.schemaSchemaBadge}>schema: public</span>
            </div>
            <h2 className={styles.modalTitle}>
              {t('admin.tableSchemaTitle', 'Tablo Şeması')}: <span className={styles.tableNameHighlight}>{tableName}</span>
            </h2>
          </div>

          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label={t('admin.close', 'Kapat')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          <div className={styles.schemaInfoCard}>
            <div className={styles.schemaStat}>
              <span className={styles.schemaStatLabel}>{t('admin.schemaColumnCount', 'Sütun Sayısı:')}</span>
              <span className={styles.schemaStatVal}>{schema.length}</span>
            </div>
            <div className={styles.schemaStat}>
              <span className={styles.schemaStatLabel}>{t('admin.schemaPrimaryKey', 'Birincil Anahtar:')}</span>
              <span className={styles.schemaStatVal}>{pkColumn}</span>
            </div>
            <div className={styles.schemaStat}>
              <span className={styles.schemaStatLabel}>{t('admin.schemaConcurrencyToken', 'Eşzamanlılık Belirteci (Concurrency):')}</span>
              <span className={styles.schemaStatVal}>{concurrencyToken}</span>
            </div>
          </div>

          <div className={styles.schemaTableWrapper}>
            <table className={styles.schemaTable}>
              <thead>
                <tr>
                  <th>{t('admin.schemaColName', 'Sütun Adı')}</th>
                  <th>{t('admin.schemaColType', 'Veri Tipi')}</th>
                  <th>{t('admin.schemaColNullable', 'Boş Olabilir (Null)')}</th>
                  <th>{t('admin.schemaColKey', 'Anahtar')}</th>
                  <th>{t('admin.schemaColDefault', 'Varsayılan')}</th>
                  <th>{t('admin.schemaColIndexNotes', 'İndeks / Açıklama')}</th>
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
                        {col.index || col.note || col.description || '-'}
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
            {t('admin.close', 'Kapat')}
          </button>
        </div>
      </div>
    </div>
  );
}
