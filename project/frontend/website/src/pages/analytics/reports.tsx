import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { AppLayout } from '../../components/layout/app-layout';
import { Card, Button, Badge, Select, Spinner, ComingSoon } from '../../components/ui';
import { useToast } from '../../context/toast-context';
import { getWaves, type Wave } from '../../services/wave';
import { fetchAllUsers, fetchDepartmentOptions, fetchOrganisationReport, fetchUserReport,
  fetchWaveReport, fetchDepartmentReport, type AccountUser, type GeneratedReport, } from './reports.service';
import { exportReportToPdf } from './reports-pdf';
import type { Period } from './analytics.service';

interface ReportsProps { onNavigate: (path: string) => void; activePath: string; }

type ReportType = GeneratedReport['type'];

const REPORT_TYPE_OPTIONS: { value: ReportType; label: string }[] = [
  { value: 'organisation', label: 'Organisation' },
  { value: 'user', label: 'User' },
  { value: 'wave', label: 'Wave' },
  { value: 'department', label: 'Department' },
];

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

const thStyle: CSSProperties = { padding: '8px 16px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'Inter, system-ui, sans-serif' };
const tdStyle: CSSProperties = { padding: '11px 16px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' };

function ReportTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--bg-hover)' }}>
            {head.map(h => <th key={h} style={thStyle}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td style={tdStyle} colSpan={head.length}><ComingSoon label="No rows to show." /></td></tr>
          ) : rows.map((row, i) => (
            // eslint-disable-next-line react-x/no-array-index-key -- rows have no stable identifier, order never changes after generation
            <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
              {row.map((cell, j) => (
                // eslint-disable-next-line react-x/no-array-index-key -- cells have no stable identifier, order never changes after generation
                <td key={j} style={tdStyle}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', padding: '14px 20px', borderBottom: '1px solid var(--border)', fontFamily: 'Inter, system-ui, sans-serif' }}>{children}</h2>;
}

function GeneratedReportView({ report }: { report: GeneratedReport }) {
  if (report.type === 'organisation') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
          <Card style={{ padding: '16px 18px' }}>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>Detection Rate</p>
            <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{report.summary.detectionRate}%</span>
          </Card>
          <Card style={{ padding: '16px 18px' }}>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>Total Simulations</p>
            <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{report.summary.totalSimulations.toLocaleString()}</span>
          </Card>
          <Card style={{ padding: '16px 18px' }}>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>Training Completion</p>
            <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{report.summary.trainingCompletionRate}%</span>
          </Card>
        </div>
        <Card>
          <SectionTitle>Activity Over Time</SectionTitle>
          <ReportTable
            head={['Date', 'Reports', 'Emails Sent', 'XP Given']}
            rows={report.series.map(p => [new Date(p.date).toLocaleDateString('en-ZA'), String(p.reports), String(p.emailsSent), String(p.xpGiven)])}
          />
        </Card>
        <Card>
          <SectionTitle>Top Reporters</SectionTitle>
          <ReportTable
            head={['Rank', 'Email', 'Confirmed Reports', 'Total XP']}
            rows={report.leaderboard.map((u, i) => [String(i + 1), u.email, String(u.reportCount), String(u.totalXp)])}
          />
        </Card>
      </div>
    );
  }

  if (report.type === 'user') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card>
          <SectionTitle>{report.user.name}</SectionTitle>
          <ReportTable
            head={['Field', 'Value']}
            rows={[
              ['Email', report.user.email],
              ['Department', report.user.department ?? '—'],
              ['Role', report.user.role],
            ]}
          />
        </Card>
        <Card>
          <SectionTitle>Statistics</SectionTitle>
          <ReportTable
            head={['Metric', 'Value']}
            rows={[
              ['Reports submitted', String(report.stats.reports)],
              ['Confirmed phishing', String(report.stats.confirmed)],
              ['False positives', String(report.stats.falsePositive)],
              ['Total XP', String(report.stats.totalXp)],
              ['Education completed', String(report.stats.educationCompleted)],
              ['Security score', String(report.stats.securityScore)],
            ]}
          />
        </Card>
      </div>
    );
  }

  if (report.type === 'wave') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card>
          <SectionTitle>{report.wave.waveName}</SectionTitle>
          <ReportTable
            head={['Field', 'Value']}
            rows={[
              ['Scheduled from', new Date(report.wave.scheduledFrom).toLocaleString('en-ZA')],
              ['Scheduled to', new Date(report.wave.scheduledTo).toLocaleString('en-ZA')],
              ['Recipients', String(report.recipients.length)],
            ]}
          />
        </Card>
        <Card>
          <SectionTitle>Recipients</SectionTitle>
          <ReportTable
            head={['Name', 'Email', 'Department', 'Scheduled At', 'Engagement']}
            rows={report.recipients.map(r => [
              r.name, r.email, r.department ?? '—', new Date(r.scheduledAt).toLocaleString('en-ZA'),
              <Badge key={r.referenceNumber} variant="neutral">Pending</Badge>,
            ])}
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <SectionTitle>{report.department} — Employees ({report.employees.length})</SectionTitle>
        <ReportTable
          head={['Name', 'Email', 'Role']}
          rows={report.employees.map(e => [e.name, e.email, e.role])}
        />
      </Card>
      <Card style={{ padding: '20px 22px' }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'Inter, system-ui, sans-serif' }}>Department Statistics</h2>
        <ComingSoon label="Department-level engagement stats aren't available yet: analytics-service doesn't capture department data on events." />
      </Card>
    </div>
  );
}

