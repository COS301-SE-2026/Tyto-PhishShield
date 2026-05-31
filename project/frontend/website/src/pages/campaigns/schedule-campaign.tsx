import React, { useState } from 'react';
import { AppLayout } from '../../components/layout/app-layout';
import { Card, Button, Input, Select } from '../../components/ui';
import { useToast } from '../../context/toast-context';
import { API_BASE, authFetch } from '../../services/api';

interface ScheduleCampaignProps {
  onNavigate: (path: string) => void;
  activePath: string;
}

type Step = 1 | 2 | 3;

const DIFFICULTY_OPTIONS = [
  { value: 'easy',   label: 'Easy (Obvious hints)' },
  { value: 'medium', label: 'Medium (Realistic but detectable)' },
  { value: 'hard',   label: 'Hard (Realistic impersonation)' },
];

function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { n: 1 as Step, label: 'Email template' },
    { n: 2 as Step, label: 'Recipients and schedule' },
    { n: 3 as Step, label: 'Review and confirm' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
      {steps.map((s, i) => { const done = current > s.n;
        const active = current === s.n;
        return (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: done ? 'var(--color-success)' : active ? 'var(--color-primary)' : 'var(--bg-hover)',
                border: `2px solid ${done ? 'var(--color-success)' : active ? 'var(--color-primary)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: (done || active) ? '#fff' : 'var(--text-muted)',
                fontFamily: 'Inter, system-ui, sans-serif', }}>
                {done ? '✓' : s.n}
              </div>
              <span style={{ fontSize: 12, fontWeight: active ? 700 : 400,
                color: active ? 'var(--text-primary)' : done ? 'var(--color-success)' : 'var(--text-muted)',
                fontFamily: 'Inter, system-ui, sans-serif', whiteSpace: 'nowrap', }}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, margin: '0 12px',
                background: done ? 'var(--color-success)' : 'var(--border)', transition: 'background 0.3s', }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface EmailTemplateForm {
  campaignName: string;
  sender: string;
  alias: string;
  subject: string;
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface ScheduleForm {
  recipientsRaw: string;
  scheduledAt: string;
}

export function ScheduleCampaign({ onNavigate, activePath }: ScheduleCampaignProps) {
  const { addToast } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [templateForm, setTemplateForm] = useState<EmailTemplateForm>({
    campaignName: '', sender: '', alias: '', subject: '', content: '', difficulty: 'medium', });
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>({
    recipientsRaw: '', scheduledAt: '', });
  const [templateErrors, setTemplateErrors] = useState<Partial<EmailTemplateForm>>({});
  const [scheduleErrors, setScheduleErrors] = useState<Partial<ScheduleForm>>({});
  const setT = (k: keyof EmailTemplateForm, v: string) => setTemplateForm(p => ({ ...p, [k]: v }));
  const setS = (k: keyof ScheduleForm, v: string) => setScheduleForm(p => ({ ...p, [k]: v }));
  const validateStep1 = (): boolean => { const e: Partial<EmailTemplateForm> = {};
    if (!templateForm.campaignName.trim()) e.campaignName = 'A campaign name is required.';
    if (!templateForm.sender.trim()) e.sender = 'Sender email is required.';
    else if (!/\S+@\S+\.\S+/.test(templateForm.sender)) e.sender = 'Enter a valid email address.';
    if (!templateForm.subject.trim()) e.subject = 'Subject line is required.';
    if (!templateForm.content.trim()) e.content = 'Email body is required.';
    setTemplateErrors(e);
    return Object.keys(e).length === 0;
  };
  const validateStep2 = (): boolean => { const e: Partial<ScheduleForm> = {};
    const recipients = parseRecipients(scheduleForm.recipientsRaw);
    if (recipients.length === 0) e.recipientsRaw = 'Enter at least one recipient email.';
    else if (recipients.some(r => !/\S+@\S+\.\S+/.test(r))) e.recipientsRaw = 'One or more email addresses are invalid.';
    if (!scheduleForm.scheduledAt) e.scheduledAt = 'A schedule date and time is required.';
    else if (new Date(scheduleForm.scheduledAt) <= new Date()) e.scheduledAt = 'Scheduled time must be in the future.';
    setScheduleErrors(e);
    return Object.keys(e).length === 0;
  };
  const parseRecipients = (raw: string): string[] => raw.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
  const handleSchedule = async () => {
    setLoading(true);
    try {
      const createRes = await authFetch(`${API_BASE}/emails`, { method: 'POST',
        body: JSON.stringify({
          sender: templateForm.sender, alias: templateForm.alias || undefined,
          subject: templateForm.subject, content: templateForm.content,
          difficulty: templateForm.difficulty, }),
      });
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? `Template creation failed (${createRes.status})`);
      }
      const template = await createRes.json() as { referenceNumber: string };
      const refNum = template.referenceNumber;
      const recipients = parseRecipients(scheduleForm.recipientsRaw);
      const scheduledAt = new Date(scheduleForm.scheduledAt).toISOString();
      const results = await Promise.allSettled(
        recipients.map(recipient => authFetch(`${API_BASE}/emails/${refNum}/schedule-send-single`, {
            method: 'POST', body: JSON.stringify({ recipient, scheduledAt }), }))
      );
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) {
        addToast({ type: 'warning', title: 'Partial success',
          message: `${recipients.length - failed} of ${recipients.length} recipients scheduled. ${failed} failed.`, });
      } else {
        addToast({ type: 'success', title: 'Campaign scheduled!',
          message: `"${templateForm.campaignName}" scheduled for ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''}.`,
        });
      }
      onNavigate('/campaigns');
    } catch (err: unknown) {
      addToast({ type: 'error', title: 'Scheduling failed',
        message: err instanceof Error ? err.message : 'Some error occurred.',
      });
    } finally { setLoading(false); }
  };
  const recipients = parseRecipients(scheduleForm.recipientsRaw);
  const scheduledDate = scheduleForm.scheduledAt
    ? new Date(scheduleForm.scheduledAt).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: 'var(--text-primary)',
    display: 'block', marginBottom: 5, fontFamily: 'Inter, system-ui, sans-serif', };
  const errorStyle: React.CSSProperties = {
    fontSize: 11, color: 'var(--color-danger)', marginTop: 4, fontFamily: 'Inter, system-ui, sans-serif', };
  return (
    <AppLayout
      activePath = {activePath}
      onNavigate = {onNavigate}
      title = "Schedule Campaign"
      breadcrumbs = {[{ label: 'Campaigns', path: '/campaigns' }, { label: 'Schedule Campaign' }]}
      securityScore = {72}
    >
      <div style={{ maxWidth: 680 }}>
        <StepIndicator current={step} />
        {/* Email template */}
        {step === 1 && (
          <Card style={{ padding: '24px 28px' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>
              Phishing email template
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input
                label = "Campaign name"
                placeholder = "e.g. Awareness Test (fraud)"
                value = {templateForm.campaignName}
                onChange = {e => { setT('campaignName', e.target.value); setTemplateErrors(p => ({ ...p, campaignName: undefined })); }}
                error={templateErrors.campaignName}
                required
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input
                  label = "Sender email"
                  type = "email"
                  placeholder = "it-support@business.com"
                  value = {templateForm.sender}
                  onChange = {e => { setT('sender', e.target.value); setTemplateErrors(p => ({ ...p, sender: undefined })); }}
                  error={templateErrors.sender}
                  required
                />
                <Input
                  label="Display name (optional)"
                  placeholder="IT Support Team"
                  value={templateForm.alias}
                  onChange={e => setT('alias', e.target.value)}
                />
              </div>
              <Input
                label="Email subject line"
                placeholder="e.g. Urgent: Your account will be suspended"
                value={templateForm.subject}
                onChange={e => { setT('subject', e.target.value); setTemplateErrors(p => ({ ...p, subject: undefined })); }}
                error={templateErrors.subject}
                required
              />
              <div>
                <label style={labelStyle}>
                  Email body <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <textarea
                  rows={7}
                  placeholder="Include the phishing email body (message) here."
                  value={templateForm.content}
                  onChange={e => { setT('content', e.target.value); setTemplateErrors(p => ({ ...p, content: undefined })); }}
                  style={{
                    width: '100%', border: `1.5px solid ${templateErrors.content ? 'var(--color-danger)' : 'var(--border)'}`,
                    borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text-primary)', background: 'var(--bg-input)',
                    fontFamily: 'Inter, system-ui, sans-serif', resize: 'vertical', outline: 'none', lineHeight: 1.5,
                  }}
                />
                {templateErrors.content && <p style={errorStyle}>{templateErrors.content}</p>}
              </div>
              <Select
                label="Difficulty level"
                value={templateForm.difficulty}
                onChange={e => setT('difficulty', e.target.value as EmailTemplateForm['difficulty'])}
                options={DIFFICULTY_OPTIONS}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <Button onClick={() => { if (validateStep1()) setStep(2); }}>
                Continue to Recipients
              </Button>
            </div>
          </Card>
        )}

        {/* Recipients and schedule */}
        {step === 2 && (
          <Card style={{ padding: '24px 28px' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>
              Recipients and schedule
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>
                  Recipient email addresses <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <textarea
                  rows={6}
                  placeholder={'Enter one email per line, or comma/semicolon-separated:\nuser1@company.com\nuser2@company.com, user3@company.com'}
                  value={scheduleForm.recipientsRaw}
                  onChange={e => { setS('recipientsRaw', e.target.value); setScheduleErrors(p => ({ ...p, recipientsRaw: undefined })); }}
                  style={{
                    width: '100%', border: `1.5px solid ${scheduleErrors.recipientsRaw ? 'var(--color-danger)' : 'var(--border)'}`,
                    borderRadius: 8, padding: '9px 12px', fontSize: 13,
                    color: 'var(--text-primary)', background: 'var(--bg-input)',
                    fontFamily: 'Inter, system-ui, sans-serif', resize: 'vertical',
                    outline: 'none', lineHeight: 1.6,
                  }}
                />
                {scheduleErrors.recipientsRaw && <p style={errorStyle}>{scheduleErrors.recipientsRaw}</p>}
                {recipients.length > 0 && !scheduleErrors.recipientsRaw && (
                  <p style={{ fontSize: 11, color: 'var(--color-success)', marginTop: 4, fontFamily: 'Inter, system-ui, sans-serif' }}>
                    {recipients.length} recipient{recipients.length !== 1 ? 's' : ''} parsed
                  </p>
                )}
              </div>
              <Input
                label="Scheduled date & time"
                type="datetime-local"
                value={scheduleForm.scheduledAt}
                onChange={e => { setS('scheduledAt', e.target.value); setScheduleErrors(p => ({ ...p, scheduledAt: undefined })); }}
                error={scheduleErrors.scheduledAt}
                required
              />
              <div style={{
                background: 'var(--bg-hover)', borderRadius: 8, padding: '12px 14px',
                fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif',
              }}>
                Emails will be dispatched using Resend at the scheduled time. Ensure all recipient addresses belong to your organisation.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 24 }}>
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => { if (validateStep2()) setStep(3); }}>Review Campaign</Button>
            </div>
          </Card>
        )}

        {/* Review and confirm */}
        {step === 3 && (
          <Card style={{ padding: '24px 28px' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>
              Review and confirm
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Campaign name', value: templateForm.campaignName },
                { label: 'Sender', value: templateForm.alias ? `${templateForm.alias} <${templateForm.sender}>` : templateForm.sender },
                { label: 'Subject', value: templateForm.subject },
                { label: 'Difficulty', value: DIFFICULTY_OPTIONS.find(o => o.value === templateForm.difficulty)?.label ?? templateForm.difficulty },
                { label: 'Recipients', value: `${recipients.length} address${recipients.length !== 1 ? 'es' : ''}` },
                { label: 'Scheduled at', value: scheduledDate },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 140, flexShrink: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>{row.label}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, fontFamily: 'Inter, system-ui, sans-serif' }}>{row.value}</span>
                </div>
              ))}
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'Inter, system-ui, sans-serif' }}>Preview (first 300 characters)</p>
                <div style={{
                  background: 'var(--bg-hover)', borderRadius: 8, padding: '10px 14px',
                  fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace',
                  lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {templateForm.content.slice(0, 300)}{templateForm.content.length > 300 ? '…' : ''}
                </div>
              </div>
              <div style={{
                background: 'var(--color-warning-light)', border: '1px solid var(--color-warning-border)',
                borderRadius: 8, padding: '12px 14px', fontSize: 12,
                color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif',
              }}>
                Emails will be sent to the target recipients at the scheduled time and cannot be undone.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 24 }}>
              <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
              <Button loading={loading} onClick={() => { void handleSchedule(); }}>
                Confirm and Schedule Campaign
              </Button>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}