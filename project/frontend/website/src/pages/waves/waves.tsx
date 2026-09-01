import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { AppLayout } from '../../components/layout/app-layout';
import { Card, Badge, Button } from '../../components/ui';
import { useAuth } from '../../context/auth-context';
import { useToast } from '../../context/toast-context';
import { getWave, getWaves, type Wave } from '../../services/wave';
import { getUsers, type User } from '../../services/user';
import { CalendarPlus } from 'lucide-react';

interface WavesProps {
  readonly onNavigate: (path: string) => void;
  readonly activePath: string;
}

type WaveStatus = 'active' | 'scheduled' | 'complete';

function getWaveStatus(wave:Wave): WaveStatus {
  const now = Date.now();
  const scheduledFrom = new Date(wave.scheduledFrom).getTime();
  const scheduledTo = new Date(wave.scheduledTo).getTime();

  if (now < scheduledFrom){
    return 'scheduled';
  }

  if (now <= scheduledTo){
    return 'active';
  }

  return 'complete'
}

const STATUS_BADGE: Record<WaveStatus, React.ReactNode> = {
  active: <Badge variant="success">Active</Badge>,
  scheduled: <Badge variant="warning">Scheduled</Badge>,
  complete: <Badge variant="primary">Complete</Badge>,
};

function formatDate(date: string): string {
  return new Date(date).toLocaleString('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function Waves({ onNavigate, activePath}: WavesProps) {
  const { hasRole } = useAuth();
  const { addToast } = useToast();

  const isAdmin = hasRole('admin');
  const [waves, setWaves] = useState<Wave[]>([]);
  const [filter, setFilter] = useState<WaveStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);

  const fetchWaves = useCallback(async () => {
    setLoading(true);

    try {
      const result = await getWaves();
      setWaves(result);
    } catch (error) {
      console.error(error);

      addToast({
        type: 'error',
        title: 'Could not load waves',
        message:
          error instanceof Error
            ? error.message
            : 'Phishing waves could not be loaded.',
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void fetchWaves();
  }, [fetchWaves]);

  const displayed = useMemo(
    () =>
      waves.filter((wave) => {
        if (filter === 'all') {
          return true;
        }

        return getWaveStatus(wave) === filter;
      }),
    [waves, filter]
  );

  const activeWaveCount = useMemo(
    () =>
      waves.filter((wave) => getWaveStatus(wave) === 'active',).length,
    [waves],
  );

  const tabs: (WaveStatus | 'all')[] = [
    'all',
    'active',
    'scheduled',
    'complete'
  ]

  return (
    <AppLayout
      activePath={activePath}
      onNavigate={onNavigate}
      title='Phishing Waves'
      subtitle={`${activeWaveCount} active phishing wave${activeWaveCount === 1 ? '' : 's'}`}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          gap: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-card)',
            borderRadius: 10,
            padding: 8,
            gap: 4,
            border: '1px solid var(--border)'
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              style={{
                padding: 8,
                borderRadius: 7,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'Inter, system-ui, sans-serif',
                background: filter === tab ? 'var(--color-primary)' : 'transparent',
                color: filter === tab ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.1s',
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {isAdmin && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8
            }}
          >
            <Button
              onClick={() => onNavigate('/waves/schedule')}
              icon={
                <CalendarPlus
                  size={12}
                  aria-hidden='true'
                />
              }
              style={{ minWidth: 72}}
            >
              Schedule Wave
            </Button>
          </div>
        )}  
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: 48,
              fontSize: 13,
              color: 'var(--text-muted)'
            }}
          >
            Loading Phishing waves...
          </div>
        ) : (
          displayed.map((wave) => {
            const status = getWaveStatus(wave);

            return (
              <Card
                key={wave.id}
                style={{
                  padding: 20,
                  cursor: 'pointer',
                  transition: 'box-shadow 0.1s',
                }}
                onClick={() => onNavigate(`/waves/${wave.id}`)}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 8
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      minWidth: 240,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 8
                      }}
                    >
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: 'var(--color-primary)',
                          fontFamily: 'Inter, system-ui, sans-serif',
                        }}
                      >
                        {wave.waveName}
                      </span>
                      {STATUS_BADGE[status]}
                    </div>

                    <p
                      style={{
                        fontSize: 12,
                        marginBottom: 8,
                        color: 'var(--text-secondary)',
                        fontFamily: 'Inter, system-ui, sans-serif'
                      }}
                    >
                      {wave.sameEmail ? 'Same email for recipients' : 'Different emails for recipients'}
                      {' · '}
                      {wave.randomisedTimes ? 'Randomised delivery times' : 'Fixed delivery times'}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        fontFamily: 'Inter, system-ui, sans-serif',
                      }}
                    >
                      Scheduled From {formatDate(wave.scheduledFrom)}
                      <span style={{marginLeft: 12}}>-</span>
                      Scheduled To {formatDate(wave.scheduledTo)}
                    </p>
                  </div>

                  <div
                    style={{
                      textAlign: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color:'var(--text-primary)',
                        fontFamily: 'Inter, system-ui, sans-serif'
                      }}
                    >
                      {wave.recipients.length}
                    </div>

                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--text-muted)',
                        fontFamily: 'Inter, system-ui, sans-serif'
                      }}
                    >
                      Recipients
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}

        {!loading && displayed.length ===0 && (
          <div
            style={{
              textAlign: 'center',
              padding: 48,
              fontSize: 13,
              color: 'var(--text-muted)',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}
          >
            No Phishing Waves found for this filter
          </div>
        )}
      </div>
    </AppLayout>
  );
}