export function Reports({ onNavigate, activePath }: ReportsProps) {
  const { addToast } = useToast();
  const [reportType, setReportType] = useState<ReportType>('organisation');
  const [period, setPeriod] = useState<Period>('30d');

  const [users, setUsers] = useState<AccountUser[] | null>(null);
  const [waves, setWaves] = useState<Wave[] | null>(null);
  const [departments, setDepartments] = useState<string[] | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedWaveId, setSelectedWaveId] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<GeneratedReport | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadOptions = async (): Promise<void> => {
      setLoadingOptions(true);
      try {
        if (reportType === 'user' && !users) {
          const data = await fetchAllUsers();
          if (!cancelled) setUsers(data);
        } else if (reportType === 'wave' && !waves) {
          const data = await getWaves();
          if (!cancelled) setWaves(data);
        } else if (reportType === 'department' && !departments) {
          const data = await fetchDepartmentOptions();
          if (!cancelled) setDepartments(data);
        }
      } catch {
        if (!cancelled) addToast({ type: 'error', title: 'Could not load options', message: 'Please try again.' });
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    };

    void loadOptions();
    return () => { cancelled = true; };
  }, [reportType, users, waves, departments, addToast]);

  const handleGenerate = async (): Promise<void> => {
    setGenerating(true);
    try {
      const generated = await (
        reportType === 'organisation' ? fetchOrganisationReport(period)
        : reportType === 'user' ? fetchUserReport(selectedUserId)
        : reportType === 'wave' ? fetchWaveReport(selectedWaveId)
        : fetchDepartmentReport(selectedDepartment)
      );
      setReport(generated);
    } catch (err) {
      addToast({ type: 'error', title: 'Could not generate report', message: err instanceof Error ? err.message : 'Please try again.' });
    } finally {
      setGenerating(false);
    }
  };

  const canGenerate =
    reportType === 'organisation' ? true
    : reportType === 'user' ? !!selectedUserId
    : reportType === 'wave' ? !!selectedWaveId
    : !!selectedDepartment;

  return (
    <AppLayout activePath={activePath} onNavigate={onNavigate} title="Reports"
      subtitle="Generate reports and export them to PDF">

      <Card style={{ padding: '18px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ minWidth: 180 }}>
            <Select
              label="Report type"
              value={reportType}
              onChange={e => setReportType(e.target.value as ReportType)}
              options={REPORT_TYPE_OPTIONS}
            />
          </div>

          {reportType === 'organisation' && (
            <div style={{ minWidth: 180 }}>
              <Select label="Period" value={period} onChange={e => setPeriod(e.target.value as Period)} options={PERIOD_OPTIONS} />
            </div>
          )}

          {reportType === 'user' && (
            <div style={{ minWidth: 240 }}>
              <Select
                label="User"
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                options={[{ value: '', label: loadingOptions ? 'Loading users…' : 'Select a user' },
                  ...(users ?? []).map(u => ({ value: u.id, label: `${u.name} (${u.email})` }))]}
              />
            </div>
          )}

          {reportType === 'wave' && (
            <div style={{ minWidth: 240 }}>
              <Select
                label="Wave"
                value={selectedWaveId}
                onChange={e => setSelectedWaveId(e.target.value)}
                options={[{ value: '', label: loadingOptions ? 'Loading waves…' : 'Select a wave' },
                  ...(waves ?? []).map(w => ({ value: w.id, label: w.waveName }))]}
              />
            </div>
          )}

          {reportType === 'department' && (
            <div style={{ minWidth: 220 }}>
              <Select
                label="Department"
                value={selectedDepartment}
                onChange={e => setSelectedDepartment(e.target.value)}
                options={[{ value: '', label: loadingOptions ? 'Loading departments…' : 'Select a department' },
                  ...(departments ?? []).map(d => ({ value: d, label: d }))]}
              />
            </div>
          )}

          <Button onClick={() => void handleGenerate()} disabled={!canGenerate || generating} loading={generating}>
            Generate Report
          </Button>

          <Button
            variant="ghost"
            style={{ border: '1px solid var(--border)' }}
            disabled={!report}
            onClick={() => { if (report) exportReportToPdf(report); }}
          >
            Download PDF
          </Button>
        </div>
      </Card>

      {generating && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spinner size={28} />
        </div>
      )}

      {!generating && report && <GeneratedReportView report={report} />}

      {!generating && !report && (
        <Card style={{ padding: '20px 22px' }}>
          <ComingSoon label="Choose a report type above and click Generate Report to view its statistics here." />
        </Card>
      )}
    </AppLayout>
  );
}