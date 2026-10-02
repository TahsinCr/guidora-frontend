import React, { useState, useMemo } from 'react';
import {
  Code,
  Search,
  Copy,
  Play,
  FileCode,
  Zap,
  X,
} from 'lucide-react';
import { API_MODULES, getAllApiEndpoints } from '@/services/api/apiCatalog';
import { adminGetSystemHealth } from '@/services/adminService';
import toastService from '@/services/toast/toastService';
import { useLanguage } from '@/context/LanguageContext';
import styles from '../AdminDashboardPage.module.scss';

export default function SchemaTab() {
  const { t } = useLanguage();
  const [selectedModuleId, setSelectedModuleId] = useState('ALL');
  const [endpointSearch, setEndpointSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [simulatedEndpoint, setSimulatedEndpoint] = useState(null);
  const [simulatedResponse, setSimulatedResponse] = useState(null);

  const allEndpoints = useMemo(() => getAllApiEndpoints(), []);
  const systemHealth = useMemo(() => adminGetSystemHealth(), []);

  // Filter endpoints by module, search query, and HTTP method
  const filteredEndpoints = useMemo(() => {
    return allEndpoints.filter((ep) => {
      const matchModule = selectedModuleId === 'ALL' || ep.moduleId === selectedModuleId;
      const q = endpointSearch.toLowerCase();
      const matchSearch =
        !q ||
        ep.path.toLowerCase().includes(q) ||
        ep.summary.toLowerCase().includes(q) ||
        ep.description.toLowerCase().includes(q) ||
        ep.handlerName.toLowerCase().includes(q);
      const matchMethod = methodFilter === 'ALL' || ep.method === methodFilter;
      return matchModule && matchSearch && matchMethod;
    });
  }, [allEndpoints, selectedModuleId, endpointSearch, methodFilter]);

  const handleCopyCode = (data, successMsg) => {
    if (!data) return;
    navigator.clipboard?.writeText(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    toastService.success(t('admin.copied', 'Kopyalandı'), successMsg || 'Panoya başarıyla kopyalandı.');
  };

  const handleSimulateApi = (endpoint) => {
    setSimulatedEndpoint(endpoint.id);
    const mockLatency = Math.floor(6 + Math.random() * 8);
    setSimulatedResponse({
      endpointId: endpoint.id,
      path: endpoint.path,
      method: endpoint.method,
      status: '200 OK',
      data: endpoint.sampleResponse,
      latencyMs: mockLatency,
      timestamp: new Date().toISOString(),
    });
    toastService.info('API Simülasyonu', `${endpoint.method} ${endpoint.path} simüle edildi (${mockLatency}ms).`);
  };

  return (
    <div className={styles.tabContent}>
      {/* Top Professional API Gateway Header Banner */}
      <div className={styles.dbClusterBanner}>
        <div className={styles.clusterInfo}>
          <div className={styles.clusterIconWrap}>
            <Zap size={26} className={styles.clusterIcon} />
          </div>
          <div>
            <div className={styles.clusterTitleRow}>
              <h2 className={styles.clusterName}>{t('admin.schemaTitle', 'REST API Sözleşmeleri & Bağlantı Kataloğu')}</h2>
              <span className={styles.clusterBadge}>SOLID & Modüler Entegrasyon</span>
            </div>
            <p className={styles.clusterSub}>
              Tüm uç noktalar istemci arka plan servisleri (`/src/services/api/*`) ile tam senkronizedir. İstemci katmanı doğrudan standart REST/JSON sözleşmeleri üzerinden konuşur.
            </p>
          </div>
        </div>

        {/* Live Gauges */}
        <div className={styles.clusterMetricsGrid}>
          <div className={styles.clusterMetricCard}>
            <div className={styles.clusterMetricLabel}>Toplam API Uç Noktası</div>
            <div className={styles.clusterMetricValue}>{allEndpoints.length} Endpoint</div>
            <div className={styles.clusterMetricSub}>{API_MODULES.length} Servis Modülü</div>
          </div>
          <div className={styles.clusterMetricCard}>
            <div className={styles.clusterMetricLabel}>API Sağlığı & Gecikme</div>
            <div className={styles.clusterMetricValue} style={{ color: '#10B981' }}>{systemHealth.latencyMs || 8} ms</div>
            <div className={styles.clusterMetricSub}>Circuit: {systemHealth.circuitBreaker || 'CLOSED'}</div>
          </div>
          <div className={styles.clusterMetricCard}>
            <div className={styles.clusterMetricLabel}>Önbellek & Uptime</div>
            <div className={styles.clusterMetricValue} style={{ color: '#818cf8' }}>{systemHealth.uptime || '99.98%'}</div>
            <div className={styles.clusterMetricSub}>Hit Ratio: {systemHealth.cacheHitRatio || '99.4%'}</div>
          </div>
        </div>
      </div>

      {/* Module Pill Tabs */}
      <div className={styles.dbSubNav}>
        <button
          type="button"
          className={`${styles.dbSubNavBtn} ${selectedModuleId === 'ALL' ? styles.active : ''}`}
          onClick={() => setSelectedModuleId('ALL')}
        >
          <Code size={15} />
          <span>Tüm Modüller ({allEndpoints.length})</span>
        </button>
        {API_MODULES.map((mod) => {
          const isActive = selectedModuleId === mod.id;
          return (
            <button
              key={mod.id}
              type="button"
              className={`${styles.dbSubNavBtn} ${isActive ? styles.active : ''}`}
              onClick={() => setSelectedModuleId(mod.id)}
            >
              <FileCode size={15} />
              <span>{mod.name} ({mod.endpoints.length})</span>
            </button>
          );
        })}
      </div>

      {/* API Filters Bar */}
      <div className={styles.endpointsWrapper}>
        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} aria-hidden="true" />
            <input
              type="text"
              placeholder="Uç nokta, metot, yol veya servis fonksiyonu ara..."
              value={endpointSearch}
              onChange={(e) => setEndpointSearch(e.target.value)}
              className={styles.filterSearchInput}
              aria-label="API uç noktalarında ara"
            />
            {endpointSearch && (
              <button
                type="button"
                className={styles.searchClearBtn}
                onClick={() => setEndpointSearch('')}
                aria-label="Aramayı temizle"
                title="Aramayı temizle"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className={styles.methodPillGroup}>
            {['ALL', 'GET', 'POST', 'PUT', 'DELETE'].map((m) => (
              <button
                key={m}
                type="button"
                className={`${styles.methodFilterBtn} ${methodFilter === m ? styles.active : ''}`}
                onClick={() => setMethodFilter(m)}
              >
                {m === 'ALL' ? 'TÜMÜ' : m}
              </button>
            ))}
          </div>
        </div>

        {/* Endpoints List */}
        <div className={styles.endpointCardList}>
          {filteredEndpoints.length === 0 ? (
            <div className={styles.emptyTableTd} style={{ textAlign: 'center', padding: '48px 20px' }}>
              Arama kriterlerine uygun API sözleşmesi bulunamadı.
            </div>
          ) : (
            filteredEndpoints.map((ep) => {
              const isSimulated = simulatedEndpoint === ep.id && simulatedResponse;

              return (
                <div key={ep.id} className={styles.endpointCard}>
                  <div className={styles.endpointCardHeader}>
                    <div className={styles.endpointPathBlock}>
                      <span className={`${styles.methodBadge} ${styles[ep.method.toLowerCase()]}`}>
                        {ep.method}
                      </span>
                      <code className={styles.endpointPath}>{ep.path}</code>
                    </div>

                    <div className={styles.endpointMetaRight}>
                      <span className={styles.authBadge}>{ep.authLevel}</span>
                      <button
                        type="button"
                        className={styles.simulateBtn}
                        onClick={() => handleSimulateApi(ep)}
                      >
                        <Play size={13} />
                        <span>Simüle Et</span>
                      </button>
                    </div>
                  </div>

                  <div className={styles.endpointBody}>
                    <div className={styles.endpointSummary}>{ep.summary}</div>
                    <div className={styles.endpointDesc}>{ep.description}</div>

                    {/* Service Handler Binding Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      <span>Servis Katmanı:</span>
                      <code style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '2px 7px', borderRadius: '4px', color: '#818cf8' }}>
                        {ep.serviceFile} → {ep.handlerName}()
                      </code>
                    </div>

                    {/* Query Params */}
                    {ep.queryParams?.length > 0 && (
                      <div className={styles.paramSection}>
                        <div className={styles.paramTitle}>Query Parametreleri:</div>
                        <div className={styles.paramPills}>
                          {ep.queryParams.map((qp, qIdx) => (
                            <span key={qIdx} className={styles.paramPill}>
                              <code>{qp.name}</code> ({qp.type}) {qp.required ? '*' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sample Request Body */}
                    {ep.sampleRequest && (
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                          Örnek İstek Gövdesi (Request Body):
                        </div>
                        <pre className={styles.simulatedCode} style={{ maxHeight: '110px' }}>
                          {JSON.stringify(ep.sampleRequest, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Simulated Response Box */}
                    {isSimulated && (
                      <div className={styles.simulatedBox}>
                        <div className={styles.simulatedHeader}>
                          <div className={styles.simulatedStatusRow}>
                            <span className={styles.statusCodeBadge}>200 OK</span>
                            <span className={styles.simulatedLatency}>
                              Gecikme: {simulatedResponse.latencyMs}ms
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={styles.simulatedTime}>
                              {simulatedResponse.timestamp.slice(11, 19)}
                            </span>
                            <button
                              type="button"
                              className={styles.copyJsonBtn}
                              style={{ padding: '2px 8px', fontSize: '11px' }}
                              onClick={() => handleCopyCode(simulatedResponse.data, 'Simüle edilen yanıt kopyalandı.')}
                              title="Yanıtı Kopyala"
                            >
                              <Copy size={11} />
                              <span>Kopyala</span>
                            </button>
                          </div>
                        </div>
                        <pre className={styles.simulatedCode}>
                          {JSON.stringify(simulatedResponse.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
