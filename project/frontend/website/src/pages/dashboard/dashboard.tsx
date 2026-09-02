import { useState, useEffect, useMemo, useCallback, JSX } from 'react';
import { AppLayout } from '../../components/layout/app-layout';
import { Badge, Card, Button, Modal, Input, Select, XpAnimationOverlay } from '../../components/ui';
import { useAuth } from '../../context/auth-context';
import { useToast } from '../../context/toast-context';
import { fetchXpNet, computeMyXpRank, type XpNetEntry } from './dashboard.service';
import { connectXpSocket } from '../../services/xp-socket';
import { fetchAnalyticsSummary, fetchTimeSeries, fetchAtRiskUsers, getPeriodRange,
  type AnalyticsSummary, type TimeSeriesPoint, type AtRiskUser, type Period, } from '../analytics/analytics.service';
import { getWaves, type Wave as RealWave } from '../../services/wave';
import { API_BASE, authFetch } from '../../services/api';

interface DashboardProps {
  onNavigate: (path: string) => void;
  activePath: string;
}

function computeStreak(entries: { createdAt: string }[]): number {
  if (!entries.length) return 0;
  const days = [...new Set(entries.map(e => e.createdAt.slice(0, 10)))].sort().reverse();
  const todayStr = new Date().toISOString().slice(0, 10);
  const yestStr  = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (days[0] !== todayStr && days[0] !== yestStr) return 0;
  let streak = 0, cur = days[0];
  for (const d of days) {
    if (d !== cur) break;
    streak++;
    const dt = new Date(cur + 'T00:00:00Z');
    dt.setUTCDate(dt.getUTCDate() - 1);
    cur = dt.toISOString().slice(0, 10);
  }
  return streak;
}

// Detection-rate line graph
function buildChartPath(points: TimeSeriesPoint[], svgW = 600, svgH = 120) {
  if (!points.length) return { line: '', area: '', labels: [] as { x: number; label: string }[] };
  const rates = points.map(p => p.emailsSent > 0 ? (p.reports / p.emailsSent) * 100 : 0);
  const maxRate = Math.max(...rates, 0.001);
  const xStep = points.length > 1 ? svgW / (points.length - 1) : svgW;
  const pad = 10;
  const coords = rates.map((r, i) => ({ x: i * xStep, y: svgH - pad - (r / maxRate) * (svgH - pad * 2) }));
  let line = `M${coords[0].x.toFixed(1)},${coords[0].y.toFixed(1)}`;
  for (let i = 1; i < coords.length; i++) {
    const p = coords[i - 1], c = coords[i];
    const mx = ((p.x + c.x) / 2).toFixed(1);
    line += ` C${mx},${p.y.toFixed(1)} ${mx},${c.y.toFixed(1)} ${c.x.toFixed(1)},${c.y.toFixed(1)}`;
  }
  const last = coords[coords.length - 1];
  const area = `${line} L${last.x.toFixed(1)},${svgH} L0,${svgH} Z`;
  const labelCount = Math.min(7, points.length);
  const step = Math.max(1, Math.floor((points.length - 1) / Math.max(labelCount - 1, 1)));
  const labels = Array.from({ length: labelCount }, (_, i) => {
    const idx = Math.min(i * step, points.length - 1);
    return { x: coords[idx].x, label: new Date(points[idx].date).toLocaleDateString('en', { month: 'short', day: 'numeric' }) };
  });
  return { line, area, labels };
}

// Weekly XP bar data for user graph
function buildXpBars(entries: { amount: number; createdAt: string }[], weeks = 6) {
  const now = Date.now();
  return Array.from({ length: weeks }, (_, i) => {
    const weekEnd   = now - i * 7 * 86_400_000;
    const weekStart = weekEnd - 7 * 86_400_000;
    const xp = entries
      .filter(e => { const t = new Date(e.createdAt).getTime(); return t >= weekStart && t < weekEnd && e.amount > 0; })
      .reduce((s, e) => s + e.amount, 0);
    return { label: new Date(weekEnd).toLocaleDateString('en', { month: 'short', day: 'numeric' }), xp };
  }).reverse();
}

