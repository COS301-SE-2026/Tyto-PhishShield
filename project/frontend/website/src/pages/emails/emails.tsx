import { AppLayout } from '../../components/layout/app-layout';
import { Card } from '../../components/ui';

interface EmailsProps {
  onNavigate: (path: string) => void;
  activePath: string;
}

export function Emails({ onNavigate, activePath }: EmailsProps) {
  return (
    <AppLayout activePath={activePath} onNavigate={onNavigate} title="Emails"
      subtitle="Create, send, and manage phishing simulation emails"
      securityScore={72}>
      <Card style={{ padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' }}>
          Email creation and sending is moving here from Phishing Waves. Coming soon!
        </p>
      </Card>
    </AppLayout>
  );
}
