import { AppLayout } from '../../components/layout/app-layout';
import { Button, Card } from '../../components/ui';

interface GenerateEmailProps {
  readonly onNavigate: (path: string) => void;
  readonly activePath: string;
}

export function GenerateEmail({
  onNavigate,
  activePath,
}: GenerateEmailProps) {
  return (
    <AppLayout
      activePath={activePath}
      onNavigate={onNavigate}
      title="Generate Email Template"
      subtitle="Generate phishing email templates using AI"
      breadcrumbs={[
        {
          label: 'Emails',
          path: '/emails',
        },
        {
          label: 'Generate Template',
        },
      ]}
    >
      <Card
        style={{
          maxWidth: 700,
          padding: '48px 24px',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            marginBottom: 8,
            fontSize: 17,
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          LLM Email Generation Coming Soon
        </h2>

        <p
          style={{
            marginBottom: 20,
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          AI-assisted phishing email template generation is coming soon.
        </p>

        <Button
          variant="ghost"
          onClick={() => onNavigate('/emails')}
        >
          Back to Emails
        </Button>
      </Card>
    </AppLayout>
  );
}