import React, { useState } from 'react';
import { AppLayout } from '../../components/layout/app-layout';
import { Card, Badge, Button } from '../../components/ui';
import { useAuth } from '../../context/auth-context';
import { useToast } from '../../context/toast-context';
import type { Wave, WaveStatus } from '../../types';

interface WavesProps {
  onNavigate: (path: string) => void;
  activePath: string;
}

const MOCK_WAVES: Wave[] = [
  { id: '1', name: 'IT Support Reset', status: 'active', sentCount: 320, clickedCount: 42, reportedCount: 280, targetDepartments: ['IT & Security'], startDate: '2025-05-01', endDate: null, createdBy: 'admin', emailSubject: 'Action required: Reset your IT password' },
  { id: '2', name: 'CEO Wire Transfer', status: 'complete', sentCount: 180, clickedCount: 9, reportedCount: 171, targetDepartments: ['Finance', 'Executive'], startDate: '2025-04-15', endDate: '2025-04-30', createdBy: 'admin', emailSubject: 'Urgent: Authorise wire transfer' },
  { id: '3', name: 'HR Policy Update', status: 'active', sentCount: 240, clickedCount: 31, reportedCount: 208, targetDepartments: ['Human Resources'], startDate: '2025-05-05', endDate: null, createdBy: 'admin', emailSubject: 'Important: New HR policy requires your acknowledgement' },
  { id: '4', name: 'Parcel Delivery', status: 'draft', sentCount: 0, clickedCount: 0, reportedCount: 0, targetDepartments: ['All'], startDate: '2025-05-20', endDate: null, createdBy: 'admin', emailSubject: 'Your parcel could not be delivered' },
  { id: '5', name: 'IT Upgrade Notice', status: 'scheduled', sentCount: 0, clickedCount: 0, reportedCount: 0, targetDepartments: ['All'], startDate: '2025-06-01', endDate: null, createdBy: 'admin', emailSubject: 'Scheduled: System upgrade requires your credentials' },
];

const STATUS_BADGE: Record<WaveStatus, React.ReactNode> = {
  active:    <Badge variant="success">Active</Badge>,
  complete:  <Badge variant="primary">Complete</Badge>,
  draft:     <Badge variant="neutral">Draft</Badge>,
  scheduled: <Badge variant="warning">Scheduled</Badge>,
};

