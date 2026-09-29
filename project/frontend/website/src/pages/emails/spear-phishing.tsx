import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { AppLayout } from '../../components/layout/app-layout';
import { Button, Card, Input, Select, Badge } from '../../components/ui';
import { useToast } from '../../context/toast-context';
import { getUsers, type User } from '../../services/user';
import { getSenderRecommendations, type SenderRecommendation } from '../../services/sender-recommendations';
import { generateSpearPhishing } from '../../services/spear-phishing';
import type { Department, MessageType } from '../../services/llm-template';

interface SpearPhishingProps {
  readonly onNavigate: (path: string) => void;
  readonly activePath: string;
}

interface FormErrors {
  recipient?: string;
  sender?: string;
  scheduledFrom?: string;
  scheduledTo?: string;
}

const RECOMMENDATION_VARIANTS = {
    high: 'success',
    medium: 'warning',
    low: 'neutral',
} as const

const DEPARTMENTS: { value: Department; label: string }[] = [
  { value: 'it_&_security', label: 'IT & Security' },
  { value: 'finance', label: 'Finance' },
  { value: 'human_resources', label: 'Human Resources' },
  { value: 'legal_&_compliance', label: 'Legal & Compliance' },
  { value: 'operations', label: 'Operations' },
  { value: 'executive', label: 'Executive' },
];

const MESSAGE_TYPES: { value: MessageType; label: string }[] = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'it_security_alert', label: 'IT Security Alert' },
  { value: 'finance_voucher', label: 'Finance Voucher' },
  { value: 'document_request', label: 'Document Request' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'executive_request', label: 'Executive Request' },
  { value: 'meeting_invite', label: 'Meeting Invite' },
  { value: 'it_support', label: 'IT Support' },
  { value: 'question', label: 'Question' },
];

// The user service stores display names, whereas the LLM expects enum values.
function toLlmDepartment(value?: string | null): Department | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replace(/\s+/g, ' ');
  const aliases: Record<string, Department> = {
    'it & security': 'it_&_security',
    'it and security': 'it_&_security',
    'finance': 'finance',
    'hr': 'human_resources',
    'human resources': 'human_resources',
    'legal & compliance': 'legal_&_compliance',
    'legal and compliance': 'legal_&_compliance',
    'operations': 'operations',
    'executive': 'executive',
  };
  return DEPARTMENTS.find((item) => item.value === normalized)?.value ?? aliases[normalized] ?? null;
}

const headingStyle: CSSProperties = {
  fontSize: 15, fontWeight: 700, marginBottom: 8,
  color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif',
};
const radioLabelStyle: CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 4,
    color: 'var(--text-primary)',
    fontFamily: 'Inter, system-ui, sans-serif',
};
const textStyle: CSSProperties = {
  fontSize: 12, lineHeight: 1.5, color: 'var(--text-secondary)',
  fontFamily: 'Inter, system-ui, sans-serif',
};
const errorStyle: CSSProperties = {
  fontSize: 11, marginTop: 6, color: 'var(--color-danger)',
};
const panelStyle: CSSProperties = {
  padding: 12, border: '1px solid var(--border)', borderRadius: 8,
  background: 'var(--bg-hover)',
};