interface WaveDetailProps {
  readonly onNavigate: (path: string) => void;
  readonly activePath: string;
  readonly waveId: string;
}

export function WaveDetail({onNavigate, activePath, waveId}: WaveDetailProps){
  const { addToast } = useToast();

  const [wave, setWave] = useState<Wave | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  const fetchWave = useCallback(async () => {
    setLoading(true);

    try {
      const [waveResult, userResult] = await Promise.all([//can use promise all. two requests do not depend on each other
        getWave(waveId),
        getUsers(),
      ]);
      setWave(waveResult);
      setUsers(userResult);
    } catch (error) {
      console.error(error);
      addToast({
        type: 'error',
        title: 'Could not load wave',
        message: error instanceof Error ?error.message : 'The Phishing wave could not be loaded',
      });
    } finally {
      setLoading(false);
    }
  }, [waveId, addToast]);

  useEffect(() => {
    void fetchWave();
  }, [fetchWave]);

  if (loading) {
    return (
      <AppLayout
        activePath={activePath}
        onNavigate={onNavigate}
        title="Phishing Wave"
      >
        <div
          style={{
            textAlign: 'center',
            padding: 48,
            color: 'var(--text-muted)'
          }}
        >
          Loading Wave...
        </div>
      </AppLayout>
    );
  }

  if (!wave){
    return (
      <AppLayout
        activePath={activePath}
        onNavigate={onNavigate}
        title="Phishing Wave"
      >

        <Card style={{ padding: 24 }}>
          Could not find wave.
        </Card>
      </AppLayout>
    );
  }

  const status = getWaveStatus(wave);

  return (
    <AppLayout
      activePath={activePath}
      onNavigate={onNavigate}
      title={wave.waveName}
      breadcrumbs={[
        {
          label: 'Phishing Waves',
          path: '/waves',
        },
        {
          label: wave.waveName,
        },
      ]}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 24
        }}
      >

        {STATUS_BADGE[status]}

        <span
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          {formatDate(wave.scheduledFrom)}
          <span>--</span>
          {formatDate(wave.scheduledTo)}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Card style={{ padding: 16 }}>
          <p
            style={{
              fontSize: 11,
              marginBottom: 8,
              color: 'var(--text-secondary)',
            }}
          >
            Recipients
          </p>

          <p
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: 'var(--text-primary)',
            }}
          >
            {wave.recipients.length}
          </p>
        </Card>

        <Card style={{ padding: 16 }}>
          <p
            style={{
              fontSize: 11,
              marginBottom: 12,
              color: 'var(--text-secondary)',
            }}
          >
            Distribution Method
          </p>

          <p
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            {wave.sameEmail ? 'Same Email' : 'Different Emails'}
          </p>
        </Card>

        <Card style={{ padding: 16}}>
          <p
            style={{
              fontSize: 11,
              marginBottom: 12,
              color: 'var(--text-secondary)',
            }}
          >
            Delivery Times
          </p>

          <p
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            {wave.randomisedTimes ? 'Randomised' : 'Fixed'}
          </p>
        </Card>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div
          style={{
            padding: 16,
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h3
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            Recipients
          </h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr
                style={{
                  background: 'var(--bg-hover)',
                }}
              >
                {[
                  'EMAIL',
                  'REFERENCE',
                  'SCHEDULED AT'
                ].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      padding: '8px 16px',
                      fontSize: 10,
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      textAlign: 'left',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {wave.recipients.map((recipient) => (
                <tr
                  key={`${recipient.auth0Id}-${recipient.emailId}`}
                  style={{
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  <td
                    style={{
                      padding: 16,
                      fontSize: 12,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {users.find((user) => user.auth0Id === recipient.auth0Id)?.email ?? recipient.auth0Id}
                  </td>

                  <td
                    style={{
                      padding: 16,
                      fontSize: 12,
                      color: 'var(--color-primary)',
                    }}
                  >
                    {recipient.referenceNumber}
                  </td>

                  <td
                    style={{
                      padding: 16,
                      fontSize: 12,
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {formatDate(recipient.scheduledAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppLayout>
  );
}