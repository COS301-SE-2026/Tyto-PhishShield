import { useEffect, useState } from 'react';
import { AppLayout } from '../../components/layout/app-layout';
import { Card, Badge } from '../../components/ui';
import { useToast } from '../../context/toast-context';
import { fetchAnalyticsSummary, fetchTimeSeries, fetchLeaderboard, getPeriodRange,
  type Period, type AnalyticsSummary, type TimeSeriesPoint, type LeaderboardEntry, } from './analytics.service';

interface AnalyticsProps { onNavigate: (path: string) => void; activePath: string; }

const PERIOD_LABEL: Record<Period, string> = { '7d': 'last 7 days', '30d': 'last 30 days', '90d': 'last 90 days' };

function ComingSoon({ label }: { readonly label: string }) {
  return (
    <div style={{ padding: '24px 8px', textAlign: 'center' }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.6 }}>
        {label}
      </p>
    </div>
  );
}

function buildLinePath(values: number[], width: number, height: number, max: number): string {
  if (values.length === 0) return '';
  const domainMax = Math.max(max, 1);
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;
  return values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - (v / domainMax) * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function Analytics({ onNavigate, activePath }: AnalyticsProps) {
  const { addToast } = useToast();
  const [period, setPeriod] = useState<Period>('30d');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [series, setSeries] = useState<TimeSeriesPoint[] | null>(null);
  const [topReporters, setTopReporters] = useState<LeaderboardEntry[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadAnalytics = async (): Promise<void> => {
      setLoading(true);
      const { from, to } = getPeriodRange(period);
      try {
        const [summaryData, seriesData, leaderboardData] = await Promise.all([
          fetchAnalyticsSummary(period),
          fetchTimeSeries(from, to),
          fetchLeaderboard(5),
        ]);
        if (cancelled) return;
        setSummary(summaryData);
        setSeries(seriesData);
        setTopReporters(leaderboardData);
      } catch {
        if (!cancelled) addToast({ type: 'error', title: 'Analytics failed to load', message: 'Unable to fetch analytics data.' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadAnalytics();
    return () => { cancelled = true; };
  }, [period, addToast]);

  const maxSeriesValue = series?.length ? Math.max(...series.flatMap(p => [p.reports, p.emailsSent])) : 0;

  return (
    <AppLayout activePath={activePath} onNavigate={onNavigate} title="Analytics"
      subtitle="Organisation-wide security metrics">

      {/* Period selector — scopes the KPI row (except Training Completion, which is all-time) and the chart below */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 10, marginBottom: 16,
        padding: '10px 14px', borderRadius: 8,
        background: 'var(--color-primary-light)', border: '1px solid var(--border)',
      }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' }}>
          Showing stats and activity for the{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{PERIOD_LABEL[period]}</strong>
        </p>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['7d','30d','90d'] as const).map(p => (
            <button key={p} type="button" onClick={() => setPeriod(p)} style={{
              padding: '4px 12px', borderRadius: 6, border: '1.5px solid var(--border)', cursor: 'pointer',
              fontSize: 11, fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif',
              background: period === p ? 'var(--color-primary)' : 'var(--bg-card)',
              color: period === p ? '#fff' : 'var(--text-secondary)',
            }}>{p}</button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
        <Card style={{ padding: '16px 18px' }}>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>Avg Detection Rate</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{loading ? '—' : `${summary?.detectionRate ?? 0}%`}</span>
            {!loading && summary && (
              <span style={{ fontSize: 11, fontWeight: 600, color: summary.detectionRateDelta >= 0 ? 'var(--color-success)' : 'var(--color-danger)', paddingBottom: 3, fontFamily: 'Inter, system-ui, sans-serif' }}>
                {summary.detectionRateDelta >= 0 ? '+' : ''}{summary.detectionRateDelta}%
              </span>
            )}
          </div>
        </Card>
        <Card style={{ padding: '16px 18px', opacity: 0.6 }}>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>Avg Click Rate</p>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>Coming soon</span>
        </Card>
        <Card style={{ padding: '16px 18px' }}>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>Total Simulations</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{loading ? '—' : (summary?.totalSimulations ?? 0).toLocaleString()}</span>
            {!loading && summary && (
              <span style={{ fontSize: 11, fontWeight: 600, color: summary.totalSimulationsDelta >= 0 ? 'var(--color-success)' : 'var(--color-danger)', paddingBottom: 3, fontFamily: 'Inter, system-ui, sans-serif' }}>
                {summary.totalSimulationsDelta >= 0 ? '+' : ''}{summary.totalSimulationsDelta}
              </span>
            )}
          </div>
        </Card>
        <Card style={{ padding: '16px 18px', opacity: 0.6 }}>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>At-Risk Users</p>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>Coming soon</span>
        </Card>
        <Card style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' }}>Training Completion</p>
            <Badge variant="neutral">All-time</Badge>
          </div>
          <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{loading ? '—' : `${summary?.trainingCompletionRate ?? 0}%`}</span>
        </Card>
      </div>

      {/* Activity over time */}
      <Card style={{ padding: '20px 22px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>Activity Over Time</h2>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>{PERIOD_LABEL[period]}</span>
        </div>
        {!loading && series?.length === 0 ? (
          <ComingSoon label="No activity recorded in this period yet." />
        ) : (
          <svg viewBox="0 0 700 160" style={{ width: '100%', height: 160 }}>
            <defs>
              <linearGradient id="reportsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.2"/>
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0"/>
              </linearGradient>
            </defs>
            {[0,40,80,120].map(y => (
              <line key={y} x1="0" y1={y} x2="700" y2={y} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4,4"/>
            ))}
            {series && series.length > 0 && (
              <>
                <path
                  d={`${buildLinePath(series.map(p => p.reports), 700, 140, maxSeriesValue)} L700,160 L0,160Z`}
                  fill="url(#reportsGrad)"
                />
                <path
                  d={buildLinePath(series.map(p => p.reports), 700, 140, maxSeriesValue)}
                  fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round"
                />
                <path
                  d={buildLinePath(series.map(p => p.emailsSent), 700, 140, maxSeriesValue)}
                  fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="5,3"
                />
              </>
            )}
            <circle cx="16" cy="150" r="5" fill="#2563EB"/>
            <text x="26" y="154" fontSize="10" fill="var(--text-secondary)" fontFamily="Inter, system-ui, sans-serif">Reports submitted</text>
            <circle cx="150" cy="150" r="5" fill="#F59E0B"/>
            <text x="160" y="154" fontSize="10" fill="var(--text-secondary)" fontFamily="Inter, system-ui, sans-serif">Emails sent</text>
          </svg>
        )}
      </Card>

      {/* Department breakdown + Top reporters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 16 }}>
        <Card style={{ padding: '20px 22px' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, fontFamily: 'Inter, system-ui, sans-serif' }}>Detection Rate by Department</h2>
          <ComingSoon label="Department breakdown isn't available yet: analytics-service doesn't capture department data on events." />
        </Card>

        <Card style={{ padding: '20px 22px' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, fontFamily: 'Inter, system-ui, sans-serif' }}>Top Reporters</h2>
          {!loading && topReporters?.length === 0 && (
            <ComingSoon label="No confirmed reports yet." />
          )}
          {topReporters?.map((u, i) => (
            <div key={u.auth0Id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0', borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>{u.reportCount} confirmed report{u.reportCount === 1 ? '' : 's'}</div>
              </div>
              <Badge variant="success">{u.totalXp} XP</Badge>
            </div>
          ))}
        </Card>
      </div>

      {/* Wave performance table */}
      <Card>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>Phishing Wave Performance Summary</h2>
        </div>
        <ComingSoon label="Per-wave analytics need a Wave entity in mailing-service before this table can populate (tracked as Phase 2)" />
      </Card>
    </AppLayout>
  );
}