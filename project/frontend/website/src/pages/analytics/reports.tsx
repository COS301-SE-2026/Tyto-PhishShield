import { AppLayout } from '../../components/layout/app-layout';
import { Card, Button, Badge } from '../../components/ui';
import { useToast } from '../../context/toast-context';

interface ReportsProps { onNavigate: (path: string) => void; activePath: string; }

const REPORTS = [
  { title: 'Monthly Security Summary — April 2025', generated: '2025-05-01', type: 'Monthly', size: '248 KB' },
  { title: 'Wave Report — CEO Wire Transfer', generated: '2025-04-30', type: 'Wave', size: '112 KB' },
  { title: 'Department Risk Assessment — Q1 2025', generated: '2025-04-01', type: 'Risk', size: '380 KB' },
  { title: 'Training Completion Report — Q1 2025', generated: '2025-04-01', type: 'Training', size: '195 KB' },
];

export function Reports({ onNavigate, activePath }: ReportsProps) {
  const { addToast } = useToast();

  return (
    <AppLayout activePath={activePath} onNavigate={onNavigate} title="Reports"
      subtitle="Download and schedule security reports" securityScore={72}>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button onClick={() => addToast({ type: 'info', title: 'Report generation', message: 'Custom report builder coming in Demo 2.' })} icon={
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        }>
          Generate Report
        </Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {REPORTS.map((r, i) => (
          <Card key={i} style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, fontFamily: 'Inter, system-ui, sans-serif' }}>{r.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Generated {new Date(r.generated).toLocaleDateString('en-ZA')} &nbsp;·&nbsp; {r.size}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                <Badge variant="neutral">{r.type}</Badge>
                <Button size="sm" variant="ghost" style={{ border: '1px solid var(--border)' }}
                  onClick={() => addToast({ type: 'info', title: 'Download', message: `Downloading ${r.title}…` })}>
                  Download PDF
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