export function Waves({ onNavigate, activePath }: WavesProps) {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const [filter, setFilter] = useState<WaveStatus | 'all'>('all');
  const displayed = MOCK_WAVES.filter(w => filter === 'all' || w.status === filter);
  const tabs: (WaveStatus | 'all')[] = ['all', 'active', 'scheduled', 'draft', 'complete'];
  return (
    <AppLayout activePath={activePath} onNavigate={onNavigate} title="Phishing Waves"
      subtitle={`${MOCK_WAVES.filter(w => w.status === 'active').length} active phishing waves`}
      securityScore={72}>
      {/* Tabs + action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', borderRadius: 10, padding: 4, border: '1px solid var(--border)' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setFilter(t)} style={{
              padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif',
              background: filter === t ? 'var(--color-primary)' : 'transparent',
              color: filter === t ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap'}}>
            <Button variant="ghost" onClick={() => onNavigate('/waves/create-email')} icon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16v16H4z" /><path d="m4 6 8 6 8-6" /><line x1="12" y1="15" x2="12" y2="21" /><line x1="9" y1="18" x2="15" y2="18" /></svg>
            }
            style={{ minWidth: 72 }}>
              Create Email
            </Button>
            <Button variant="ghost" onClick={() => onNavigate('/waves/send-email')} icon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
            }
            style={{ minWidth: 72 }}>
              Send Existing Email
            </Button>
            <Button onClick={() => onNavigate('/waves/schedule')} icon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            }
            style={{ minWidth: 72 }}>
              Schedule Wave
            </Button>
          </div>
        )}
      </div>
      {/* Wave cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {displayed.map(w => {
          const detectionRate = w.sentCount > 0 ? Math.round((w.reportedCount / w.sentCount) * 100) : 0;
          const clickRate = w.sentCount > 0 ? Math.round((w.clickedCount / w.sentCount) * 100) : 0;
          return (
            <Card
              key={w.id}
              style={{ padding: '18px 20px', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
              onClick={() => {
                onNavigate(`/waves/${w.id}`);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{w.name}</span>
                    {STATUS_BADGE[w.status]}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif', marginBottom: 4 }}>
                    {w.emailSubject}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                    Target: {w.targetDepartments.join(', ')} &nbsp;·&nbsp; Started: {new Date(w.startDate).toLocaleDateString('en-ZA')}
                    {w.endDate && ` · Ended: ${new Date(w.endDate).toLocaleDateString('en-ZA')}`}
                  </p>
                </div>
                {w.sentCount > 0 && (
                  <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
                    {[
                      { lbl: 'Sent', val: w.sentCount.toLocaleString(), color: 'var(--text-primary)' },
                      { lbl: 'Clicked', val: `${clickRate}%`, color: clickRate > 15 ? 'var(--color-danger)' : clickRate > 8 ? 'var(--color-warning)' : 'var(--color-success)' },
                      { lbl: 'Reported', val: `${detectionRate}%`, color: 'var(--color-success)' },
                    ].map(s => (
                      <div key={s.lbl} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: 'Inter, system-ui, sans-serif' }}>{s.val}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>{s.lbl}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
        {displayed.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'Inter, system-ui, sans-serif' }}>
            No phishing waves found for this filter.
          </div>
        )}
      </div>
    </AppLayout>
  );
}

interface WaveDetailProps {
  onNavigate: (path: string) => void;
  activePath: string;
  waveId: string;
}

const USER_RESULTS = [
  { name: 'Sipho Ndlovu', dept: 'IT & Security', outcome: 'reported', time: '2m after receipt' },
  { name: 'Aisha Patel', dept: 'IT & Security', outcome: 'reported', time: '5m after receipt' },
  { name: 'Marco van Dyk', dept: 'Finance', outcome: 'clicked', time: '3m after receipt' },
  { name: 'Lebo Dlamini', dept: 'Operations', outcome: 'no_response', time: '—' },
  { name: 'Fatima Hassan', dept: 'Human Resources', outcome: 'reported', time: '12m after receipt' },
  { name: 'Jan de Beer', dept: 'Finance', outcome: 'clicked', time: '1m after receipt' },
];

export function WaveDetail({ onNavigate, activePath, waveId }: WaveDetailProps) {
  const { hasRole } = useAuth();
  const { addToast } = useToast();
  const isAdmin = hasRole('admin');
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | 'reported' | 'clicked' | 'no_response'>('all');
  const wave = MOCK_WAVES.find(w => w.id === waveId) ?? MOCK_WAVES[0];
  const detRate = wave.sentCount > 0 ? Math.round((wave.reportedCount / wave.sentCount) * 100) : 0;
  const clickRate = wave.sentCount > 0 ? Math.round((wave.clickedCount / wave.sentCount) * 100) : 0;
  const filtered = USER_RESULTS.filter(u => outcomeFilter === 'all' || u.outcome === outcomeFilter);

  const handleEnd = () => {
    addToast({ type: 'warning', title: 'Wave ended', message: `"${wave.name}" has been ended.` });
    onNavigate('/waves');
  };
  return (
    <AppLayout activePath={activePath} onNavigate={onNavigate}
      title={wave.name}
      breadcrumbs={[{ label: 'Phishing Waves', path: '/waves' }, { label: wave.name }]}
      securityScore={72}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {STATUS_BADGE[wave.status]}
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>
            Started {new Date(wave.startDate).toLocaleDateString('en-ZA')}
            {wave.endDate && ` · Ended ${new Date(wave.endDate).toLocaleDateString('en-ZA')}`}
          </span>
        </div>
        {isAdmin && wave.status === 'active' && (
          <Button variant="danger" size="sm" onClick={handleEnd}>End Wave</Button>
        )}
      </div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { lbl: 'Emails Sent', val: wave.sentCount.toLocaleString(), color: 'var(--text-primary)' },
          { lbl: 'Click Rate', val: `${clickRate}%`, color: clickRate > 15 ? 'var(--color-danger)' : clickRate > 8 ? 'var(--color-warning)' : 'var(--color-success)' },
          { lbl: 'Detection Rate', val: `${detRate}%`, color: 'var(--color-success)' },
          { lbl: 'No Response', val: String(wave.sentCount - wave.clickedCount - wave.reportedCount), color: 'var(--text-muted)' },
        ].map(s => (
          <Card key={s.lbl} style={{ padding: '16px 18px' }}>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>{s.lbl}</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: 'Inter, system-ui, sans-serif' }}>{s.val}</p>
          </Card>
        ))}
      </div>
      {/* Details card */}
      <Card style={{ padding: '18px 20px', marginBottom: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, fontFamily: 'Inter, system-ui, sans-serif' }}>Wave Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { k: 'Email subject', v: wave.emailSubject ?? '—' },
            { k: 'Target departments', v: wave.targetDepartments.join(', ') },
            { k: 'Created by', v: wave.createdBy },
            { k: 'AI model', v: 'GPT-4 (manual override)' },
          ].map(d => (
            <div key={d.k}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, fontFamily: 'Inter, system-ui, sans-serif' }}>{d.k}</div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, fontFamily: 'Inter, system-ui, sans-serif' }}>{d.v}</div>
            </div>
          ))}
        </div>
      </Card>
      {/* User results table */}
      <Card>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>User Results</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'reported', 'clicked', 'no_response'] as const).map(f => (
              <button key={f} onClick={() => setOutcomeFilter(f)} style={{
                padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer',
                fontSize: 11, fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif',
                background: outcomeFilter === f ? 'var(--color-primary)' : 'var(--bg-hover)',
                color: outcomeFilter === f ? '#fff' : 'var(--text-secondary)',
              }}>
                {f === 'no_response' ? 'No Response' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-hover)' }}>
              {['USER', 'DEPARTMENT', 'OUTCOME', 'RESPONSE TIME'].map(h => (
                <th key={h} style={{ padding: '8px 16px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', letterSpacing: '0.5px', fontFamily: 'Inter, system-ui, sans-serif' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{u.name}</td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{u.dept}</td>
                <td style={{ padding: '10px 16px' }}>
                  <Badge variant={u.outcome === 'reported' ? 'success' : u.outcome === 'clicked' ? 'danger' : 'neutral'}>
                    {u.outcome === 'no_response' ? 'No Response' : u.outcome.charAt(0).toUpperCase() + u.outcome.slice(1)}
                  </Badge>
                </td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>{u.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AppLayout>
  );
}
