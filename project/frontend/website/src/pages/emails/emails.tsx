import { AppLayout } from '../../components/layout/app-layout';
import { Card } from '../../components/ui';

interface EmailsProps {
  readonly onNavigate: (path: string) => void;
  readonly activePath: string;
}

export function Emails({ onNavigate, activePath }: EmailsProps) {
  return (
    <AppLayout activePath={activePath} onNavigate={onNavigate} title="Emails"
      subtitle="Create, send, and manage phishing simulation emails">
      <Card style={{ padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' }}>
          Email creation and sending is moving here from Phishing Waves. Coming soon!
        </p>
      </Card>
    </AppLayout>
  );
}
