import { useState } from 'react';
import { AppLayout } from '../../components/layout/app-layout';
import { Card, Button, Input } from '../../components/ui';
import { useToast } from '../../context/toast-context';
import { sendEmail, scheduleEmail } from '../../services/send-email';

interface SendEmailTestProps {
  onNavigate: (path: string) => void;
  activePath: string;
}

export function SendEmailTest({ onNavigate, activePath }: SendEmailTestProps) {
  const { addToast } = useToast();
  const [referenceNumber, setReferenceNumber] = useState('PHISH-1FA3FB56');
  const [recipient, setRecipient] = useState('FiveGuys301@outlook.com')
  const [loading, setLoading] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleAt, setScheduleAt] = useState('');

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

  const handleSchedule = async () => {
    try {
      setScheduleLoading(true);

      const scheduleAtIso = new Date(scheduleAt).toISOString();

      const result = await scheduleEmail(referenceNumber.trim(), recipient.trim() || 'FiveGuys301@outlook.com', scheduleAtIso);

      addToast({
          type: 'success',
          title: 'Email scheduled',
          message: result.message ?? 'Email scheduled successfully.',
      });
    }catch (error) {
      console.error(error);

      addToast({
          type: 'error',
          title: 'Email schedule Failed',
          message: 'Could not schedule email. check recipient, scheduleAt date and logs',
      });
    } finally {
      setScheduleLoading(false);
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

          <Input
            label="Schedule date and time"
            type='datetime-local'
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
          />

          <Button
            loading={scheduleLoading}
            disabled={!referenceNumber.trim() || !scheduleAt}
            onClick={() => {
              void handleSchedule();
            }}
          >
            Schedule Test Email
          </Button>
        </div>
      </Card>
    </AppLayout>
  );
}
