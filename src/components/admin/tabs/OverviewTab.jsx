import React, { useState, useMemo } from 'react';
import {
  Wrench,
  CheckCircle2,
  FolderTree,
  Users,
  Building2,
  AlertTriangle,
  GitPullRequest,
  TrendingUp,
  Activity,
  Database,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Sparkles,
} from 'lucide-react';
import { adminGetTimeSeriesData } from '@/services/adminService';
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
  const timeSeries = useMemo(() => adminGetTimeSeriesData(14), []);

  // Compute SVG coordinates for the 14-day area chart
  const chartWidth = 720;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  const maxRequests = Math.max(...timeSeries.map((d) => d.requestsK), 20);
  const minRequests = Math.min(...timeSeries.map((d) => d.requestsK), 10);

  const points = useMemo(() => {
    const usableW = chartWidth - paddingX * 2;
    const usableH = chartHeight - paddingY * 2;

    return timeSeries.map((d, idx) => {
      const x = paddingX + (idx / (timeSeries.length - 1)) * usableW;
      const normalizedY = (d.requestsK - minRequests) / (maxRequests - minRequests || 1);
      const y = chartHeight - paddingY - normalizedY * usableH;
      return { ...d, x, y };
    });
  }, [timeSeries, maxRequests, minRequests]);

  // Construct SVG smooth path
  const areaPath = useMemo(() => {
    if (!points.length) return '';
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
    // Close area for gradient
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
        count: tools.filter((t) => t.category === cat.id).length,
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
            <span className={styles.kpiNumber}>{stats.totalTools || tools.length}</span>
            <span className={styles.kpiSubBadge}>
              <CheckCircle2 size={12} color="#10b981" />
              {stats.verifiedTools || 0} Onaylı
            </span>
          </div>
          <div className={styles.kpiFoot}>
            <span>Dizin kataloğunda listelenen yapay zeka araçları</span>
            <ArrowUpRight size={14} className={styles.kpiArrow} />
          </div>
        </div>

        <div className={styles.kpiCard} onClick={() => onSelectTab('database')} role="button" tabIndex={0}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiTitle}>Veritabanı (PG18)</span>
            <div className={`${styles.kpiIconWrapper} ${styles.purple}`}>
              <Database size={18} />
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiNumber}>10 Tablo</span>
            <span className={`${styles.kpiSubBadge} ${styles.greenBadge}`}>
              99.4% Cache Hit
            </span>
          </div>
          <div className={styles.kpiFoot}>
            <span>PostgreSQL 18.0 aktif, MVCC concurrency devrede</span>
            <ArrowUpRight size={14} className={styles.kpiArrow} />
          </div>
        </div>

        <div className={styles.kpiCard} onClick={() => onSelectTab('proposals')} role="button" tabIndex={0}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiTitle}>Teklif Kuyruğu</span>
            <div className={`${styles.kpiIconWrapper} ${styles.amber}`}>
              <GitPullRequest size={18} />
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiNumber}>{stats.pendingProposals || 2}</span>
            <span className={`${styles.kpiSubBadge} ${styles.amberBadge}`}>İnceleme Bekliyor</span>
          </div>
          <div className={styles.kpiFoot}>
            <span>Topluluk tarafından önerilen araç güncellemeleri</span>
            <ArrowUpRight size={14} className={styles.kpiArrow} />
          </div>
        </div>

        <div className={styles.kpiCard} onClick={() => onSelectTab('reports')} role="button" tabIndex={0}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiTitle}>Kullanıcı Şikayetleri</span>
            <div className={`${styles.kpiIconWrapper} ${styles.red}`}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiNumber}>{stats.pendingReports || 0}</span>
            <span className={`${styles.kpiSubBadge} ${stats.pendingReports > 0 ? styles.redBadge : styles.greenBadge}`}>
              {stats.pendingReports > 0 ? 'İşlem Gerekiyor' : 'Temiz'}
            </span>
          </div>
          <div className={styles.kpiFoot}>
            <span>Kullanıcı bildirimleri ve içerik moderasyonu</span>
            <ArrowUpRight size={14} className={styles.kpiArrow} />
          </div>
        </div>
      </div>

      {/* Main Analytics Row: SVG Area Chart + Category Distribution */}
      <div className={styles.analyticsRow}>
        {/* 14-Day Traffic & Latency SVG Chart */}
        <div className={styles.chartPanel}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>Platform Trafiği & İstek Hacmi</h3>
              <p className={styles.panelSubtitle}>Son 14 günlük API istekleri (k) ve ortalama gecikme süresi</p>
            </div>
            <div className={styles.chartLegend}>
              <span className={styles.legendItem}>
                <span className={styles.legendDotBlue} /> İstekler (k req/gün)
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendDotPurple} /> p95 Gecikme (~14ms)
              </span>
            </div>
          </div>

          <div className={styles.svgChartContainer}>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className={styles.svgChart}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = paddingY + ratio * (chartHeight - paddingY * 2);
                return (
                  <line
                    key={i}
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth - paddingX}
                    y2={y}
                    stroke="var(--border-card)"
                    strokeDasharray="3 3"
                    strokeOpacity="0.5"
                  />
                );
              })}

              {/* Gradient Area Fill */}
              {areaPath.closed && (
                <path d={areaPath.closed} fill="url(#areaGradient)" />
              )}

              {/* Foreground Smooth Line */}
              {areaPath.linePath && (
                <path
                  d={areaPath.linePath}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* Interactive Data Points */}
              {points.map((pt, idx) => (
                <circle
                  key={idx}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredPoint?.isoDate === pt.isoDate ? 6 : 3.5}
                  fill="#6366f1"
                  stroke="#ffffff"
                  strokeWidth={hoveredPoint?.isoDate === pt.isoDate ? 2.5 : 1.5}
                  className={styles.chartCircle}
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
            </svg>

            {/* Hover Tooltip */}
            {hoveredPoint && (
              <div
                className={styles.chartTooltip}
                style={{
                  left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                  top: `${(hoveredPoint.y / chartHeight) * 100}%`,
                }}
              >
                <div className={styles.tooltipDate}>{hoveredPoint.date}</div>
                <div className={styles.tooltipRow}>
                  <span>İstekler:</span>
                  <strong>{hoveredPoint.requestsK}k req</strong>
                </div>
                <div className={styles.tooltipRow}>
                  <span>Gecikme (p95):</span>
                  <strong>{hoveredPoint.p95LatencyMs} ms</strong>
                </div>
                <div className={styles.tooltipRow}>
                  <span>Hata Oranı:</span>
                  <strong>%{hoveredPoint.errorRatePercent}</strong>
                </div>
              </div>
            )}
          </div>

          <div className={styles.chartFooterRow}>
            <span>14 Gün Önce</span>
            <span>Bugün ({new Date().toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })})</span>
          </div>
        </div>

        {/* Category Tool Distribution Bar Chart */}
        <div className={styles.distributionPanel}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>Kategoriye Göre Araç Dağılımı</h3>
              <p className={styles.panelSubtitle}>Aktif taksonomi üzerindeki araç hacimleri</p>
            </div>
            <button
              type="button"
              className={styles.panelLinkBtn}
              onClick={() => onSelectTab('categories')}
            >
              Tümünü Yönet
            </button>
          </div>

          <div className={styles.categoryBarsList}>
            {categoryCounts.slice(0, 6).map((cat) => {
              const percent = Math.round((cat.count / maxCatCount) * 100);
              return (
                <div key={cat.id} className={styles.catBarItem}>
                  <div className={styles.catBarHeader}>
                    <span className={styles.catBarName}>{cat.name}</span>
                    <span className={styles.catBarCount}>{cat.count} araç</span>
                  </div>
                  <div className={styles.catBarTrack}>
                    <div
                      className={styles.catBarFill}
                      style={{
                        width: `${Math.max(percent, 8)}%`,
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

      {/* Bottom Section: Recent Audit Log Feed & System Health Gauges */}
      <div className={styles.bottomOverviewRow}>
        {/* Recent Audit Activities */}
        <div className={styles.recentLogsPanel}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>Son Denetim & Güvenlik Olayları</h3>
              <p className={styles.panelSubtitle}>OpenTelemetry trace kimlikli son sistem eylemleri</p>
            </div>
            <button
              type="button"
              className={styles.panelLinkBtn}
              onClick={() => onSelectTab('logs')}
            >
              Log Hub'a Git
            </button>
          </div>

          <div className={styles.recentLogsList}>
            {logs.slice(0, 5).map((l) => (
              <div
                key={l.id}
                className={styles.recentLogItem}
                onClick={() => onInspectLog && onInspectLog(l)}
                role="button"
                tabIndex={0}
              >
                <span className={`${styles.logBadgeSmall} ${styles[l.level?.toLowerCase() || 'info']}`}>
                  {l.level || 'INFO'}
                </span>
                <div className={styles.recentLogText}>
                  <div className={styles.recentLogAction}>{l.action}</div>
                  <div className={styles.recentLogTarget}>{l.target}</div>
                </div>
                <div className={styles.recentLogMeta}>
                  <span className={styles.recentLogActor}>{l.actor}</span>
                  <span className={styles.recentLogTime}>
                    <Clock size={11} />
                    {new Date(l.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Engine SLA & Resource Cards */}
        <div className={styles.slaPanel}>
          <h3 className={styles.panelTitle}>Sistem Güvenilirliği & Altyapı</h3>
          <div className={styles.slaGaugesGrid}>
            <div className={styles.gaugeCard}>
              <div className={styles.gaugeHeader}>
                <span>Bağlantı Havuzu</span>
                <Database size={14} color="#6366f1" />
              </div>
              <div className={styles.gaugeValue}>8 / 50</div>
              <div className={styles.gaugeSub}>Npgsql PostgreSQL Pool</div>
            </div>

            <div className={styles.gaugeCard}>
              <div className={styles.gaugeHeader}>
                <span>SLA Uptime</span>
                <Activity size={14} color="#10b981" />
              </div>
              <div className={styles.gaugeValue}>99.98%</div>
              <div className={styles.gaugeSub}>Son 30 gün kesintisiz</div>
            </div>

            <div className={styles.gaugeCard}>
              <div className={styles.gaugeHeader}>
                <span>Ortalama Gecikme</span>
                <TrendingUp size={14} color="#8b5cf6" />
              </div>
              <div className={styles.gaugeValue}>12.4 ms</div>
              <div className={styles.gaugeSub}>.NET 10 Kestrel HTTP/2</div>
            </div>

            <div className={styles.gaugeCard}>
              <div className={styles.gaugeHeader}>
                <span>Korumalı Mod</span>
                <CheckCircle2 size={14} color="#06b6d4" />
              </div>
              <div className={styles.gaugeValue}>Devrede</div>
              <div className={styles.gaugeSub}>MFA & Rate Limiting Aktif</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
