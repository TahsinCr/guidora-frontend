import React, { useState, useMemo } from 'react';
import {
  Layers,
  FileCode,
  Network,
  Search,
  Copy,
  Check,
  Play,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Code,
  Database,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  adminGetEntitySchemas,
  adminGetApiEndpoints,
  adminGetSystemHealth,
} from '@/services/adminService';
import styles from '../AdminDashboardPage.module.scss';

export default function SchemaTab({ tools = [], categories = [] }) {
  const [subTab, setSubTab] = useState('entities'); // 'entities' | 'endpoints' | 'architecture'
  const [selectedEntityKey, setSelectedEntityKey] = useState('products');
  const [endpointSearch, setEndpointSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [simulatedEndpoint, setSimulatedEndpoint] = useState(null);
  const [simulatedResponse, setSimulatedResponse] = useState(null);

  const schemas = useMemo(() => adminGetEntitySchemas(), []);
  const endpoints = useMemo(() => adminGetApiEndpoints(), []);
  const systemHealth = useMemo(() => adminGetSystemHealth(), []);

  const selectedEntity = schemas[selectedEntityKey] || schemas.products;

  const filteredEndpoints = useMemo(() => {
    return endpoints.filter((ep) => {
      const matchSearch =
        ep.path.toLowerCase().includes(endpointSearch.toLowerCase()) ||
        ep.summary.toLowerCase().includes(endpointSearch.toLowerCase());
      const matchMethod = methodFilter === 'ALL' || ep.method === methodFilter;
      return matchSearch && matchMethod;
    });
  }, [endpoints, endpointSearch, methodFilter]);

  const handleCopyPayload = (payload) => {
    navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleSimulateApi = (endpoint) => {
    setSimulatedEndpoint(endpoint.path);
    setSimulatedResponse({
      status: endpoint.responseCodes[0] || '200 OK',
      data: endpoint.sampleResponse,
      latencyMs: Math.floor(6 + Math.random() * 8),
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className={styles.tabContent}>
      {/* Top Architecture Overview Banner */}
      <div className={styles.dbClusterBanner}>
        <div className={styles.clusterInfo}>
          <div className={styles.clusterIconWrap}>
            <Layers size={28} className={styles.clusterIcon} />
          </div>
          <div>
            <div className={styles.clusterTitleRow}>
              <h2 className={styles.clusterName}>Veri Modeli & REST API Tasarımı</h2>
              <span className={styles.clusterBadge}>Teknoloji Bağımsız Sözleşme Mimarisi</span>
            </div>
            <p className={styles.clusterSub}>
              Guidora istemcisi, arka uç teknolojisinden (Java Spring Boot, .NET WebAPI, Go, Python) bağımsız standart RESTful API sözleşmeleriyle çalışır.
            </p>
          </div>
        </div>

        {/* Global Architecture Health Gauges */}
        <div className={styles.clusterMetricsGrid}>
          <div className={styles.clusterMetricCard}>
            <div className={styles.clusterMetricLabel}>Varlık Modelleri</div>
            <div className={styles.clusterMetricValue}>{Object.keys(schemas).length} Model</div>
            <div className={styles.clusterMetricSub}>Temel Domain Varlıkları</div>
          </div>
          <div className={styles.clusterMetricCard}>
            <div className={styles.clusterMetricLabel}>REST Uç Noktaları</div>
            <div className={styles.clusterMetricValue}>{endpoints.length} API</div>
            <div className={styles.clusterMetricSub}>Açık Sözleşmeler</div>
          </div>
          <div className={styles.clusterMetricCard}>
            <div className={styles.clusterMetricLabel}>API Sağlığı & Gecikme</div>
            <div className={styles.clusterMetricValue} style={{ color: '#10B981' }}>{systemHealth.latencyMs} ms</div>
            <div className={styles.clusterMetricSub}>Circuit: {systemHealth.circuitBreaker}</div>
          </div>
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div className={styles.dbSubNav}>
        <button
          type="button"
          className={`${styles.dbSubNavBtn} ${subTab === 'entities' ? styles.active : ''}`}
          onClick={() => setSubTab('entities')}
        >
          <Layers size={15} />
          <span>Varlık Modelleri ({Object.keys(schemas).length})</span>
        </button>
        <button
          type="button"
          className={`${styles.dbSubNavBtn} ${subTab === 'endpoints' ? styles.active : ''}`}
          onClick={() => setSubTab('endpoints')}
        >
          <Code size={15} />
          <span>REST API Sözleşmeleri ({endpoints.length})</span>
        </button>
        <button
          type="button"
          className={`${styles.dbSubNavBtn} ${subTab === 'architecture' ? styles.active : ''}`}
          onClick={() => setSubTab('architecture')}
        >
          <Network size={15} />
          <span>Mimari Tasarım & İlişki Haritası</span>
        </button>
      </div>

      {/* SUB-TAB 1: DOMAIN ENTITIES & FIELDS */}
      {subTab === 'entities' && (
        <div className={styles.schemaLayout}>
          {/* Left: Entity Selector Pills */}
          <div className={styles.schemaEntityList}>
            <div className={styles.schemaEntityHeader}>Domain Varlıkları</div>
            {Object.entries(schemas).map(([key, ent]) => {
              const isActive = selectedEntityKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  className={`${styles.schemaEntityItem} ${isActive ? styles.active : ''}`}
                  onClick={() => setSelectedEntityKey(key)}
                >
                  <div className={styles.entityItemMain}>
                    <div className={styles.entityItemName}>{ent.name}</div>
                    <div className={styles.entityItemSub}>{ent.pluralName}</div>
                  </div>
                  <span className={styles.entityFieldCount}>{ent.fields.length} alan</span>
                </button>
              );
            })}
          </div>

          {/* Right: Entity Detail & Field Definition Table */}
          <div className={styles.schemaDetailPanel}>
            <div className={styles.entityHeaderCard}>
              <div className={styles.entityMetaRow}>
                <div>
                  <h3 className={styles.entityTitle}>{selectedEntity.name}</h3>
                  <p className={styles.entityDesc}>{selectedEntity.description}</p>
                </div>
                <button
                  type="button"
                  className={styles.copyJsonBtn}
                  onClick={() => handleCopyPayload(selectedEntity.samplePayload)}
                >
                  {copiedPayload ? <Check size={14} className={styles.greenText} /> : <Copy size={14} />}
                  <span>{copiedPayload ? 'Kopyalandı' : 'JSON Şablonunu Kopyala'}</span>
                </button>
              </div>

              {/* Relationships */}
              {selectedEntity.relationships?.length > 0 && (
                <div className={styles.relationRow}>
                  <span className={styles.relationLabel}>İlişkiler:</span>
                  {selectedEntity.relationships.map((rel, idx) => (
                    <span key={idx} className={styles.relationBadge} title={rel.description}>
                      {selectedEntity.name} <ArrowRight size={11} /> {rel.targetEntity} ({rel.type})
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Field Table */}
            <div className={styles.tableResponsive}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Alan Adı</th>
                    <th>Veri Tipi</th>
                    <th>Zorunluluk</th>
                    <th>Kısıt / İndeks</th>
                    <th>Açıklama & Örnek</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEntity.fields.map((f, i) => (
                    <tr key={i}>
                      <td className={styles.monoCell}>
                        <strong>{f.name}</strong>
                      </td>
                      <td>
                        <span className={styles.typeBadge}>{f.type}</span>
                      </td>
                      <td>
                        <span className={f.required ? styles.requiredBadge : styles.optionalBadge}>
                          {f.required ? 'Zorunlu' : 'Opsiyonel'}
                        </span>
                      </td>
                      <td>
                        {f.isPrimaryKey && <span className={styles.pkBadge}>PRIMARY KEY</span>}
                        {f.isForeignKey && <span className={styles.fkBadge}>FOREIGN KEY</span>}
                        {f.isUnique && <span className={styles.uniBadge}>UNIQUE</span>}
                        {f.isIndexed && <span className={styles.indexBadge}>INDEXED</span>}
                        {!f.isPrimaryKey && !f.isForeignKey && !f.isUnique && !f.isIndexed && (
                          <span className={styles.dimText}>-</span>
                        )}
                      </td>
                      <td>
                        <div className={styles.fieldDesc}>{f.description}</div>
                        {f.example && (
                          <div className={styles.fieldExample}>Örn: <code>{f.example}</code></div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sample Payload Preview */}
            <div className={styles.jsonPreviewBox}>
              <div className={styles.jsonPreviewHeader}>
                <span>Örnek Model Yükü (JSON Payload)</span>
              </div>
              <pre className={styles.jsonCodeBlock}>
                {JSON.stringify(selectedEntity.samplePayload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: REST API ENDPOINTS & LIVE TESTER */}
      {subTab === 'endpoints' && (
        <div className={styles.endpointsWrapper}>
          {/* Controls Bar */}
          <div className={styles.filterBar}>
            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Endpoint URL veya açıklama ara (örn: /api/products)..."
                value={endpointSearch}
                onChange={(e) => setEndpointSearch(e.target.value)}
                className={styles.filterSearchInput}
              />
            </div>
            <div className={styles.methodPillGroup}>
              {['ALL', 'GET', 'POST', 'PUT', 'DELETE'].map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`${styles.methodFilterBtn} ${methodFilter === m ? styles.active : ''}`}
                  onClick={() => setMethodFilter(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Endpoints List */}
          <div className={styles.endpointCardList}>
            {filteredEndpoints.map((ep, idx) => {
              const isSimulated = simulatedEndpoint === ep.path;
              return (
                <div key={idx} className={styles.endpointCard}>
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

                    {/* Simulated Response Box */}
                    {isSimulated && simulatedResponse && (
                      <div className={styles.simulatedBox}>
                        <div className={styles.simulatedHeader}>
                          <div className={styles.simulatedStatusRow}>
                            <span className={styles.statusCodeBadge}>200 OK</span>
                            <span className={styles.simulatedLatency}>
                              Gecikme: {simulatedResponse.latencyMs}ms
                            </span>
                          </div>
                          <span className={styles.simulatedTime}>
                            {simulatedResponse.timestamp.slice(11, 19)}
                          </span>
                        </div>
                        <pre className={styles.simulatedCode}>
                          {JSON.stringify(simulatedResponse.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ARCHITECTURE & RELATIONS MAP */}
      {subTab === 'architecture' && (
        <div className={styles.architectureWrapper}>
          <div className={styles.archCard}>
            <h3 className={styles.archTitle}>Guidora Çok Katmanlı Sözleşme Mimarisi</h3>
            <p className={styles.archSub}>
              İstemci tarafı (React SPA) ile sunucu tarafı arasındaki bağımlılık, standart REST/JSON sözleşmeleriyle soyutlanmıştır. Bu mimari backend teknolojisinin (Java, .NET, Node.js, Go) değişmesinden etkilenmez.
            </p>

            <div className={styles.archFlowDiagram}>
              <div className={styles.archNode}>
                <div className={styles.archNodeHeader}>İstemci (Client)</div>
                <div className={styles.archNodeDesc}>React 18 SPA</div>
                <div className={styles.archNodeTags}>
                  <span>httpClient.js</span>
                  <span>CircuitBreaker</span>
                </div>
              </div>

              <div className={styles.archConnector}>
                <span className={styles.archConnectorLabel}>HTTPS / JSON (/api/*)</span>
                <div className={styles.archConnectorLine} />
              </div>

              <div className={styles.archNode}>
                <div className={styles.archNodeHeader}>API Sözleşme Katmanı</div>
                <div className={styles.archNodeDesc}>RESTful Endpoints</div>
                <div className={styles.archNodeTags}>
                  <span>OpenAPI/Swagger</span>
                  <span>Stateless JWT</span>
                </div>
              </div>

              <div className={styles.archConnector}>
                <span className={styles.archConnectorLabel}>Data Access (ORM / Repository)</span>
                <div className={styles.archConnectorLine} />
              </div>

              <div className={styles.archNode}>
                <div className={styles.archNodeHeader}>Herhangi Bir Backend</div>
                <div className={styles.archNodeDesc}>Java / .NET / Go / Node</div>
                <div className={styles.archNodeTags}>
                  <span>Entity Model</span>
                  <span>Audit Trail</span>
                </div>
              </div>
            </div>

            {/* Core Invariants */}
            <div className={styles.invariantsGrid}>
              <div className={styles.invariantCard}>
                <div className={styles.invariantIcon}>
                  <ShieldCheck size={20} className={styles.greenText} />
                </div>
                <div>
                  <h4 className={styles.invariantTitle}>Stateless JWT & HttpOnly Çerezler</h4>
                  <p className={styles.invariantDesc}>
                    Access token'lar XSS sızıntılarını önlemek için sadece JavaScript bellek kapatmasında (closure) tutulur; yenileme token'ı HttpOnly çerez ile güvenli taşınır.
                  </p>
                </div>
              </div>

              <div className={styles.invariantCard}>
                <div className={styles.invariantIcon}>
                  <RefreshCw size={20} className={styles.blueText} />
                </div>
                <div>
                  <h4 className={styles.invariantTitle}>Geri Alınabilir Denetim Kaydı (Audit Trail)</h4>
                  <p className={styles.invariantDesc}>
                    Her düzenleme işleminde `oldValues` ve `newValues` JSON delta formatında saklanır; istendiğinde tek tıkla geri alınabilir (Audit.Revert).
                  </p>
                </div>
              </div>

              <div className={styles.invariantCard}>
                <div className={styles.invariantIcon}>
                  <Sparkles size={20} className={styles.purpleText} />
                </div>
                <div>
                  <h4 className={styles.invariantTitle}>Çok Dilli Taksonomi Mimarisi</h4>
                  <p className={styles.invariantDesc}>
                    Kategoriler ve etiketler TR, EN ve RU dil sözlükleriyle genişletilebilir esnek JSON alanlarına sahiptir; arayüz diline göre dinamik çözümlenir.
                  </p>
                </div>
              </div>

              <div className={styles.invariantCard}>
                <div className={styles.invariantIcon}>
                  <Database size={20} className={styles.amberText} />
                </div>
                <div>
                  <h4 className={styles.invariantTitle}>Yumuşak Silme (Soft-Delete) Güvencesi</h4>
                  <p className={styles.invariantDesc}>
                    Silinen veya arşivlenen araçlar ve kategoriler kalıcı olarak yok edilmez; `isArchived` bayrağı ile arşivlenir ve istendiğinde tek tıkla geri yüklenir.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
