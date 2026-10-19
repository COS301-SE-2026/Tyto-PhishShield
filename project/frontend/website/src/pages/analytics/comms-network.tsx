import { useEffect, useState } from 'react';
import { Badge, Spinner } from '../../components/ui';
import { fetchCommsMessages, type CommsGraph, type CommsEdge, type CommsMessage } from '../../services/comms';
import type { Period } from './analytics.service';

const ACTIVITY_STEPS = ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#1c5cab', '#0d366b'];
const SELECTED_COLOR = '#2a78d6';

function activityFill(ratio: number): string {
  const index = Math.min(ACTIVITY_STEPS.length - 1, Math.floor(ratio * ACTIVITY_STEPS.length));
  return ACTIVITY_STEPS[index];
}

function shortLabel(label: string): string {
  const name = label.split('@')[0];
  return name.length > 18 ? `${name.slice(0, 17)}…` : name;
}

function truncateText(text: string, max = 60): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

const SOURCE_LABEL: Record<CommsMessage['source'], string> = {
  slack: 'Slack',
  teams: 'Teams',
  email: 'Email',
};

const EDGE_COLOR = '#898781';
const SIZE = 400;
const CENTER = SIZE / 2;
const NODE_RADIUS = 130;
const LABEL_RADIUS = NODE_RADIUS + 16;

interface SelectedEdge {
  source: string;
  target: string;
  sourceLabel: string;
  targetLabel: string;
}

export function CommsNetworkGraph({ graph, period }: { readonly graph: CommsGraph; readonly period: Period }) {
  const { nodes, edges } = graph;
  const [selected, setSelected] = useState<SelectedEdge | null>(null);
  const [messages, setMessages] = useState<CommsMessage[] | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesFailed, setMessagesFailed] = useState(false);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    const loadMessages = async (): Promise<void> => {
      setMessagesLoading(true);
      setMessagesFailed(false);
      try {
        const result = await fetchCommsMessages(selected.source, selected.target, period);
        if (!cancelled) setMessages(result);
      } catch {
        if (!cancelled) { setMessages(null); setMessagesFailed(true); }
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    };
    void loadMessages();
    return () => { cancelled = true; };
  }, [selected, period]);

  const angleStep = nodes.length > 0 ? (2 * Math.PI) / nodes.length : 0;
  const positions = new Map(nodes.map((n, i) => {
    const angle = i * angleStep - Math.PI / 2;
    return [n.id, { angle, x: CENTER + NODE_RADIUS * Math.cos(angle), y: CENTER + NODE_RADIUS * Math.sin(angle) }];
  }));

  const maxWeight = Math.max(1, ...edges.map(e => e.weight));
  const activity = new Map<string, number>();
  for (const e of edges) {
    activity.set(e.source, (activity.get(e.source) ?? 0) + e.weight);
    activity.set(e.target, (activity.get(e.target) ?? 0) + e.weight);
  }
  const maxActivity = Math.max(1, ...activity.values());
  const labelOf = (id: string) => nodes.find(n => n.id === id)?.label ?? id;

  function selectEdge(e: CommsEdge): void {
    setSelected({ source: e.source, target: e.target, sourceLabel: labelOf(e.source), targetLabel: labelOf(e.target) });
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'stretch' }}>
      <div style={{ flex: '1 1 340px', minWidth: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ width: '100%', maxWidth: 400, height: 'auto' }}>
          {edges.map(e => {
            const from = positions.get(e.source);
            const to = positions.get(e.target);
            if (!from || !to) return null;
            const ratio = e.weight / maxWeight;
            const isSelected = selected?.source === e.source && selected?.target === e.target;
            return (
              <g key={`${e.source}-${e.target}`}>
                <line
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={isSelected ? SELECTED_COLOR : EDGE_COLOR}
                  strokeOpacity={isSelected ? 0.95 : 0.2 + ratio * 0.5}
                  strokeWidth={isSelected ? 3 + ratio * 3 : 1 + ratio * 3}
                  strokeLinecap="round"
                />
                {/* Wide, invisible hit-area — the visible line is often too thin to click reliably */}
                <line
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke="transparent" strokeWidth={14} strokeLinecap="round"
                  style={{ cursor: 'pointer' }}
                  onClick={() => selectEdge(e)}
                >
                  <title>{`${e.weight} message${e.weight === 1 ? '' : 's'} · click for details`}</title>
                </line>
              </g>
            );
          })}
          {nodes.map(n => {
            const pos = positions.get(n.id);
            if (!pos) return null;
            const lx = CENTER + LABEL_RADIUS * Math.cos(pos.angle);
            const ly = CENTER + LABEL_RADIUS * Math.sin(pos.angle);
            const cos = Math.cos(pos.angle);
            const anchor = cos > 0.15 ? 'start' : cos < -0.15 ? 'end' : 'middle';
            const nodeActivity = activity.get(n.id) ?? 0;
            return (
              <g key={n.id}>
                <circle cx={pos.x} cy={pos.y} r={7} fill={activityFill(nodeActivity / maxActivity)} stroke="var(--bg-card)" strokeWidth={2}>
                  <title>{`${n.label}${n.department ? ` · ${n.department}` : ''} · ${nodeActivity} messages`}</title>
                </circle>
                <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle"
                  fontSize={9} fill="var(--text-secondary)" fontFamily="Inter, system-ui, sans-serif">
                  {shortLabel(n.label)}
                </text>
              </g>
            );
          })}
        </svg>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>Less active</span>
          <div style={{ display: 'flex', gap: 2 }}>
            {ACTIVITY_STEPS.map(hex => (
              <span key={hex} style={{ width: 14, height: 8, background: hex, display: 'inline-block' }} />
            ))}
          </div>
          <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>More active</span>
        </div>
      </div>

      <div style={{ flex: '1 1 280px', minWidth: 260, borderLeft: '1px solid var(--border)', paddingLeft: 20 }}>
        {!selected ? (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>
            Click a line in the graph to see the message activity behind that connection.
          </p>
        ) : (
          <>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, fontFamily: 'Inter, system-ui, sans-serif' }}>
              {shortLabel(selected.sourceLabel)} → {shortLabel(selected.targetLabel)}
            </h3>
            {messagesLoading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}><Spinner size={22} /></div>
            )}
            {!messagesLoading && messagesFailed && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                Couldn't load messages for this connection.
              </p>
            )}
            {!messagesLoading && !messagesFailed && messages?.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                No messages found for this period.
              </p>
            )}
            {!messagesLoading && !messagesFailed && messages && messages.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '6px 8px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'Inter, system-ui, sans-serif' }}>PLATFORM</th>
                      <th style={{ padding: '6px 8px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'Inter, system-ui, sans-serif' }}>MESSAGE</th>
                      <th style={{ padding: '6px 8px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'Inter, system-ui, sans-serif' }}>SENT</th>
                      <th style={{ padding: '6px 8px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'Inter, system-ui, sans-serif' }}>TYPE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map(m => (
                      <tr key={m.id} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px' }}><Badge variant="neutral">{SOURCE_LABEL[m.source]}</Badge></td>
                        <td style={{ padding: '8px', fontSize: 11.5, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }} title={m.text}>
                          {truncateText(m.text)}
                        </td>
                        <td style={{ padding: '8px', fontSize: 11.5, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif', whiteSpace: 'nowrap' }}>
                          {new Date(m.occurredAt).toLocaleString('en-ZA')}
                        </td>
                        <td style={{ padding: '8px', fontSize: 11.5, color: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                          {m.isReply ? 'Reply' : 'New message'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}