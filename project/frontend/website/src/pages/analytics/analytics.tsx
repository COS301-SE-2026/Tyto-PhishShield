import { useState } from 'react';
import { AppLayout } from '../../components/layout/app-layout';
import { Card, Badge } from '../../components/ui';

interface AnalyticsProps { onNavigate: (path: string) => void; activePath: string; }

const BAR_DATA = [
  { dept: 'IT & Security', detection: 94, click: 4 },
  { dept: 'Finance',       detection: 78, click: 18 },
  { dept: 'HR',            detection: 82, click: 14 },
  { dept: 'Legal',         detection: 88, click: 10 },
  { dept: 'Operations',    detection: 71, click: 22 },
  { dept: 'Executive',     detection: 85, click: 12 },
];

export function Analytics({ onNavigate, activePath }: AnalyticsProps) {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  return (
    <AppLayout activePath={activePath} onNavigate={onNavigate} title="Analytics"
      subtitle="Organisation-wide security metrics" securityScore={72}>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { lbl: 'Avg Detection Rate', val: '83%', delta: '+4%', good: true },
          { lbl: 'Avg Click Rate', val: '13%', delta: '−3%', good: true },
          { lbl: 'Total Simulations', val: '1,240', delta: '+12%', good: true },
          { lbl: 'At-Risk Users', val: '17', delta: '−5', good: true },
          { lbl: 'Training Completion', val: '61%', delta: '+8%', good: true },
        ].map(k => (
          <Card key={k.lbl} style={{ padding: '16px 18px' }}>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>{k.lbl}</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{k.val}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: k.good ? 'var(--color-success)' : 'var(--color-danger)', paddingBottom: 3, fontFamily: 'Inter, system-ui, sans-serif' }}>{k.delta}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Detection rate over time */}
      <Card style={{ padding: '20px 22px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>Detection Rate Over Time</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['7d','30d','90d'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '4px 12px', borderRadius: 6, border: '1.5px solid var(--border)', cursor: 'pointer',
                fontSize: 11, fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif',
                background: period === p ? 'var(--color-primary)' : 'var(--bg-hover)',
                color: period === p ? '#fff' : 'var(--text-secondary)',
              }}>{p}</button>
            ))}
          </div>
        </div>
        <svg viewBox="0 0 700 160" style={{ width: '100%', height: 160 }}>
          <defs>
            <linearGradient id="detGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.2"/>
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.15"/>
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0"/>
            </linearGradient>
          </defs>
          {/* Grid lines */}
          {[0,40,80,120].map(y => (
            <line key={y} x1="0" y1={y} x2="700" y2={y} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4,4"/>
          ))}
          {/* Detection rate line */}
          <path d="M0,100 C80,95 140,70 200,60 C260,50 320,80 380,60 C440,40 520,30 580,22 C630,16 670,18 700,14"
            fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M0,100 C80,95 140,70 200,60 C260,50 320,80 380,60 C440,40 520,30 580,22 C630,16 670,18 700,14 L700,160 L0,160Z"
            fill="url(#detGrad)"/>
          {/* Click rate line */}
          <path d="M0,140 C80,138 140,130 200,128 C260,126 320,132 380,125 C440,118 520,110 580,105 C630,101 670,103 700,100"
            fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="5,3"/>
          {/* Legend */}
          <circle cx="16" cy="150" r="5" fill="#2563EB"/>
          <text x="26" y="154" fontSize="10" fill="var(--text-secondary)" fontFamily="Inter, system-ui, sans-serif">Detection rate</text>
          <circle cx="130" cy="150" r="5" fill="#EF4444"/>
          <text x="140" y="154" fontSize="10" fill="var(--text-secondary)" fontFamily="Inter, system-ui, sans-serif">Click rate</text>
        </svg>
      </Card>

      {/* Department breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 16 }}>
        <Card style={{ padding: '20px 22px' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, fontFamily: 'Inter, system-ui, sans-serif' }}>Detection Rate by Department</h2>
          {BAR_DATA.map(d => (
            <div key={d.dept} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{d.dept}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: d.detection >= 90 ? 'var(--color-success)' : d.detection >= 75 ? 'var(--color-warning)' : 'var(--color-danger)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  {d.detection}%
                </span>
              </div>
              <div style={{ background: 'var(--border)', borderRadius: 20, height: 7 }}>
                <div style={{
                  height: 7, borderRadius: 20,
                  width: `${d.detection}%`,
                  background: d.detection >= 90 ? 'var(--color-success)' : d.detection >= 75 ? 'var(--color-warning)' : 'var(--color-danger)',
                  transition: 'width 1s ease',
                }}/>
              </div>
            </div>
          ))}
        </Card>

        <Card style={{ padding: '20px 22px' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, fontFamily: 'Inter, system-ui, sans-serif' }}>At-Risk Users</h2>
          {[
            { name: 'Jan de Beer', dept: 'Finance', clickRate: '18%', risk: 'high' },
            { name: 'Nadia Botha', dept: 'Legal', clickRate: '22%', risk: 'high' },
            { name: 'Fatima Hassan', dept: 'HR', clickRate: '12%', risk: 'medium' },
            { name: 'Thabiso Mokoena', dept: 'Operations', clickRate: '15%', risk: 'medium' },
          ].map((u, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0', borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: u.risk === 'high' ? 'var(--color-danger-light)' : 'var(--color-warning-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: u.risk === 'high' ? 'var(--color-danger)' : 'var(--color-warning)', flexShrink: 0 }}>
                {u.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{u.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>{u.dept}</div>
              </div>
              <Badge variant={u.risk === 'high' ? 'danger' : 'warning'}>
                {u.clickRate} click rate
              </Badge>
            </div>
          ))}
        </Card>
      </div>

      {/* Campaign performance table */}
      <Card>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>Campaign Performance Summary</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-hover)' }}>
                {['CAMPAIGN','SENT','CLICKED','REPORTED','DET. RATE','CLICK RATE','STATUS'].map(h => (
                  <th key={h} style={{ padding: '8px 16px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', letterSpacing: '0.5px', fontFamily: 'Inter, system-ui, sans-serif', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'IT Support Reset', sent: 320, clicked: 42, reported: 280, status: 'active' },
                { name: 'CEO Wire Transfer', sent: 180, clicked: 9, reported: 171, status: 'complete' },
                { name: 'HR Policy Update', sent: 240, clicked: 31, reported: 208, status: 'active' },
              ].map(c => {
                const det = Math.round((c.reported / c.sent) * 100);
                const cl = Math.round((c.clicked / c.sent) * 100);
                return (
                  <tr key={c.name} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{c.name}</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{c.sent}</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--color-danger)', fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif' }}>{c.clicked}</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--color-success)', fontWeight: 500, fontFamily: 'Inter, system-ui, sans-serif' }}>{c.reported}</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, fontWeight: 700, color: det >= 85 ? 'var(--color-success)' : 'var(--color-warning)', fontFamily: 'Inter, system-ui, sans-serif' }}>{det}%</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, fontWeight: 700, color: cl > 15 ? 'var(--color-danger)' : cl > 8 ? 'var(--color-warning)' : 'var(--color-success)', fontFamily: 'Inter, system-ui, sans-serif' }}>{cl}%</td>
                    <td style={{ padding: '10px 16px' }}><Badge variant={c.status === 'active' ? 'success' : 'primary'}>{c.status.charAt(0).toUpperCase() + c.status.slice(1)}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </AppLayout>
  );
}
