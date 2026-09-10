import { useEffect, useState } from 'react';
import { AppLayout } from '../../components/layout/app-layout';
import { Card, Badge, ComingSoon } from '../../components/ui';
import { useToast } from '../../context/toast-context';
import { fetchAnalyticsSummary, fetchTimeSeries, fetchLeaderboard, fetchByDepartment, fetchAtRiskUsers, fetchCampaigns, getPeriodRange,
  type Period, type AnalyticsSummary, type TimeSeriesPoint, type LeaderboardEntry, type DepartmentBreakdown, type AtRiskUser, type Campaign, } from './analytics.service';

interface AnalyticsProps { onNavigate: (path: string) => void; activePath: string; }

const PERIOD_LABEL: Record<Period, string> = { '7d': 'last 7 days', '30d': 'last 30 days', '90d': 'last 90 days' };

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

function DeltaBadge({ delta, suffix = '%' }: { readonly delta: number; readonly suffix?: string }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: delta >= 0 ? 'var(--color-success)' : 'var(--color-danger)', paddingBottom: 3, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {delta >= 0 ? '+' : ''}{Math.round(delta)}{suffix}
    </span>
  );
}

export function Analytics({ onNavigate, activePath }: AnalyticsProps) {
  const { addToast } = useToast();
  const [period, setPeriod] = useState<Period>('30d');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [series, setSeries] = useState<TimeSeriesPoint[] | null>(null);
  const [topReporters, setTopReporters] = useState<LeaderboardEntry[] | null>(null);
  const [departments, setDepartments] = useState<DepartmentBreakdown[] | null>(null);
  const [atRiskUsers, setAtRiskUsers] = useState<AtRiskUser[] | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadAnalytics = async (): Promise<void> => {
      setLoading(true);
      const { from, to } = getPeriodRange(period);
      try {
        const [summaryData, seriesData, leaderboardData, departmentData, atRiskData, campaignData] = await Promise.all([
          fetchAnalyticsSummary(period),
          fetchTimeSeries(from, to),
          fetchLeaderboard(5),
          fetchByDepartment(period),
          fetchAtRiskUsers(period, 5),
          fetchCampaigns(),
        ]);
        if (cancelled) return;
        setSummary(summaryData);
        setSeries(seriesData);
        setTopReporters(leaderboardData);
        setDepartments(departmentData);
        setAtRiskUsers(atRiskData);
        setCampaigns(campaignData);
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
            <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{loading ? '—' : `${Math.round(summary?.detectionRate.value ?? 0)}%`}</span>
            {!loading && summary && <DeltaBadge delta={summary.detectionRate.delta} />}
          </div>
        </Card>
        <Card style={{ padding: '16px 18px' }}>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>Avg Click Rate</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{loading ? '—' : `${Math.round(summary?.clickRate.value ?? 0)}%`}</span>
            {!loading && summary && <DeltaBadge delta={summary.clickRate.delta} />}
          </div>
        </Card>
        <Card style={{ padding: '16px 18px' }}>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>Total Simulations</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{loading ? '—' : (summary?.totalSimulations.value ?? 0).toLocaleString()}</span>
            {!loading && summary && <DeltaBadge delta={summary.totalSimulations.delta} suffix="" />}
          </div>
        </Card>
        <Card style={{ padding: '16px 18px' }}>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>At-Risk Users</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{loading ? '—' : (summary?.atRiskUsers.value ?? 0).toLocaleString()}</span>
            {!loading && summary && <DeltaBadge delta={summary.atRiskUsers.delta} suffix="" />}
          </div>
        </Card>
        <Card style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' }}>Training Completion</p>
            <Badge variant="neutral">All-time</Badge>
          </div>
          <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{loading ? '—' : `${Math.round(summary?.trainingCompletion.value ?? 0)}%`}</span>
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
          {!loading && departments?.length === 0 && (
            <ComingSoon label="No department activity recorded in this period yet." />
          )}
          {departments?.map(d => (
            <div key={d.department} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0', borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{d.department}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>{d.sent} sent · {d.reported} reported</div>
              </div>
              <Badge variant={d.detectionRate >= 50 ? 'success' : 'warning'}>{Math.round(d.detectionRate)}% detection</Badge>
            </div>
          ))}
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

      {/* At-risk users */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>Users Most At Risk</h2>
        </div>
        {!loading && atRiskUsers?.length === 0 ? (
          <ComingSoon label="No users currently meet the at-risk click-rate threshold." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-hover)' }}>
                  <th style={{ padding: '8px 16px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'Inter, system-ui, sans-serif' }}>USER</th>
                  <th style={{ padding: '8px 16px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'Inter, system-ui, sans-serif' }}>DEPARTMENT</th>
                  <th style={{ padding: '8px 16px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'Inter, system-ui, sans-serif' }}>CLICK RATE</th>
                  <th style={{ padding: '8px 16px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'Inter, system-ui, sans-serif' }}>RISK</th>
                </tr>
              </thead>
              <tbody>
                {atRiskUsers?.map(u => (
                  <tr key={u.auth0Id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{u.name ?? u.auth0Id}</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{u.department ?? '—'}</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{u.clickRate}%</td>
                    <td style={{ padding: '10px 16px' }}><Badge variant={u.riskLevel === 'high' ? 'danger' : 'warning'}>{u.riskLevel}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Wave performance table */}
      <Card>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>Phishing Wave Performance Summary</h2>
        </div>
        {campaigns && campaigns.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-hover)' }}>
                  <th style={{ padding: '8px 16px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'Inter, system-ui, sans-serif' }}>WAVE</th>
                  <th style={{ padding: '8px 16px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'Inter, system-ui, sans-serif' }}>STATUS</th>
                  <th style={{ padding: '8px 16px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'Inter, system-ui, sans-serif' }}>STARTED</th>
                  <th style={{ padding: '8px 16px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'Inter, system-ui, sans-serif' }}>ENDS</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{c.name ?? c.id}</td>
                    <td style={{ padding: '10px 16px' }}><Badge variant={c.status === 'completed' ? 'neutral' : 'success'}>{c.status ?? 'unknown'}</Badge></td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{c.startDate ? new Date(c.startDate).toLocaleDateString('en-ZA') : '—'}</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{c.endDate ? new Date(c.endDate).toLocaleDateString('en-ZA') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <ComingSoon label="No waves have been created yet, this table will populate automatically once a wave is launched." />
        )}
      </Card>
    </AppLayout>
  );
}