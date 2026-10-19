import React, { useState, useMemo } from 'react';
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  GitPullRequest,
  Layers,
  Server,
  ArrowUpRight,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import { adminGetTimeSeriesData } from '@/services/adminService';
import toastService from '@/services/toast/toastService';
import styles from '../AdminDashboardPage.module.scss';

export default function OverviewTab({
  stats = {},
  categories = [],
  tools = [],
  logs = [],
  onSelectTab,
  onInspectLog,
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [rangeDays, setRangeDays] = useState(14); // 7 | 14 | 30
  const [activeMetric, setActiveMetric] = useState('requests'); // 'requests' | 'latency'
  const [isRefreshing, setIsRefreshing] = useState(false);

  const timeSeries = useMemo(() => adminGetTimeSeriesData(rangeDays), [rangeDays]);

  const handleRefreshMetrics = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toastService.success('Analitik verileri ve platform metrikleri güncellendi.');
    }, 400);
  };

  // Compute SVG coordinates for the area chart
  const chartWidth = 720;
  const chartHeight = 310;
  const paddingX = 52;
  const paddingY = 28;

  const currentValues = useMemo(() => {
    return timeSeries.map((d) => (activeMetric === 'requests' ? d.requestsK : (d.p95LatencyMs ?? d.p95Ms ?? 12)));
  }, [timeSeries, activeMetric]);

  const maxVal = Math.max(...currentValues, activeMetric === 'requests' ? 20 : 18);
  const minVal = Math.min(...currentValues, activeMetric === 'requests' ? 10 : 8);

  const points = useMemo(() => {
    const usableW = chartWidth - paddingX * 2;
    const usableH = chartHeight - paddingY * 2;

    return timeSeries.map((d, idx) => {
      const val = activeMetric === 'requests' ? d.requestsK : (d.p95LatencyMs ?? d.p95Ms ?? 12);
      const x = paddingX + (idx / Math.max(1, timeSeries.length - 1)) * usableW;
      const normalizedY = (val - minVal) / (maxVal - minVal || 1);
      const y = chartHeight - paddingY - normalizedY * usableH;
      return { x, y, ...d, val, p95Ms: val };
    });
  }, [timeSeries, activeMetric, maxVal, minVal]);

  // Construct SVG smooth path
  const areaPath = useMemo(() => {
    if (!points.length) return { linePath: '', closed: '' };
    const first = points[0];
    const last = points[points.length - 1];

    let d = `M ${first.x} ${first.y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cx = (prev.x + curr.x) / 2;
      d += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    const linePath = d;
    const closed = `${linePath} L ${last.x} ${chartHeight - paddingY} L ${first.x} ${chartHeight - paddingY} Z`;
    return { linePath, closed };
  }, [points]);

  // Category distribution
  const categoryCounts = useMemo(() => {
    return categories
      .filter((c) => c.id !== 'all')
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        color: cat.color || '#6366f1',
        count: tools.filter((t) => {
          const catIdLower = String(cat.id || '').toLowerCase();
          const catNameLower = String(cat.name || '').toLowerCase();
          const toolCatLower = String(t.category || '').toLowerCase();
          const toolCatIdLower = String(t.categoryId || '').toLowerCase();
          return (
            toolCatLower === catIdLower ||
            toolCatLower === catNameLower ||
            toolCatIdLower === catIdLower ||
            toolCatIdLower === catNameLower
          );
        }).length,
      }))
      .sort((a, b) => b.count - a.count);
  }, [categories, tools]);

  const maxCatCount = Math.max(...categoryCounts.map((c) => c.count), 1);

  return (
    <div className={styles.tabContent}>
      {/* Top Platform KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard} onClick={() => onSelectTab('tools')} role="button" tabIndex={0}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiTitle}>Toplam Araçlar</span>
            <div className={`${styles.kpiIconWrapper} ${styles.blue}`}>
              <Wrench size={18} />
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>{stats.totalTools ?? tools.length}</span>
            <span className={styles.kpiTrendPositive}>
              <ArrowUpRight size={14} />
              +{stats.verifiedTools ?? 8} Onaylı
            </span>
          </div>
          <span className={styles.kpiSub}>Canlı yayında aktif dizin</span>
        </div>

        <div className={styles.kpiCard} onClick={() => onSelectTab('schema')} role="button" tabIndex={0}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiTitle}>REST API Sözleşmeleri</span>
            <div className={`${styles.kpiIconWrapper} ${styles.purple}`}>
              <Layers size={18} />
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>18 Endpoint</span>
            <span className={styles.kpiStatusOnline}>
              <CheckCircle2 size={12} />
              4 Modül
            </span>
          </div>
          <span className={styles.kpiSub}>Modüler Servis Entegrasyonu</span>
        </div>

        <div className={styles.kpiCard} onClick={() => onSelectTab('proposals')} role="button" tabIndex={0}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiTitle}>Teklif Sırası</span>
            <div className={`${styles.kpiIconWrapper} ${styles.amber}`}>
              <GitPullRequest size={18} />
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>{stats.pendingProposals ?? 2}</span>
            <span className={styles.kpiTrendNeutral}>Topluluk</span>
          </div>
          <span className={styles.kpiSub}>İncelenmeyi bekleyen düzenleme</span>
        </div>

        <div className={styles.kpiCard} onClick={() => onSelectTab('reports')} role="button" tabIndex={0}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiTitle}>Kullanıcı Şikayetleri</span>
            <div className={`${styles.kpiIconWrapper} ${styles.red}`}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>{stats.pendingReports ?? 0}</span>
            <span className={styles.kpiStatusClean}>Temiz</span>
          </div>
          <span className={styles.kpiSub}>Çözümlenmemiş ihlal bildirimi</span>
        </div>
      </div>

      {/* Middle Analytics Chart & Breakdown */}
      <div className={styles.analyticsRow}>
        {/* Interactive SVG Area Chart */}
        <div className={styles.analyticsCard}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>
                {activeMetric === 'requests'
                  ? `API İstek Hacmi (${rangeDays} Günlük)`
                  : `Uç Nokta Gecikmesi (p95 - ${rangeDays} Günlük)`}
              </h3>
              <span className={styles.chartSub}>W3C Trace & Platform Metrikleri</span>
            </div>

            <div className={styles.chartHeaderActions}>
              {/* Range Selector */}
              <div className={styles.chartRangeSelector}>
                {[7, 14, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    className={`${styles.rangeBtn} ${rangeDays === days ? styles.rangeBtnActive : ''}`}
                    onClick={() => setRangeDays(days)}
                  >
                    {days}G
                  </button>
                ))}
              </div>

              {/* Metric Switcher */}
              <div className={styles.chartMetricSelector}>
                <button
                  type="button"
                  className={`${styles.metricToggleBtn} ${activeMetric === 'requests' ? styles.metricToggleBtnActive : ''}`}
                  onClick={() => setActiveMetric('requests')}
                >
                  İstek Hacmi
                </button>
                <button
                  type="button"
                  className={`${styles.metricToggleBtn} ${activeMetric === 'latency' ? styles.metricToggleBtnActive : ''}`}
                  onClick={() => setActiveMetric('latency')}
                >
                  Gecikme (ms)
                </button>
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                className={styles.refreshBtn}
                onClick={handleRefreshMetrics}
                title="Metrikleri Yenile"
              >
                <RefreshCw size={13} className={isRefreshing ? styles.spinIcon : ''} />
              </button>
            </div>
          </div>

          <div className={styles.chartSvgWrapper}>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className={styles.areaChartSvg}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines & Y-Axis Labels */}
              {[0.2, 0.5, 0.8].map((pct, idx) => {
                const y = paddingY + pct * (chartHeight - paddingY * 2);
                const guideVal = Math.round(maxVal - pct * (maxVal - minVal));
                return (
                  <g key={idx}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      fill="var(--text-muted, #64748b)"
                      fontSize="9"
                      textAnchor="end"
                      fontFamily="monospace"
                    >
                      {activeMetric === 'requests' ? `${guideVal}k` : `${guideVal}ms`}
                    </text>
                  </g>
                );
              })}

              {/* X-Axis Date Labels */}
              {[0, Math.floor(points.length / 2), points.length - 1].map((idx) => {
                const pt = points[idx];
                if (!pt) return null;
                return (
                  <text
                    key={idx}
                    x={pt.x}
                    y={chartHeight - 8}
                    fill="var(--text-muted, #64748b)"
                    fontSize="9"
                    textAnchor={idx === 0 ? 'start' : idx === points.length - 1 ? 'end' : 'middle'}
                    fontFamily="monospace"
                  >
                    {pt.date}
                  </text>
                );
              })}

              {/* Area & Line */}
              {areaPath.closed && <path d={areaPath.closed} fill="url(#chartGrad)" />}
              {areaPath.linePath && (
                <path
                  d={areaPath.linePath}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* Data Points */}
              {points.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r={hoveredPoint === idx ? 6 : 3.5}
                  fill={hoveredPoint === idx ? '#a855f7' : '#6366f1'}
                  stroke="#0f172a"
                  strokeWidth="2"
                  className={styles.chartPoint}
                  onMouseEnter={() => setHoveredPoint(idx)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
            </svg>

            {/* Hover Tooltip */}
            {hoveredPoint !== null && points[hoveredPoint] && (
              <div
                className={styles.chartTooltip}
                style={{
                  left: `${(points[hoveredPoint].x / chartWidth) * 100}%`,
                  top: `${(points[hoveredPoint].y / chartHeight) * 100}%`,
                }}
              >
                <div className={styles.chartTooltipDate}>{points[hoveredPoint].date}</div>
                <div className={styles.chartTooltipVal}>
                  {activeMetric === 'requests'
                    ? `${points[hoveredPoint].requestsK}k İstek / Gün`
                    : `p95: ${points[hoveredPoint].p95Ms}ms`}
                </div>
              </div>
            )}
          </div>

          <div className={styles.chartFooterLegend}>
            <div className={styles.chartLegendItem}>
              <span className={styles.legendDot} style={{ background: '#6366f1' }} />
              <span>
                {activeMetric === 'requests' ? 'Günlük İstek (K)' : 'p95 Gecikme (ms)'}
              </span>
            </div>
            <span className={styles.legendTimeframe}>Son {rangeDays} gün</span>
          </div>
        </div>

        {/* Category Breakdown Card */}
        <div className={styles.analyticsCard}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Kategoriye Göre Dağılım</h3>
              <span className={styles.chartSub}>Katalog içeriğinin taksonomik ağırlığı</span>
            </div>
            <button
              type="button"
              className={styles.viewAllMiniBtn}
              onClick={() => onSelectTab('categories')}
            >
              Yönet
            </button>
          </div>

          <div className={styles.categoryBarsList}>
            {categoryCounts.map((cat) => {
              const pct = Math.round((cat.count / maxCatCount) * 100);
              return (
                <div key={cat.id} className={styles.catBarItem}>
                  <div className={styles.catBarMeta}>
                    <span className={styles.catBarName}>{cat.name}</span>
                    <span className={styles.catBarCount}>{cat.count} araç</span>
                  </div>
                  <div className={styles.catBarTrack}>
                    <div
                      className={styles.catBarFill}
                      style={{
                        width: `${pct}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Audit Events & System SLA */}
      <div className={styles.bottomOverviewRow}>
        {/* Recent Audit Logs Strip */}
        <div className={styles.recentLogsPanel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitleRow}>
              <ShieldAlert size={18} className={styles.purpleText} />
              <div>
                <h3 className={styles.recentLogsTitle}>Son Denetim & Güvenlik Olayları</h3>
                <span className={styles.panelSub}>Tüm kullanıcı ve sistem eylemlerinin izleme kayıtları</span>
              </div>
            </div>
            <button
              type="button"
              className={styles.actionBtnSecondary}
              onClick={() => onSelectTab('logs')}
            >
              Log Hub'a Git
            </button>
          </div>

          <div className={styles.recentLogsList}>
            {logs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className={styles.recentLogItem}
                onClick={() => onInspectLog ? onInspectLog(log) : onSelectTab('logs')}
                role="button"
                tabIndex={0}
              >
                <span className={`${styles.logBadgeSmall} ${styles[log.level?.toLowerCase() || 'info']}`}>
                  {log.level || 'INFO'}
                </span>
                <div className={styles.recentLogText}>
                  <div className={styles.recentLogAction}>{log.action}</div>
                  <div className={styles.recentLogTarget}>{log.target}</div>
                </div>
                <div className={styles.recentLogMeta}>
                  <span>{log.actor}</span>
                  <span className={styles.dimTime}>
                    {new Date(log.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Reliability SLA Gauges */}
        <div className={styles.slaPanel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitleRow}>
              <Server size={18} className={styles.blueText} />
              <div>
                <h3 className={styles.slaTitle}>Sistem Güvenilirliği & Altyapı</h3>
                <span className={styles.panelSub}>Gerçek zamanlı SLA ve orkestrasyon metrikleri</span>
              </div>
            </div>
          </div>

          <div className={styles.slaMetricsGrid}>
            <div className={styles.slaCard}>
              <span className={styles.slaLabel}>Bağlantı Havuzu</span>
              <strong className={styles.slaVal}>8 / 50</strong>
              <span className={styles.slaSub}>Aktif Bağlantı / Kapasite</span>
            </div>

            <div className={styles.slaCard}>
              <span className={styles.slaLabel}>SLA Uptime</span>
              <strong className={styles.slaVal} style={{ color: '#10B981' }}>99.98%</strong>
              <span className={styles.slaSub}>Son 30 gün kesintisiz</span>
            </div>

            <div className={styles.slaCard}>
              <span className={styles.slaLabel}>Ortalama Gecikme</span>
              <strong className={styles.slaVal} style={{ color: '#6366F1' }}>12.4 ms</strong>
              <span className={styles.slaSub}>REST API p95 Yanıt Süresi</span>
            </div>

            <div className={styles.slaCard}>
              <span className={styles.slaLabel}>Korumalı Mod</span>
              <strong className={styles.slaVal} style={{ color: '#10B981' }}>Devrede</strong>
              <span className={styles.slaSub}>MFA & Rate Limiting Aktif</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
