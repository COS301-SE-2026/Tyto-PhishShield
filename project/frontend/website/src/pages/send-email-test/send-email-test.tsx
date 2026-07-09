import { useState } from 'react';
import { AppLayout } from '../../components/layout/app-layout';
import { Card, Button, Input } from '../../components/ui';
import { useToast } from '../../context/toast-context';
import { sendEmail, scheduleEmail } from '../../services/send-email';
import { sendBatchWithReference, sendBatchRandomSameEmail, type EmailDifficulty, sendBatchRandomDifferentEmail} from '../../services/send-batch-email';

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
  const [batchRecipients, setBatchRecipients] = useState('delivered@resend.dev');
  const [batchLoading, setBatchLoading] = useState(false);
  const [randomBatchLoading, setRandomBatchLoading] = useState(false);
  const [difficulty, setDifficulty] = useState<EmailDifficulty>('medium');
  const [scheduledFrom, setScheduledFrom] = useState('');
  const [scheduledTo, setScheduledTo] = useState('');
  const [randomisedTimes, setRandomisedTimes] = useState(true);
  const [differentBatchLoading, setDifferentBatchLoading] = useState(false);

  const parseBatchRecipients = () =>
    batchRecipients
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean);

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

  const handleBatchWithReference = async () => {
    try {
      setBatchLoading(true);

      const result = await sendBatchWithReference(referenceNumber.trim(), parseBatchRecipients(),);

      addToast({
          type: 'success',
          title: 'Batch sent',
          message: result.message ?? 'Batch email sent successfully.',
      });
    }catch (error) {
      console.error(error);

      addToast({
          type: 'error',
          title: 'Batch Failed',
          message: 'Could not send batch email. check recipient, reference num, auth and logs',
      });
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchRandomSameEmail = async () => {
    try {
      setRandomBatchLoading(true);

      const result = await sendBatchRandomSameEmail(
        parseBatchRecipients(),
        difficulty,
        new Date(scheduledFrom).toISOString(),
        new Date(scheduledTo).toISOString(),
        randomisedTimes,
      );

      addToast({
          type: 'success',
          title: 'Random batch scheduled',
          message: result.message ?? 'Random times same email batch scheduled successfully.',
      });
    }catch (error) {
      console.error(error);

      addToast({
          type: 'error',
          title: 'Random batch Failed',
          message: 'Could not send random times same email batch. check recipient, difficulty, dates, auth and logs',
      });
    } finally {
      setRandomBatchLoading(false);
    }
  };

  const handleBatchRandomDifferentEmail = async () => {
    try {
      setDifferentBatchLoading(true);

      const result = await sendBatchRandomDifferentEmail(
        parseBatchRecipients(),
        difficulty,
        new Date(scheduledFrom).toISOString(),
        new Date(scheduledTo).toISOString(),
        randomisedTimes,
      );

      addToast({
          type: 'success',
          title: 'Different email random batch scheduled',
          message: result.message ?? 'Random times different email batch scheduled successfully.',
      });
    }catch (error) {
      console.error(error);

      addToast({
          type: 'error',
          title: 'Different email random batch Failed',
          message: 'Could not send random times different email batch. check recipient, difficulty, dates, auth and logs',
      });
    } finally {
      setDifferentBatchLoading(false);
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

      <Card style={{ padding: 24, maxWidth: 520 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Reference number"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="PHISH-1FA3FB56"
          />

          <Input
            label="Batch recipients"
            value={batchRecipients}
            onChange={(e) => setBatchRecipients(e.target.value)}
            placeholder="delivered@resend.dev, Another@example.com"
          />

          <Button
            loading={batchLoading}
            disabled={!referenceNumber.trim() || parseBatchRecipients().length === 0}
            onClick={() => {
              void handleBatchWithReference();
            }}
          >
            Send Batch with Reference
          </Button>
        </div>
      </Card>

      <Card style={{ padding: 24, maxWidth: 520 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Batch recipients"
            value={batchRecipients}
            onChange={(e) => setBatchRecipients(e.target.value)}
            placeholder="delivered@resend.dev"
          />

          <Input
            label="Difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as EmailDifficulty)}
            placeholder="easy, medium or hard"
          />

          <Input
            label="Scheduled from"
            type='datetime-local'
            value={scheduledFrom}
            onChange={(e) => setScheduledFrom(e.target.value)}
          />

          <Input
            label="Scheduled to"
            type='datetime-local'
            value={scheduledTo}
            onChange={(e) => setScheduledTo(e.target.value)}
          />

          <label >
            <input 
              type="checkbox"
              checked={randomisedTimes}
              onChange={(e) => setRandomisedTimes(e.target.checked)} />
              {' '}Randomised times
          </label>

          <Button
            loading={randomBatchLoading}
            disabled={parseBatchRecipients().length === 0 || !difficulty || !scheduledFrom || !scheduledTo}
            onClick={() => {
              void handleBatchRandomSameEmail();
            }}
          >
            Send Batch Random Times Same Email
          </Button>
        </div>
      </Card>

      <Card style={{ padding: 24, maxWidth: 520 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Batch recipients"
            value={batchRecipients}
            onChange={(e) => setBatchRecipients(e.target.value)}
            placeholder="delivered@resend.dev"
          />

          <Input
            label="Difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as EmailDifficulty)}
            placeholder="easy, medium or hard"
          />

          <Input
            label="Scheduled from"
            type='datetime-local'
            value={scheduledFrom}
            onChange={(e) => setScheduledFrom(e.target.value)}
          />

          <Input
            label="Scheduled to"
            type='datetime-local'
            value={scheduledTo}
            onChange={(e) => setScheduledTo(e.target.value)}
          />

          <label >
            <input 
              type="checkbox"
              checked={randomisedTimes}
              onChange={(e) => setRandomisedTimes(e.target.checked)} />
              {' '}Randomised times
          </label>

          <Button
            loading={differentBatchLoading}
            disabled={parseBatchRecipients().length === 0 || !difficulty || !scheduledFrom || !scheduledTo}
            onClick={() => {
              void handleBatchRandomDifferentEmail();
            }}
          >
            Send Batch Random Times Different Emails
          </Button>
        </div>
      </Card>
    </AppLayout>
  );
}
