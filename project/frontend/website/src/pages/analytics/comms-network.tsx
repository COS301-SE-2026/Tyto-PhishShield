import { useMemo, useState, useEffect } from 'react';
import { GraphCanvas, type GraphNode, type GraphEdge, type InternalGraphEdge } from 'reagraph';
import { Badge, Spinner } from '../../components/ui';
import { fetchCommsMessages, type CommsGraph, type CommsMessage } from '../../services/comms';
import type { Period } from './analytics.service';

// Sequential blue ramp (palette.md) — identity comes from the direct label on
// every node, so color is free to carry magnitude (who the hub communicators
// are) instead of department, which fails all-pairs CVD separation past 3 hues.
// Department is still visually grouped via reagraph's own clusterAttribute.
const ACTIVITY_STEPS = ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#1c5cab', '#0d366b'];
const EDGE_COLOR = '#898781';

function activityFill(ratio: number): string {
  const index = Math.min(ACTIVITY_STEPS.length - 1, Math.floor(ratio * ACTIVITY_STEPS.length));
  return ACTIVITY_STEPS[index];
}

function shortLabel(label: string): string {
  const name = label.split('@')[0];
  return name.length > 22 ? `${name.slice(0, 21)}…` : name;
}

function truncateText(text: string, max = 60): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

const SOURCE_LABEL: Record<CommsMessage['source'], string> = {
  slack: 'Slack',
  teams: 'Teams',
  email: 'Email',
};

interface SelectedEdge {
  source: string;
  target: string;
  sourceLabel: string;
  targetLabel: string;
}

interface EdgeData {
  sourceId: string;
  targetId: string;
}

export function CommsNetworkGraph({ graph, period }: { readonly graph: CommsGraph; readonly period: Period }) {
  const { nodes, edges } = graph;
  const [searchTerm, setSearchTerm] = useState('');
  const [excludedDepartments, setExcludedDepartments] = useState<Set<string>>(new Set());
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

  const allDepartments = useMemo(
    () => [...new Set(nodes.map(n => n.department).filter((d): d is string => Boolean(d)))].sort(),
    [nodes],
  );

  const labelOf = (id: string) => nodes.find(n => n.id === id)?.label ?? id;

  // Department filter, then an ego-network search filter on top — the two
  // levers that let someone with 100+ users find a person's connections fast
  // instead of staring at an unreadable hairball.
  const { visibleNodes, visibleEdges } = useMemo(() => {
    const deptNodeIds = new Set(
      nodes.filter(n => !excludedDepartments.has(n.department ?? '')).map(n => n.id),
    );
    const deptEdges = edges.filter(e => deptNodeIds.has(e.source) && deptNodeIds.has(e.target));

    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return { visibleNodes: nodes.filter(n => deptNodeIds.has(n.id)), visibleEdges: deptEdges };
    }

    const matchIds = new Set(
      nodes.filter(n => deptNodeIds.has(n.id) && n.label.toLowerCase().includes(term)).map(n => n.id),
    );
    const neighborIds = new Set<string>();
    for (const e of deptEdges) {
      if (matchIds.has(e.source)) neighborIds.add(e.target);
      if (matchIds.has(e.target)) neighborIds.add(e.source);
    }
    const keepIds = new Set([...matchIds, ...neighborIds]);
    return {
      visibleNodes: nodes.filter(n => keepIds.has(n.id)),
      visibleEdges: deptEdges.filter(e => matchIds.has(e.source) || matchIds.has(e.target)),
    };
  }, [nodes, edges, excludedDepartments, searchTerm]);

  const { graphNodes, graphEdges } = useMemo(() => {
    const maxWeight = Math.max(1, ...visibleEdges.map(e => e.weight));
    const activity = new Map<string, number>();
    for (const e of visibleEdges) {
      activity.set(e.source, (activity.get(e.source) ?? 0) + e.weight);
      activity.set(e.target, (activity.get(e.target) ?? 0) + e.weight);
    }
    const maxActivity = Math.max(1, ...activity.values());

    const gNodes: GraphNode[] = visibleNodes.map(n => {
      const act = activity.get(n.id) ?? 0;
      return {
        id: n.id,
        label: shortLabel(n.label),
        data: { department: n.department ?? 'Unknown' },
        size: 6 + (act / maxActivity) * 10,
        fill: activityFill(act / maxActivity),
      };
    });
    const gEdges: GraphEdge[] = visibleEdges.map(e => ({
      id: `${e.source}__${e.target}`,
      source: e.source,
      target: e.target,
      size: 1 + (e.weight / maxWeight) * 3,
      fill: EDGE_COLOR,
      data: { sourceId: e.source, targetId: e.target } satisfies EdgeData,
    }));
    return { graphNodes: gNodes, graphEdges: gEdges };
  }, [visibleNodes, visibleEdges]);

  function toggleDepartment(dept: string): void {
    setExcludedDepartments(prev => {
      const next = new Set(prev);
      if (next.has(dept)) next.delete(dept); else next.add(dept);
      return next;
    });
  }

  function handleEdgeClick(edge: InternalGraphEdge): void {
    const data = edge.data as EdgeData;
    setSelected({
      source: data.sourceId,
      target: data.targetId,
      sourceLabel: labelOf(data.sourceId),
      targetLabel: labelOf(data.targetId),
    });
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'stretch' }}>
      <div style={{ flex: '1 1 420px', minWidth: 300, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Find a user — shows them and their direct connections"
            style={{
              flex: '1 1 220px', padding: '7px 10px', fontSize: 12, borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          />
          {allDepartments.map(dept => {
            const active = !excludedDepartments.has(dept);
            return (
              <button key={dept} type="button" onClick={() => toggleDepartment(dept)}
                style={{
                  padding: '5px 10px', borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif',
                  border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--border)'}`,
                  background: active ? 'var(--color-primary-light)' : 'transparent',
                  color: active ? 'var(--color-primary)' : 'var(--text-muted)',
                }}>
                {dept}
              </button>
            );
          })}
        </div>

        <div style={{ width: '100%', height: 420, position: 'relative', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          {graphNodes.length === 0 ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>
              No users match this filter.
            </div>
          ) : (
            <GraphCanvas
              nodes={graphNodes}
              edges={graphEdges}
              clusterAttribute="department"
              layoutType="forceDirected2d"
              edgeArrowPosition="end"
              onEdgeClick={handleEdgeClick}
            />
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>Less active</span>
          <div style={{ display: 'flex', gap: 2 }}>
            {ACTIVITY_STEPS.map(hex => (
              <span key={hex} style={{ width: 14, height: 8, background: hex, display: 'inline-block' }} />
            ))}
          </div>
          <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif' }}>More active</span>
          <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif', marginLeft: 'auto' }}>
            Grouped by department · click a line for message detail
          </span>
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