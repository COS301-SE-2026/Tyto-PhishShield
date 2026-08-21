import { AppLayout } from '../../components/layout/app-layout';
import { Card, Button } from '../../components/ui';

interface EmailsProps {
  readonly onNavigate: (path: string) => void;
  readonly activePath: string;
}

interface EmailActionCardProps {
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
}

function EmailActionCard({
  title,
  description,
  buttonLabel,
  onClick,
}: EmailActionCardProps) {
  return(
    <Card
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: 24,
        gap: 12,
        minHeight:240,
      }}
    >
      <div style={{flex:1}}>
        <h2
          style={{
            marginBottom: 8,
            fontSize:16,
            fontWeight: 700,
            color: 'var(--text-primary)',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}
        >
          {title}
        </h2>

        <p
          style={{
            fontSize:13,
            lineHeight: 1.5,
            color: 'var(--text-secondary)',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}
        >
          {description}
        </p>
      </div>

      <Button
        onClick={onClick}
        style={{ alignSelf: 'flex-start'}}
      >
        {buttonLabel}
      </Button>
    </Card>
  )
}

export function Emails({ onNavigate, activePath }: EmailsProps) {
  return (
    <AppLayout activePath={activePath} onNavigate={onNavigate} title="Emails"
      subtitle="Create, send, and manage phishing simulation emails"
      securityScore={72}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr)',
          gap: 16,
        }}
      >
        <EmailActionCard
          title='Manage Email Templates'
          description='Create new phishing email templates, or edit and delete existing templates.'
          buttonLabel='Manage Templates'
          onClick={() => onNavigate('/emails/templates')}
        />

        <EmailActionCard
          title='Generate Email Templates'
          description='Generate new phishing email templates using the LLM.'
          buttonLabel='Generate Templates'
          onClick={() => onNavigate('/emails/generate')}
        />

        <EmailActionCard
          title='Send Existing Email'
          description='Select an existing email template and send it to specific users.'
          buttonLabel='Send Email'
          onClick={() => onNavigate('/waves/send-email')}
        />

        <EmailActionCard
          title='Schedule a Phishing Wave'
          description='Schedule phishing emails for multiple recipients over a selected period.'
          buttonLabel='Schedule Wave'
          onClick={() => onNavigate('/waves/schedule')}
        />
      </div>  
    </AppLayout>
  );
}