function deriveWaveStatus(wave: RealWave): 'active' | 'complete' | 'scheduled' | 'draft' {
  const from = new Date(wave.scheduledFrom).getTime();
  const to   = new Date(wave.scheduledTo).getTime();
  const now  = Date.now();
  if (isNaN(from)) return 'draft';
  if (from > now)  return 'scheduled';
  if (!isNaN(to) && to < now) return 'complete';
  return 'active';
}

function fmtDelta(delta: number, suffix = ''): string {
  if (delta === 0) return '—';
  return `${delta > 0 ? '+' : '−'}${Math.abs(delta).toFixed(suffix === '%' ? 1 : 0)}${suffix}`;
}

const STATUS_BADGE: Record<string, JSX.Element> = {
  active:    <Badge variant="success">Active</Badge>,
  complete:  <Badge variant="primary">Complete</Badge>,
  draft:     <Badge variant="neutral">Draft</Badge>,
  scheduled: <Badge variant="warning">Scheduled</Badge>,
};

function NewWaveModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addToast } = useToast();
  const [form, setForm] = useState({ name: '', emailSubject: '', emailBody: '', departments: 'all', scheduledDate: '' });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const valid = !!form.name.trim() && !!form.emailSubject.trim() && !!form.emailBody.trim();

  const handleCreate = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    addToast({ type: 'success', title: 'Wave created', message: `"${form.name}" saved as draft.` });
    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Wave" maxWidth={560}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Wave name" placeholder="e.g. IT Support Reset" value={form.name}
          onChange={e => set('name', e.target.value)} required />
        <Select label="Target departments" value={form.departments} onChange={e => set('departments', e.target.value)}
          options={[
            { value: 'all',        label: 'All departments' },
            { value: 'it',         label: 'IT & Security' },
            { value: 'finance',    label: 'Finance' },
            { value: 'hr',         label: 'Human Resources' },
            { value: 'legal',      label: 'Legal & Compliance' },
            { value: 'operations', label: 'Operations' },
            { value: 'executive',  label: 'Executive' },
          ]}
        />
        <Input label="Email subject line" placeholder="e.g. URGENT: Password reset required"
          value={form.emailSubject} onChange={e => set('emailSubject', e.target.value)} required />
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 5, fontFamily: 'Inter, system-ui, sans-serif' }}>
            Email body <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <textarea rows={5} placeholder="Paste the phishing email content here."
            value={form.emailBody} onChange={e => set('emailBody', e.target.value)}
            style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text-primary)', background: 'var(--bg-input)', fontFamily: 'Inter, system-ui, sans-serif', resize: 'vertical', outline: 'none', lineHeight: 1.5 }}
          />
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'Inter, system-ui, sans-serif' }}>
            AI-generated email selection will be available once the generation microservice is ready.
          </p>
        </div>
        <Input label="Schedule date (optional)" type="date" value={form.scheduledDate}
          onChange={e => set('scheduledDate', e.target.value)} />
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Button variant="ghost" onClick={onClose} style={{ flex: '0 0 auto' }}>Cancel</Button>
          <Button fullWidth loading={loading} disabled={!valid} onClick={() => { void handleCreate(); }}>
            Save as Draft
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AdminDashboard({ onNavigate, onNewWave }: { onNavigate: (p: string) => void; onNewWave: () => void }) {
  const { addToast } = useToast();
  const [period, setPeriod]       = useState<Period>('30d');
  const [loading, setLoading]     = useState(true);
  const [summary, setSummary]     = useState<AnalyticsSummary | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [waves, setWaves]         = useState<RealWave[]>([]);
  const [atRisk, setAtRisk]       = useState<AtRiskUser[]>([]);

  useEffect(() => {
    setLoading(true);
    const { from, to } = getPeriodRange(period);
    Promise.all([
      fetchAnalyticsSummary(period),
      fetchTimeSeries(from, to),
      getWaves(),
      fetchAtRiskUsers(period, 50),
    ])
      .then(([sum, ts, wv, ar]) => {
        setSummary(sum);
        setTimeSeries(ts);
        setWaves(wv);
        setAtRisk(ar);
      })
      .catch(() => addToast({ type: 'error', title: 'Dashboard load failed', message: 'Some data could not be loaded.' }))
      .finally(() => setLoading(false));
  }, [period, addToast]);

  const chart = useMemo(() => buildChartPath(timeSeries), [timeSeries]);
  // KPI cards derived from analytics
  const kpiCards = summary ? [
    {
      lbl: 'Phishing Emails Sent',
      val: summary.totalSimulations.value.toLocaleString(),
      delta: fmtDelta(summary.totalSimulations.delta),
      deltaColor: summary.totalSimulations.delta >= 0 ? 'var(--color-primary)' : 'var(--color-success)',
    },
    {
      lbl: 'Click Rate',
      val: `${summary.clickRate.value.toFixed(1)}%`,
      delta: fmtDelta(summary.clickRate.delta, '%'),
      deltaColor: summary.clickRate.delta <= 0 ? 'var(--color-success)' : 'var(--color-danger)',
    },
    {
      lbl: 'Detection Rate',
      val: `${summary.detectionRate.value.toFixed(1)}%`,
      delta: fmtDelta(summary.detectionRate.delta, '%'),
      deltaColor: summary.detectionRate.delta >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
    },
    {
      lbl: 'At-Risk Users',
      val: String(summary.atRiskUsers.value),
      delta: fmtDelta(summary.atRiskUsers.delta),
      deltaColor: summary.atRiskUsers.delta <= 0 ? 'var(--color-success)' : 'var(--color-danger)',
    },
  ] : [
    { lbl: 'Phishing Emails Sent', val: '—', delta: '', deltaColor: 'var(--text-muted)' },
    { lbl: 'Click Rate',           val: '—', delta: '', deltaColor: 'var(--text-muted)' },
    { lbl: 'Detection Rate',       val: '—', delta: '', deltaColor: 'var(--text-muted)' },
    { lbl: 'At-Risk Users',        val: '—', delta: '', deltaColor: 'var(--text-muted)' },
  ];

  const highRisk = atRisk.filter(u => u.riskLevel === 'high');

  return (
    <>
      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 16 }}>
        {kpiCards.map(m => (
          <Card key={m.lbl} style={{ padding: '18px' }}>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 8, fontFamily: 'Inter, system-ui, sans-serif' }}>{m.lbl}</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{m.val}</span>
              {m.delta && <span style={{ fontSize: 11, fontWeight: 600, color: m.deltaColor, paddingBottom: 3, fontFamily: 'Inter, system-ui, sans-serif' }}>{m.delta}</span>}
            </div>
          </Card>
        ))}
      </div>
      {/* Detection rate chart */}
      <Card style={{ padding: '18px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>Phishing Detection Rate Over Time</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['7d', '30d', '90d'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                background: p === period ? 'var(--color-primary)' : 'var(--bg-hover)',
                border: '1.5px solid var(--border)', borderRadius: 6,
                padding: '3px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                color: p === period ? '#fff' : 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif',
              }}>{p}</button>
            ))}
          </div>
        </div>
        {loading || !chart.line ? (
          <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'Inter, system-ui, sans-serif' }}>
            {loading ? 'Loading…' : 'No data for this period.'}
          </div>
        ) : (
          <svg viewBox="0 0 600 120" style={{ width: '100%', height: 120 }}>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.2"/>
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path d={chart.line} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round"/>
            <path d={chart.area} fill="url(#chartGrad)"/>
            {chart.labels.map(l => (
              <text key={l.label} x={l.x} y={118} fontSize={9} fill="var(--text-muted)" fontFamily="Inter, system-ui, sans-serif">{l.label}</text>
            ))}
          </svg>
        )}
      </Card>
      {/* Phishing Waves table */}
      <div style={{ marginBottom: 14 }}>
        <Card>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>Recent Phishing Waves</h2>
            <Button onClick={onNewWave} icon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            }>New Wave</Button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: '20px 18px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>Loading waves…</div>
            ) : waves.length === 0 ? (
              <div style={{ padding: '20px 18px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>No phishing waves found.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-hover)' }}>
                    {['WAVE', 'RECIPIENTS', 'SCHEDULED FROM', 'SCHEDULED TO', 'STATUS'].map(h => (
                      <th key={h} style={{ padding: '8px 16px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', letterSpacing: '0.5px', fontFamily: 'Inter, system-ui, sans-serif', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {waves.slice(0, 8).map(w => {
                    const status = deriveWaveStatus(w);
                    const sentCount = w.recipients.length;
                    return (
                      <tr key={w.id} style={{ borderTop: '1px solid var(--border)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '11px 16px' }}>
                          <button onClick={() => onNavigate(`/waves/${w.id}`)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', padding: 0, fontFamily: 'Inter, system-ui, sans-serif', textAlign: 'left' }}>
                            {w.waveName}
                          </button>
                        </td>
                        <td style={{ padding: '11px 10px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                          {sentCount > 0 ? sentCount.toLocaleString() : '—'}
                        </td>
                        <td style={{ padding: '11px 10px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                          {w.scheduledFrom ? new Date(w.scheduledFrom).toLocaleDateString('en-ZA') : '—'}
                        </td>
                        <td style={{ padding: '11px 10px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                          {w.scheduledTo ? new Date(w.scheduledTo).toLocaleDateString('en-ZA') : '—'}
                        </td>
                        <td style={{ padding: '11px 10px' }}>{STATUS_BADGE[status]}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
      {/* At-risk alert banner */}
      {!loading && highRisk.length > 0 && (
        <div style={{ background: 'var(--color-warning-light)', border: '1px solid var(--color-warning-border)', borderRadius: 10, padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, background: 'var(--color-warning)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>
              {highRisk.length} {highRisk.length === 1 ? 'user is' : 'users are'} at high risk.{' '}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' }}>
              Assign them a Spear Phishing awareness module.
            </span>
          </div>
          <Button size="sm"
            onClick={() => addToast({ type: 'info', title: 'Training assigned', message: `${highRisk.length} users have been assigned the Spear Phishing module.` })}
            style={{ background: 'var(--color-warning)', color: '#fff', border: 'none', whiteSpace: 'nowrap' }}>
            Assign Training
          </Button>
        </div>
      )}
    </>
  );
}

interface UserXpEntry { id: string; amount: number; reason: string | null; createdAt: string; }
interface UserReport  { id: string; status: string; }
interface PendingAssignment { id: string; status: string; questionIds: string[]; createdAt: string; }

function UserDashboard({ onNavigate, onXpGained }: { onNavigate: (p: string) => void; onXpGained?: (amount: number) => void }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [xpEntries, setXpEntries] = useState<XpNetEntry[] | null>(null);
  const [recentGain, setRecentGain] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchXpNet()
      .then(data => { if (!cancelled) setXpEntries(data); })
      .catch(() => { if (!cancelled) addToast({ type: 'error', title: 'XP stats load failed', message: 'Unable to fetch XP stats' }); });
    return () => { cancelled = true; };
  }, [addToast]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let socket: Awaited<ReturnType<typeof connectXpSocket>> | undefined;
    connectXpSocket().then(s => {
      if (cancelled) { s.disconnect(); return; }
      socket = s;
      s.on('xp-given-all', ({ auth0Id, amount }: { auth0Id: string; amount: number }) => {
        if (auth0Id === user.auth0Id) {
          onXpGained?.(amount);
          setRecentGain(amount);
        }
        setXpEntries(prev => {
          const list = prev ?? [];
          const idx = list.findIndex(e => e.auth0Id === auth0Id);
          if (idx === -1) {
            if (auth0Id !== user.auth0Id) return list;
            return [...list, { auth0Id: user.auth0Id, name: user.name ?? user.email, email: user.email, department: null, totalXp: amount }];
          }
          const updated = [...list];
          updated[idx] = { ...updated[idx], totalXp: updated[idx].totalXp + amount };
          return updated;
        });
      });
    }).catch(() => undefined);
    return () => { cancelled = true; socket?.disconnect(); };
  }, [user, onXpGained]);

  const { myXp, rankValue, rankDelta } = useMemo(() => {
    if (!user || xpEntries === null) return { myXp: 0, rankValue: '—', rankDelta: 'Loading…' };
    const { xp, rank, totalRanked } = computeMyXpRank(xpEntries, user.auth0Id);
    if (rank === null) return { myXp: 0, rankValue: 'Unranked', rankDelta: 'No XP recorded yet' };
    return { myXp: xp, rankValue: `#${rank}`, rankDelta: `of ${totalRanked} ranked users` };
  }, [xpEntries, user]);

  const xpDeltaLabel = recentGain !== null ? `+${recentGain} just now` : 'Updates live';
  // Personal stats: reports, streak, XP history, training
  const [reportsCount, setReportsCount]     = useState<number | null>(null);
  const [streak, setStreak]                 = useState<number | null>(null);
  const [xpHistory, setXpHistory]           = useState<UserXpEntry[]>([]);
  const [assignment, setAssignment]         = useState<PendingAssignment | null | 'none'>(null);
  useEffect(() => {
    if (!user) return;
    const load = async (): Promise<void> => {
      const [xpRes, reportsRes, assignmentRes] = await Promise.all([
        authFetch(`${API_BASE}/xp/${user.auth0Id}`),
        authFetch(`${API_BASE}/report/mine`),
        authFetch(`${API_BASE}/education/assignment/mine`),
      ]);
      if (xpRes.ok) {
        const entries = await xpRes.json() as UserXpEntry[];
        setXpHistory(entries);
        setStreak(computeStreak(entries));
      }
      if (reportsRes.ok) {
        const reports = await reportsRes.json() as UserReport[];
        setReportsCount(reports.length);
      }
      if (assignmentRes.ok) {
        setAssignment(await assignmentRes.json() as PendingAssignment);
      } else {
        setAssignment('none');
      }
    };
    void load();
  }, [user]);
  const xpBars = useMemo(() => buildXpBars(xpHistory), [xpHistory]);
  const xpBarMax = Math.max(...xpBars.map(b => b.xp), 1);
  const statsCards = [
    { lbl: 'XP Points',          val: myXp,                                        delta: xpDeltaLabel,                                         deltaColor: recentGain !== null ? 'var(--color-success)' : 'var(--text-muted)' },
    { lbl: 'Organisation Rank',  val: rankValue,                                   delta: rankDelta,                                             deltaColor: 'var(--text-muted)' },
    { lbl: 'Reports Filed',      val: reportsCount !== null ? reportsCount : '—',  delta: reportsCount !== null ? 'Total submitted' : 'Loading…', deltaColor: 'var(--color-success)' },
    { lbl: 'Current Streak',     val: streak !== null ? `${streak} days` : '—',    delta: streak !== null ? (streak > 0 ? 'Keep it up!' : 'No streak yet') : 'Loading…', deltaColor: streak !== null && streak > 0 ? 'var(--color-primary)' : 'var(--text-muted)' },
  ];

  return (
    <>
      {/* Personal stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 16 }}>
        {statsCards.map(m => (
          <Card key={m.lbl} style={{ padding: '18px' }}>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 8, fontFamily: 'Inter, system-ui, sans-serif' }}>{m.lbl}</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{m.val}</span>
            </div>
            <p style={{ fontSize: 11, color: m.deltaColor, marginTop: 4, fontFamily: 'Inter, system-ui, sans-serif' }}>{m.delta}</p>
          </Card>
        ))}
      </div>
      {/* Weekly XP activity bar chart */}
      <Card style={{ padding: '18px 20px', marginBottom: 16 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, fontFamily: 'Inter, system-ui, sans-serif' }}>
          My XP Activity — Last 6 Weeks
        </h2>
        {xpHistory.length === 0 ? (
          <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'Inter, system-ui, sans-serif' }}>
            No XP activity yet.
          </div>
        ) : (
          <svg viewBox="0 0 600 100" style={{ width: '100%', height: 100 }}>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22C55E" stopOpacity="0.9"/>
                <stop offset="100%" stopColor="#22C55E" stopOpacity="0.4"/>
              </linearGradient>
            </defs>
            {xpBars.map((bar, i) => {
              const barW = 72;
              const gap  = 28;
              const x = i * (barW + gap) + gap / 2;
              const barH = Math.max((bar.xp / xpBarMax) * 72, bar.xp > 0 ? 4 : 0);
              const y = 80 - barH;
              return (
                <g key={bar.label}>
                  <rect x={x} y={y} width={barW} height={barH} rx={4} fill="url(#barGrad)" />
                  <text x={x + barW / 2} y={95} textAnchor="middle" fontSize={9} fill="var(--text-muted)" fontFamily="Inter, system-ui, sans-serif">{bar.label}</text>
                  {bar.xp > 0 && (
                    <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize={9} fill="var(--color-success)" fontFamily="Inter, system-ui, sans-serif">{bar.xp}</text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
      </Card>
      {/* Training assignment */}
      <Card>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>Training Assigned</h2>
          <button onClick={() => onNavigate('/training')} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif' }}>View all</button>
        </div>
        {assignment === null ? (
          <div style={{ padding: '16px 18px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>Loading…</div>
        ) : assignment === 'none' ? (
          <div style={{ padding: '16px 18px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>No training currently assigned.</div>
        ) : (
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                Security Awareness Assessment
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'Inter, system-ui, sans-serif' }}>
                {assignment.questionIds.length} questions · Assigned {new Date(assignment.createdAt).toLocaleDateString('en-ZA')}
              </div>
            </div>
            <Badge variant="warning">Pending</Badge>
            <Button size="sm" onClick={() => onNavigate('/training')} style={{ minWidth: 72, paddingLeft: 16, paddingRight: 16 }}>
              Start
            </Button>
          </div>
        )}
      </Card>
    </>
  );
}

export function Dashboard({ onNavigate, activePath }: DashboardProps) {
  const { canAccess } = useAuth();
  const [newWaveOpen, setNewWaveOpen] = useState(false);
  const [showXpAnim, setShowXpAnim]   = useState(false);
  const [xpAnimDelta, setXpAnimDelta] = useState(0);
  const handleXpGained = useCallback((amount: number) => {
    setXpAnimDelta(amount);
    setShowXpAnim(true);
  }, []);
  const isAdminOrAnalyst = canAccess('analyst');
  const today = new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <>
      <AppLayout activePath={activePath} onNavigate={onNavigate} title="Dashboard" subtitle={today}>
        {isAdminOrAnalyst
          ? <AdminDashboard onNavigate={onNavigate} onNewWave={() => setNewWaveOpen(true)} />
          : <UserDashboard  onNavigate={onNavigate} onXpGained={handleXpGained} />
        }
      </AppLayout>
      <NewWaveModal isOpen={newWaveOpen} onClose={() => setNewWaveOpen(false)} />
      {showXpAnim && <XpAnimationOverlay delta={xpAnimDelta} onDone={() => setShowXpAnim(false)} />}
    </>
  );
}