import { useState, useEffect, useMemo, useCallback, JSX } from 'react';
import { AppLayout } from '../../components/layout/app-layout';
import { Badge, Card, Button, Modal, Input, Select, XpAnimationOverlay } from '../../components/ui';
import { useAuth } from '../../context/auth-context';
import { useToast } from '../../context/toast-context';
import type { Wave } from '../../types';
import { fetchXpNet, computeMyXpRank, type XpNetEntry } from './dashboard.service';
import { connectXpSocket } from '../../services/xp-socket';

interface DashboardProps {
  onNavigate: (path: string) => void;
  activePath: string;
}

// Below is mock stats data (to be replaced with API calls once backend endpoints exist)

const MOCK_WAVES: Wave[] = [
  { id: '1', name: 'IT Support Reset', status: 'active', sentCount: 320, clickedCount: 42, reportedCount: 280, targetDepartments: ['IT & Security'], startDate: '2025-05-01', endDate: null, createdBy: 'admin' },
  { id: '2', name: 'Salary Increase Survey', status: 'complete', sentCount: 180, clickedCount: 9, reportedCount: 171, targetDepartments: ['Finance', 'Executive'], startDate: '2025-04-15', endDate: '2025-04-30', createdBy: 'admin' },
  { id: '3', name: 'HR Policy Update', status: 'active', sentCount: 240, clickedCount: 31, reportedCount: 208, targetDepartments: ['Human Resources'], startDate: '2025-05-05', endDate: null, createdBy: 'admin' },
  { id: '4', name: 'DHL Parcel Delivery', status: 'draft', sentCount: 0, clickedCount: 0, reportedCount: 0, targetDepartments: ['All'], startDate: '2025-05-20', endDate: null, createdBy: 'admin' },
];

const STATUS_BADGE: Record<string, JSX.Element> = {
  active:   <Badge variant="success">Active</Badge>,
  complete: <Badge variant="primary">Complete</Badge>,
  draft:    <Badge variant="neutral">Draft</Badge>,
  scheduled:<Badge variant="warning">Scheduled</Badge>,
};

function NewWaveModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addToast } = useToast();
  const [form, setForm] = useState({
    name: '', emailSubject: '', emailBody: '',
    departments: 'all', scheduledDate: '',
  });
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
        <Select
          label="Target departments"
          value={form.departments}
          onChange={e => set('departments', e.target.value)}
          options={[
            { value: 'all', label: 'All departments' },
            { value: 'it_security', label: 'IT & Security' },
            { value: 'finance', label: 'Finance' },
            { value: 'hr', label: 'Human Resources' },
            { value: 'legal', label: 'Legal & Compliance' },
            { value: 'operations', label: 'Operations' },
            { value: 'executive', label: 'Executive' },
          ]}
        />
        <Input label="Email subject line" placeholder="e.g. URGENT: Password reset required"
          value={form.emailSubject} onChange={e => set('emailSubject', e.target.value)} required />
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 5, fontFamily: 'Inter, system-ui, sans-serif' }}>
            Email body <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <textarea
            rows={5}
            placeholder="Paste the phishing email content here."
            value={form.emailBody}
            onChange={e => set('emailBody', e.target.value)}
            style={{
              width: '100%', border: '1.5px solid var(--border)', borderRadius: 8,
              padding: '9px 12px', fontSize: 13, color: 'var(--text-primary)',
              background: 'var(--bg-input)', fontFamily: 'Inter, system-ui, sans-serif',
              resize: 'vertical', outline: 'none', lineHeight: 1.5,
            }}
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
  const handleAssignTraining = () => {
    addToast({ type: 'info', title: 'Training assigned', message: '17 users have been assigned the Spear Phishing module.' });
  };

  return (
    <>
      {/* Metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 16 }}>
        {[
          { lbl: 'Phishing Emails Sent', val: '1,240', delta: '+12%', deltaColor: 'var(--color-primary)' },
          { lbl: 'Click Rate', val: '8.4%', delta: '−3.1%', deltaColor: 'var(--color-success)' },
          { lbl: 'Reports Filed', val: '312', delta: '+28%', deltaColor: 'var(--color-success)' },
          { lbl: 'At-Risk Users', val: '17', delta: '−5', deltaColor: 'var(--color-warning)' },
        ].map(m => (
          <Card key={m.lbl} style={{ padding: '18px' }}>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 8, fontFamily: 'Inter, system-ui, sans-serif' }}>{m.lbl}</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{m.val}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: m.deltaColor, paddingBottom: 3, fontFamily: 'Inter, system-ui, sans-serif' }}>{m.delta}</span>
            </div>
          </Card>
        ))}
      </div>
      {/* Detection over time mock chart */}
      <Card style={{ padding: '18px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>Phishing Detection Rate Over Time</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            {['7d', '30d', '90d'].map(p => (
              <button key={p} style={{
                background: p === '30d' ? 'var(--color-primary)' : 'var(--bg-hover)',
                border: '1.5px solid var(--border)', borderRadius: 6,
                padding: '3px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                color: p === '30d' ? '#fff' : 'var(--text-secondary)',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}>{p}</button>
            ))}
          </div>
        </div>
        {/* SVG spark */}
        <svg viewBox="0 0 600 120" style={{ width: '100%', height: 120 }}>
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.2"/>
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d="M0,90 C50,85 100,60 150,50 C200,40 250,70 300,55 C350,40 400,30 450,25 C500,20 550,22 600,18"
            fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M0,90 C50,85 100,60 150,50 C200,40 250,70 300,55 C350,40 400,30 450,25 C500,20 550,22 600,18 L600,120 L0,120 Z"
            fill="url(#chartGrad)"/>
          {/* Axis labels */}
          {['Apr 1','Apr 8','Apr 15','Apr 22','Apr 29','May 6','May 13'].map((l, i) => (
            <text key={l} x={i * 100} y={118} fontSize={9} fill="var(--text-muted)" fontFamily="Inter, system-ui, sans-serif">{l}</text>
          ))}
        </svg>
      </Card>
      {/* Phishing Waves */}
      <div style={{ marginBottom: 14 }}>
        <Card>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>Recent Phishing Waves</h2>
            <Button onClick={onNewWave} icon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            }>
              New Wave
            </Button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-hover)' }}>
                  {['WAVE','SENT','CLICKED','REPORTED','STATUS'].map(h => (
                    <th key={h} style={{ padding: '8px 16px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', letterSpacing: '0.5px', fontFamily: 'Inter, system-ui, sans-serif', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_WAVES.map(c => (
                  <tr key={c.id} style={{ borderTop: '1px solid var(--border)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '11px 16px' }}>
                      <button
                        onClick={() => onNavigate(`/waves/${c.id}`)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', padding: 0, fontFamily: 'Inter, system-ui, sans-serif', textAlign: 'left' }}
                      >
                        {c.name}
                      </button>
                    </td>
                    <td style={{ padding: '11px 10px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{c.sentCount || '—'}</td>
                    <td style={{ padding: '11px 10px', fontSize: 12, fontFamily: 'Inter, system-ui, sans-serif',
                      color: c.clickedCount > 30 ? 'var(--color-danger)' : c.clickedCount > 10 ? 'var(--color-warning)' : 'var(--text-secondary)',
                      fontWeight: c.clickedCount > 10 ? 600 : 400,
                    }}>{c.clickedCount || '—'}</td>
                    <td style={{ padding: '11px 10px', fontSize: 12, color: 'var(--color-success)', fontWeight: 500, fontFamily: 'Inter, system-ui, sans-serif' }}>{c.reportedCount || '—'}</td>
                    <td style={{ padding: '11px 10px' }}>{STATUS_BADGE[c.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      {/* Alert banner */}
      <div style={{
        background: 'var(--color-warning-light)', border: '1px solid var(--color-warning-border)',
        borderRadius: 10, padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ width: 32, height: 32, background: 'var(--color-warning)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#78350F', fontFamily: 'Inter, system-ui, sans-serif' }}>17 users clicked "CEO Wire Transfer". </span>
          <span style={{ fontSize: 12, color: '#92400E', fontFamily: 'Inter, system-ui, sans-serif' }}>Assign them the Spear Phishing awareness module.</span>
        </div>
        <Button size="sm" onClick={handleAssignTraining} style={{ background: 'var(--color-warning)', color: '#fff', border: 'none', whiteSpace: 'nowrap' }}>
          Assign Training
        </Button>
      </div>
    </>
  );
}

function UserDashboard({ onNavigate, onXpGained }: { onNavigate: (p: string) => void; onXpGained?: (amount: number) => void }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [xpEntries, setXpEntries] = useState<XpNetEntry[] | null>(null);
  const [recentGain, setRecentGain] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchXpNet().then(data => { if (!cancelled) setXpEntries(data); })
      .catch(() => {
      if (!cancelled) {
        addToast({ type: 'error', title: 'XP stats load failed', message: 'Unable to fetch XP stats' });
      }
    });
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
            const idx = list.findIndex(entry => entry.auth0Id === auth0Id);
            if (idx === -1) {
              if (auth0Id !== user.auth0Id) return list;
              return [...list, {
                auth0Id: user.auth0Id,
                name: user.name ?? user.email,
                email: user.email,
                department: null,
                totalXp: amount,
              }];
            }
            const updated = [...list];
            updated[idx] = { ...updated[idx], totalXp: updated[idx].totalXp + amount };
            return updated;
          });
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, [user, onXpGained]);

  const { myXp, rankValue, rankDelta } = useMemo(() => {
    if (!user || xpEntries === null) {
      return { myXp: 0, rankValue: '—', rankDelta: 'Loading…' };
    }
    const { xp, rank, totalRanked } = computeMyXpRank(xpEntries, user.auth0Id);
    if (rank === null) {
      return { myXp: 0, rankValue: 'Unranked', rankDelta: 'No XP recorded yet' };
    }
    return { myXp: xp, rankValue: `#${rank}`, rankDelta: `of ${totalRanked} ranked users` };
  }, [xpEntries, user]);

  const xpDeltaLabel = recentGain !== null ? `+${recentGain} just now` : 'Updates live';

  return (
    <>
      {/* Personal stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 16 }}>
        {[
          { lbl: 'XP Points', val: myXp, delta: xpDeltaLabel, deltaColor: recentGain !== null ? 'var(--color-success)' : 'var(--text-muted)' },
          { lbl: 'Organisation Rank', val: rankValue, delta: rankDelta, deltaColor: 'var(--text-muted)' },
          { lbl: 'Reports Filed', val: '28', delta: '+2 this week', deltaColor: 'var(--color-success)' },
          { lbl: 'Current Streak', val: '12 days', delta: 'Personal best!', deltaColor: 'var(--color-primary)' },
        ].map(m => (
          <Card key={m.lbl} style={{ padding: '18px' }}>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 8, fontFamily: 'Inter, system-ui, sans-serif' }}>{m.lbl}</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{m.val}</span>
            </div>
            <p style={{ fontSize: 11, color: m.deltaColor, marginTop: 4, fontFamily: 'Inter, system-ui, sans-serif' }}>{m.delta}</p>
          </Card>
        ))}
      </div>
      {/* Personal detection chart */}
      <Card style={{ padding: '18px 20px', marginBottom: 16 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, fontFamily: 'Inter, system-ui, sans-serif' }}>
          My Detection Performance
        </h2>
        <svg viewBox="0 0 600 100" style={{ width: '100%', height: 100 }}>
          <defs>
            <linearGradient id="myGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22C55E" stopOpacity="0.25"/>
              <stop offset="100%" stopColor="#22C55E" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d="M0,80 C80,75 120,50 200,40 C280,30 320,55 380,35 C440,15 500,20 600,10"
            fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M0,80 C80,75 120,50 200,40 C280,30 320,55 380,35 C440,15 500,20 600,10 L600,100 L0,100Z"
            fill="url(#myGrad)"/>
        </svg>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'Inter, system-ui, sans-serif' }}>Your phishing detection accuracy has improved 18% over the last 30 days.</p>
      </Card>
      {/* Pending training */}
      <Card>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>Training Assigned</h2>
          <button onClick={() => onNavigate('/training')} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif' }}>View all</button>
        </div>
        {[
          { title: 'Introduction to Social Engineering', due: 'Due May 20', status: 'in_progress' },
          { title: 'Spear Phishing Awareness', due: 'Due May 27', status: 'not_started' },
        ].map(t => (
          <div key={t.title} style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{t.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'Inter, system-ui, sans-serif' }}>{t.due}</div>
            </div>
            <Badge variant={t.status === 'in_progress' ? 'warning' : 'neutral'}>
              {t.status === 'in_progress' ? 'In Progress' : 'Not Started'}
            </Badge>
            <Button 
              size="sm" 
              onClick={() => onNavigate('/training')}
              style={{
                minWidth: 72,
                paddingLeft: 16,
                paddingRight: 16,
              }}
              >
                Start
            </Button>
          </div>
        ))}
      </Card>
    </>
  );
}

export function Dashboard({ onNavigate, activePath }: DashboardProps) {
  const { canAccess } = useAuth();
  const [newWaveOpen, setNewWaveOpen] = useState(false);
  const [showXpAnim, setShowXpAnim] = useState(false);
  const [xpAnimDelta, setXpAnimDelta] = useState(0);
  const handleXpGained = useCallback((amount: number) => {
    setXpAnimDelta(amount);
    setShowXpAnim(true);
  }, []);
  const isAdminOrAnalyst = canAccess('analyst');
  const today = new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <>
      <AppLayout
        activePath={activePath}
        onNavigate={onNavigate}
        title="Dashboard"
        subtitle={today}
        securityScore={72}
      >
        {isAdminOrAnalyst
          ? <AdminDashboard onNavigate={onNavigate} onNewWave={() => setNewWaveOpen(true)} />
          : <UserDashboard onNavigate={onNavigate} onXpGained={handleXpGained} />
        }
      </AppLayout>
      <NewWaveModal isOpen={newWaveOpen} onClose={() => setNewWaveOpen(false)} />
      {showXpAnim && <XpAnimationOverlay delta={xpAnimDelta} onDone={() => setShowXpAnim(false)} />}
    </>
  );
}