import React, { useState } from 'react';
import { AppLayout } from '../../components/layout/app-layout';
import { Card, Badge, Button, Modal, Input, Select } from '../../components/ui';
import { useAuth } from '../../context/auth-context';
import { useToast } from '../../context/toast-context';
import type { Campaign, CampaignStatus } from '../../types';

interface CampaignsProps {
  onNavigate: (path: string) => void;
  activePath: string;
}

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: '1', name: 'IT Support Reset', status: 'active', sentCount: 320, clickedCount: 42, reportedCount: 280, targetDepartments: ['IT & Security'], startDate: '2025-05-01', endDate: null, createdBy: 'admin', emailSubject: 'Action required: Reset your IT password' },
  { id: '2', name: 'CEO Wire Transfer', status: 'complete', sentCount: 180, clickedCount: 9, reportedCount: 171, targetDepartments: ['Finance', 'Executive'], startDate: '2025-04-15', endDate: '2025-04-30', createdBy: 'admin', emailSubject: 'Urgent: Authorise wire transfer' },
  { id: '3', name: 'HR Policy Update', status: 'active', sentCount: 240, clickedCount: 31, reportedCount: 208, targetDepartments: ['Human Resources'], startDate: '2025-05-05', endDate: null, createdBy: 'admin', emailSubject: 'Important: New HR policy requires your acknowledgement' },
  { id: '4', name: 'Parcel Delivery', status: 'draft', sentCount: 0, clickedCount: 0, reportedCount: 0, targetDepartments: ['All'], startDate: '2025-05-20', endDate: null, createdBy: 'admin', emailSubject: 'Your parcel could not be delivered' },
  { id: '5', name: 'IT Upgrade Notice', status: 'scheduled', sentCount: 0, clickedCount: 0, reportedCount: 0, targetDepartments: ['All'], startDate: '2025-06-01', endDate: null, createdBy: 'admin', emailSubject: 'Scheduled: System upgrade requires your credentials' },
];

const STATUS_BADGE: Record<CampaignStatus, React.ReactNode> = {
  active:    <Badge variant="success">Active</Badge>,
  complete:  <Badge variant="primary">Complete</Badge>,
  draft:     <Badge variant="neutral">Draft</Badge>,
  scheduled: <Badge variant="warning">Scheduled</Badge>,
};

function NewCampaignModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addToast } = useToast();
  const [form, setForm] = useState({
    name: '', emailSubject: '', emailBody: '', departments: 'all', scheduledDate: '',
  });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const valid = !!form.name.trim() && !!form.emailSubject.trim() && !!form.emailBody.trim();

  const handleCreate = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800)); // TODO: POST /api/campaigns
    addToast({ type: 'success', title: 'Campaign created', message: `"${form.name}" saved as draft.` });
    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Campaign" maxWidth={560}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Campaign name" placeholder="e.g. IT Support Reset" value={form.name}
          onChange={e => set('name', e.target.value)} required />
        <Select label="Target departments" value={form.departments}
          onChange={e => set('departments', e.target.value)}
          options={[
            { value: 'all', label: 'All departments' },
            { value: 'it_security', label: 'IT & Security' },
            { value: 'finance', label: 'Finance' },
            { value: 'hr', label: 'Human Resources' },
            { value: 'legal', label: 'Legal & Compliance' },
            { value: 'operations', label: 'Operations' },
            { value: 'executive', label: 'Executive' },
          ]} />
        <Input label="Email subject line" placeholder="e.g. URGENT: Password reset required"
          value={form.emailSubject} onChange={e => set('emailSubject', e.target.value)} required />
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 5, fontFamily: 'Inter, system-ui, sans-serif' }}>
            Email body <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <textarea rows={5} placeholder="Paste the phishing email content here…"
            value={form.emailBody} onChange={e => set('emailBody', e.target.value)}
            style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text-primary)', background: 'var(--bg-input)', fontFamily: 'Inter, system-ui, sans-serif', resize: 'vertical', outline: 'none', lineHeight: 1.5 }} />
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'Inter, system-ui, sans-serif' }}>
            AI-generated email selection will be available once the generation microservice is ready.
          </p>
        </div>
        <Input label="Schedule date (optional)" type="date" value={form.scheduledDate}
          onChange={e => set('scheduledDate', e.target.value)} />
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Button variant="ghost" onClick={onClose} style={{ paddingLeft: 20, paddingRight: 20 }}>Cancel</Button>
          <Button fullWidth loading={loading} disabled={!valid} onClick={handleCreate}>
            Save as Draft
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function Campaigns({ onNavigate, activePath }: CampaignsProps) {
  const { hasRole, canAccess } = useAuth();
  const isAdmin = hasRole('admin');
  const [filter, setFilter] = useState<CampaignStatus | 'all'>('all');
  const [newOpen, setNewOpen] = useState(false);

  const displayed = MOCK_CAMPAIGNS.filter(c => filter === 'all' || c.status === filter);
  const tabs: (CampaignStatus | 'all')[] = ['all', 'active', 'scheduled', 'draft', 'complete'];

  return (
    <AppLayout activePath={activePath} onNavigate={onNavigate} title="Campaigns"
      subtitle={`${MOCK_CAMPAIGNS.filter(c => c.status === 'active').length} active campaigns`}
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
          <Button onClick={() => setNewOpen(true)} icon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          }>
            New Campaign
          </Button>
        )}
      </div>

      {/* Campaign cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {displayed.map(c => {
          const detectionRate = c.sentCount > 0 ? Math.round((c.reportedCount / c.sentCount) * 100) : 0;
          const clickRate = c.sentCount > 0 ? Math.round((c.clickedCount / c.sentCount) * 100) : 0;
          return (
            <Card key={c.id} style={{ padding: '18px 20px', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
              onClick={() => onNavigate(`/campaigns/${c.id}`)}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{c.name}</span>
                    {STATUS_BADGE[c.status]}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif', marginBottom: 4 }}>
                    {c.emailSubject}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                    Target: {c.targetDepartments.join(', ')} &nbsp;·&nbsp; Started: {new Date(c.startDate).toLocaleDateString('en-ZA')}
                    {c.endDate && ` · Ended: ${new Date(c.endDate).toLocaleDateString('en-ZA')}`}
                  </p>
                </div>
                {c.sentCount > 0 && (
                  <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
                    {[
                      { lbl: 'Sent', val: c.sentCount.toLocaleString(), color: 'var(--text-primary)' },
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
            No campaigns found for this filter.
          </div>
        )}
      </div>

      <NewCampaignModal isOpen={newOpen} onClose={() => setNewOpen(false)} />
    </AppLayout>
  );
}

interface CampaignDetailProps {
  onNavigate: (path: string) => void;
  activePath: string;
  campaignId: string;
}

const USER_RESULTS = [
  { name: 'Sipho Ndlovu', dept: 'IT & Security', outcome: 'reported', time: '2m after receipt' },
  { name: 'Aisha Patel', dept: 'IT & Security', outcome: 'reported', time: '5m after receipt' },
  { name: 'Marco van Dyk', dept: 'Finance', outcome: 'clicked', time: '3m after receipt' },
  { name: 'Lebo Dlamini', dept: 'Operations', outcome: 'no_response', time: '—' },
  { name: 'Fatima Hassan', dept: 'Human Resources', outcome: 'reported', time: '12m after receipt' },
  { name: 'Jan de Beer', dept: 'Finance', outcome: 'clicked', time: '1m after receipt' },
];

export function CampaignDetail({ onNavigate, activePath, campaignId }: CampaignDetailProps) {
  const { hasRole } = useAuth();
  const { addToast } = useToast();
  const isAdmin = hasRole('admin');
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | 'reported' | 'clicked' | 'no_response'>('all');

  const campaign = MOCK_CAMPAIGNS.find(c => c.id === campaignId) ?? MOCK_CAMPAIGNS[0];
  const detRate = campaign.sentCount > 0 ? Math.round((campaign.reportedCount / campaign.sentCount) * 100) : 0;
  const clickRate = campaign.sentCount > 0 ? Math.round((campaign.clickedCount / campaign.sentCount) * 100) : 0;

  const filtered = USER_RESULTS.filter(u => outcomeFilter === 'all' || u.outcome === outcomeFilter);

  const handleEnd = () => {
    addToast({ type: 'warning', title: 'Campaign ended', message: `"${campaign.name}" has been ended.` });
    onNavigate('/campaigns');
  };

  return (
    <AppLayout activePath={activePath} onNavigate={onNavigate}
      title={campaign.name}
      breadcrumbs={[{ label: 'Campaigns', path: '/campaigns' }, { label: campaign.name }]}
      securityScore={72}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {STATUS_BADGE[campaign.status]}
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>
            Started {new Date(campaign.startDate).toLocaleDateString('en-ZA')}
            {campaign.endDate && ` · Ended ${new Date(campaign.endDate).toLocaleDateString('en-ZA')}`}
          </span>
        </div>
        {isAdmin && campaign.status === 'active' && (
          <Button variant="danger" size="sm" onClick={handleEnd}>End Campaign</Button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { lbl: 'Emails Sent', val: campaign.sentCount.toLocaleString(), color: 'var(--text-primary)' },
          { lbl: 'Click Rate', val: `${clickRate}%`, color: clickRate > 15 ? 'var(--color-danger)' : clickRate > 8 ? 'var(--color-warning)' : 'var(--color-success)' },
          { lbl: 'Detection Rate', val: `${detRate}%`, color: 'var(--color-success)' },
          { lbl: 'No Response', val: String(campaign.sentCount - campaign.clickedCount - campaign.reportedCount), color: 'var(--text-muted)' },
        ].map(s => (
          <Card key={s.lbl} style={{ padding: '16px 18px' }}>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>{s.lbl}</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: 'Inter, system-ui, sans-serif' }}>{s.val}</p>
          </Card>
        ))}
      </div>

      {/* Details card */}
      <Card style={{ padding: '18px 20px', marginBottom: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, fontFamily: 'Inter, system-ui, sans-serif' }}>Campaign Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { k: 'Email subject', v: campaign.emailSubject ?? '—' },
            { k: 'Target departments', v: campaign.targetDepartments.join(', ') },
            { k: 'Created by', v: campaign.createdBy },
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