export function SpearPhishing({ onNavigate, activePath }: SpearPhishingProps) {
  const { addToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [recipientDepartment, setRecipientDepartment] = useState<Department | ''>('');
  const [departmentFilter, setDepartmentFilter] = useState<Department | ''>('');
  const [recommendations, setRecommendations] = useState<SenderRecommendation[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsLoaded, setRecommendationsLoaded] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState('');
  const [senderId, setSenderId] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('document_request');
  const [extraContext, setExtraContext] = useState('');
  const [scheduledFrom, setScheduledFrom] = useState('');
  const [scheduledTo, setScheduledTo] = useState('');
  const [sendImmediately, setSendImmediately] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const recommendationRequest = useRef(0);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const result = await getUsers();
      setUsers(result.filter((user) => user.isActive));
    } catch (error) {
      addToast({
        type: 'error', title: 'Could not load users',
        message: error instanceof Error ? error.message : 'Users could not be loaded.',
      });
    } finally {
      setUsersLoading(false);
    }
  }, [addToast]);

  useEffect(() => { void fetchUsers(); }, [fetchUsers]);

  const recipient = users.find((user) => user.auth0Id === recipientId);
  const sender = recommendations.find((item) => item.auth0Id === senderId);
  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    return users.filter((user) =>
      !query || user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) || user.auth0Id.toLowerCase().includes(query),
    );
  }, [users, userSearch]);

  const resetRecommendations = () => {
    recommendationRequest.current += 1;
    setRecommendations([]);
    setSenderId('');
    setRecommendationsLoaded(false);
    setRecommendationsError('');
    setRecommendationsLoading(false);
    setErrors((previous) => ({ ...previous, sender: undefined }));
  };

  const chooseRecipient = (id: string) => {
    setRecipientId(id);
    setRecipientDepartment(toLlmDepartment(users.find((user) => user.auth0Id === id)?.department) ?? '');
    setDepartmentFilter('');
    setErrors((previous) => ({ ...previous, recipient: undefined }));
    resetRecommendations();
  };

  const loadRecommendations = async () => {
    if (!recipientId) {
      setErrors((previous) => ({ ...previous, recipient: 'Select a recipient first.' }));
      return;
    }
    const requestId = ++recommendationRequest.current;
    setRecommendationsLoading(true);
    setRecommendationsLoaded(false);
    setRecommendationsError('');
    setRecommendations([]);
    setSenderId('');
    try {
      const result = await getSenderRecommendations(recipientId, departmentFilter || undefined);
      if (requestId !== recommendationRequest.current) return;
      setRecommendations(result.filter((item) => item.auth0Id !== recipientId));
      setRecommendationsLoaded(true);
    } catch (error) {
      if (requestId !== recommendationRequest.current) return;
      const message = error instanceof Error ? error.message : 'Could not retrieve recommendations.';
      setRecommendationsError(message);
      setRecommendationsLoaded(true);
      addToast({ type: 'error', title: 'Recommendations unavailable', message });
    } finally {
      if (requestId === recommendationRequest.current) setRecommendationsLoading(false);
    }
  };

  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!recipientId || !recipientDepartment) {
        next.recipient = 'Select a recipient with a valid department.';
    }

    if (!sender) {
        next.sender = 'Select a recommended sender.';
    }

    if (!sendImmediately){
        if (!scheduledFrom || !Number.isFinite(new Date(scheduledFrom).getTime())) {
            next.scheduledFrom = 'Enter a valid start date and time';
        } else if (new Date(scheduledFrom).getTime() <= Date.now()) {
            next.scheduledFrom = 'Start time must be in the future.';
        }

        if (!scheduledTo || !Number.isFinite(new Date(scheduledTo).getTime())) {
            next.scheduledTo = 'Enter a valid end date and time';
        } else if (scheduledFrom && new Date(scheduledTo).getTime() < new Date(scheduledFrom).getTime()) {
            next.scheduledTo = 'End time must be after start time.'
        }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
  if (!validate() || !sender || !recipientDepartment) return;

  const senderDepartment = toLlmDepartment(sender.department);

  if (!senderDepartment) {
    setErrors((previous) => ({
      ...previous,
      sender: 'The selected sender has an invalid department.',
    }));
    return;
  }

  setSubmitting(true);

    try {
      const response = await generateSpearPhishing({
        recipientAuth0Id: recipientId,
        senderAuth0Id: sender.auth0Id,
        recipientDepartment,
        senderDepartment,
        messageType,
        extraContext: extraContext.trim() || undefined,
        ...(!sendImmediately && {
            scheduledFrom: new Date(scheduledFrom).toISOString(),
            scheduledTo: new Date(scheduledTo).toISOString(),
        }),
        isManager: sender.isManager === true,
      });

      if (!response.accepted) throw new Error('The backend did not confirm acceptance.');
      addToast({
        type: 'success', 
        title: 'Generation request accepted',
        message: 'Your spear-phising simulation request has been submitted successfully.',
      });

      onNavigate('/emails')
    } catch (error) {
      addToast({
        type: 'error', 
        title: 'Request failed',
        message: error instanceof Error ? error.message : 'Could not submit the generation request.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout
      activePath={activePath}
      onNavigate={onNavigate}
      title="Spear Phishing"
      subtitle="Configure a targeted phishing-awareness simulation"
      breadcrumbs={[{ label: 'Emails', path: '/emails' }, { label: 'Spear Phishing' }]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 960, width: '100%' }}>
        <Card style={{ padding: 24 }}>
          <h2 style={headingStyle}>1. Select recipient</h2>
          <p style={{ ...textStyle, marginBottom: 16 }}>Choose one active company user for this simulation.</p>
          <Input
            label="Search users"
            placeholder="Search by name, email or Auth0 ID"
            value={userSearch}
            onChange={(event) => setUserSearch(event.target.value)}
            disabled={usersLoading || submitting}
          />
          <div style={{ ...panelStyle, maxHeight: 240, overflowY: 'auto', marginTop: 12 }}>
            {usersLoading ? <p style={textStyle}>Loading users...</p> : filteredUsers.length === 0 ? (
              <p style={textStyle}>No active users found.</p>
            ) : filteredUsers.map((user) => (
              <label key={user.auth0Id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 10, cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
                <input 
                    type="radio" 
                    name="spear-recipient"
                    aria-label= {`Select recipient ${user.name}`}
                    checked={recipientId === user.auth0Id} 
                    onChange={() => chooseRecipient(user.auth0Id)} 
                    disabled={submitting}
                />
                <span style={{ minWidth: 0 }}>
                  <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{user.name}</strong>
                  <span style={{ ...textStyle, display: 'block', overflowWrap: 'anywhere' }}>{user.email}{user.department ? ` - ${user.department}` : ''}</span>
                </span>
              </label>
            ))}
          </div>
          {recipient && <div style={{ marginTop: 16 }}>
            <p style={{ ...textStyle, marginBottom: 8 }}>Recipient department (required by the LLM)</p>
            <Select
              label="Recipient department"
              value={recipientDepartment}
              options={[{ value: '', label: 'Select department' }, ...DEPARTMENTS]}
              onChange={(event) => { setRecipientDepartment(event.target.value as Department | ''); setErrors((previous) => ({ ...previous, recipient: undefined })); }}
              disabled={submitting}
            />
          </div>}
          {errors.recipient && <p style={errorStyle}>{errors.recipient}</p>}
        </Card>

        <Card style={{ padding: 24 }}>
          <h2 style={headingStyle}>2. Select recommended sender</h2>
          <p style={{ ...textStyle, marginBottom: 16 }}>Recommendations use existing company relationships. Choose the sender for this recipient.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, alignItems: 'end' }}>
            <Select
              label="Filter sender department (optional)"
              value={departmentFilter}
              options={[{ value: '', label: 'All departments' }, ...DEPARTMENTS]}
              onChange={(event) => { setDepartmentFilter(event.target.value as Department | ''); resetRecommendations(); }}
              disabled={!recipientId || submitting}
            />
            <Button
              variant="ghost"
              loading={recommendationsLoading}
              disabled={!recipientId || recommendationsLoading || submitting}
              onClick={() => void loadRecommendations()}
            >
              {recommendationsLoaded ? 'Refresh recommendations' : 'Find recommended senders'}
            </Button>
          </div>
          {recommendationsError && <p style={{ ...errorStyle, marginTop: 12 }}>{recommendationsError}</p>}
          {recommendationsLoaded && !recommendationsError && recommendations.length === 0 && (
            <p style={{ ...textStyle, marginTop: 16 }}>No eligible senders were returned. Try another department filter.</p>
          )}
          {recommendations.length > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            {recommendations.map((candidate) => (
              <label key={candidate.auth0Id} style={{ ...panelStyle, display: 'flex', gap: 12, cursor: 'pointer', borderColor: senderId === candidate.auth0Id ? 'var(--color-primary)' : 'var(--border)' }}>
                <input
                  type="radio" 
                  name="spear-sender"
                  aria-label={`Select sender ${candidate.email}`}
                  checked={senderId === candidate.auth0Id}
                  onChange={() => { setSenderId(candidate.auth0Id); setErrors((previous) => ({ ...previous, sender: undefined })); }}
                  disabled={submitting}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: 13, color: 'var(--text-primary)', overflowWrap: 'anywhere' }}>{candidate.email}</strong>
                    <Badge variant={RECOMMENDATION_VARIANTS[candidate.recommendation]}>
                      {candidate.recommendation} - {candidate.score}
                    </Badge>
                  </div>
                    <p style={{ ...textStyle, marginTop:4}}>
                        {DEPARTMENTS.find((item) => item.value === toLlmDepartment(candidate.department))?.label ?? candidate.department}
                    </p>
                    {candidate.isManager && (
                        <div style={{ marginTop: 8}}>
                            <Badge variant="success">
                                Recipient's manager
                            </Badge>
                        </div>
                    )}
                    <p>
                        {candidate.reasons.join(' - ')}
                    </p>
                </div>
              </label>
            ))}
          </div>}
          {errors.sender && <p style={errorStyle}>{errors.sender}</p>}
        </Card>

        <Card style={{ padding: 24 }}>
          <h2 style={headingStyle}>3. Generation details</h2>
          <p style={{ ...textStyle, marginBottom: 16 }}>Set the message type and optional context for the training simulation.</p>
          <Select
            label="Message type"
            value={messageType}
            options={MESSAGE_TYPES}
            onChange={(event) => setMessageType(event.target.value as MessageType)}
            disabled={submitting}
          />
          <label htmlFor="spear-context" style={{ ...headingStyle, display: 'block', fontSize: 12, marginTop: 16 }}>Additional context (optional)</label>
          <textarea
            id="spear-context" value={extraContext}
            onChange={(event) => setExtraContext(event.target.value)}
            placeholder="Optional training scenario context"
            rows={5} disabled={submitting}
            style={{ width: '100%', boxSizing: 'border-box', padding: 12, border: '1px solid var(--border)', borderRadius: 8, resize: 'vertical', background: 'var(--bg-input)', color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12 }}
          />
          <p style={{ ...textStyle, marginTop: 6 }}>The backend may omit additional context if its classifier rejects it.</p>
        </Card>

        <Card style={{ padding: 24 }}>
          <h2 style={headingStyle}>4. Scheduling</h2>
          <p style={{ ...textStyle, marginBottom: 16 }}>Choose whether to send the simulation immediately or to schedule it.</p>
          
          <div
            style={{
                ...panelStyle,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
            }}
          >
            <label
                style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                }}
            >
                <input
                    type='radio'
                    name='delivery-mode'
                    aria-label='Send Immediately'
                    checked={sendImmediately}
                    onChange={() => {
                        setSendImmediately(true);
                        setErrors((previous) => ({
                            ...previous,
                            scheduledFrom: undefined,
                            scheduledTo: undefined,
                        }));
                    }}
                    disabled={submitting}
                />
                <span>
                    <strong style={radioLabelStyle}>
                        Send Immediately
                    </strong>

                    <span 
                        style={{
                            ...textStyle,
                            display: 'block'
                        }}
                    >
                        Generate the simulation and send it as soon as generation is complete.
                    </span>
                </span>
            </label>

            <label
                style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                }}
            >
                <input
                    type='radio'
                    name='delivery-mode'
                    aria-label='Schedule Delivery'
                    checked={!sendImmediately}
                    onChange={() => setSendImmediately(false)}
                    disabled={submitting}
                />
                <span>
                    <strong style={radioLabelStyle}>
                        Schedule Delivery
                    </strong>

                    <span 
                        style={{
                            ...textStyle,
                            display: 'block'
                        }}
                    >
                        Select a time window.
                    </span>
                </span>
            </label>
          </div>

          {!sendImmediately && (
            <>
                <div
                    style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 16,
                    marginTop: 24,
                    }}
                >
                    <div>
                    <label
                        htmlFor="spear-from"
                        style={{
                        ...headingStyle,
                        display: 'block',
                        fontSize: 12,
                        }}
                    >
                        Start date and time
                    </label>

                    <input
                        id="spear-from"
                        type="datetime-local"
                        value={scheduledFrom}
                        disabled={submitting}
                        onChange={(event) => {
                        setScheduledFrom(event.target.value);
                        setErrors((previous) => ({
                            ...previous,
                            scheduledFrom: undefined,
                            scheduledTo: undefined,
                        }));
                        }}
                        style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: 12,
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        background: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        }}
                    />

                    {errors.scheduledFrom && (
                        <p style={errorStyle}>
                        {errors.scheduledFrom}
                        </p>
                    )}
                    </div>

                    <div>
                    <label
                        htmlFor="spear-to"
                        style={{
                        ...headingStyle,
                        display: 'block',
                        fontSize: 12,
                        }}
                    >
                        End date and time
                    </label>

                    <input
                        id="spear-to"
                        type="datetime-local"
                        value={scheduledTo}
                        disabled={submitting}
                        onChange={(event) => {
                        setScheduledTo(event.target.value);
                        setErrors((previous) => ({
                            ...previous,
                            scheduledTo: undefined,
                        }));
                        }}
                        style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: 12,
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        background: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        }}
                    />

                    {errors.scheduledTo && (
                        <p style={errorStyle}>
                        {errors.scheduledTo}
                        </p>
                    )}
                    </div>
                </div>
                </>
          )}
        </Card>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <Button variant="ghost" disabled={submitting} onClick={() => onNavigate('/emails')}>Cancel</Button>
          <Button loading={submitting} disabled={submitting || usersLoading || recommendationsLoading}
            onClick={() => void handleSubmit()}>
            Submit generation request
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
