import { useState } from 'react';
import { AppLayout } from '../../components/layout/app-layout';
import { Card, Button, Input } from '../../components/ui';
import { useToast } from '../../context/toast-context';
import { sendEmail } from '../../services/send-email';

interface SendEmailTestProps {
  onNavigate: (path: string) => void;
  activePath: string;
}

export function SendEmailTest({ onNavigate, activePath }: SendEmailTestProps) {
  const { addToast } = useToast();
  const [referenceNumber, setReferenceNumber] = useState('PHISH-1FA3FB56');
  const [recipient, setRecipient] = useState('FiveGuys301@outlook.com')
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    try {
      setLoading(true);

      const result = await sendEmail(referenceNumber.trim(), recipient.trim() || undefined); //if it is undefined it will use the default 'FiveGuys301@outlook.com'

      addToast({
        type: 'success',
        title: 'Email sent',
        message: result.message ?? 'Email sent successfully.',
        });
    } catch (error) {
      console.error(error);

      addToast({
        type: 'error',
        title: 'Send failed',
        message: 'Could not send email. Check reference number, auth, CORS, and backend logs.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout
      activePath={activePath}
      onNavigate={onNavigate}
      title="Send Email Test"
      subtitle="Test frontend to API gateway email sending"
      securityScore={72}
    >
      <Card style={{ padding: 24, maxWidth: 520 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Reference number"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="PHISH-1FA3FB56-001"
          />

          <Input
            label="Recipient email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="FiveGuys301@outlook.com"
          />

          <Button
            loading={loading}
            disabled={!referenceNumber.trim()}
            onClick={() => {
              void handleSend();
            }}
          >
            Send Test Email
          </Button>
        </div>
      </Card>
    </AppLayout>
  );
}
