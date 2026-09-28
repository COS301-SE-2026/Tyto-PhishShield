import type { CommsGraph } from '../../services/comms';

// Sequential blue ramp: identity comes from the direct label on every node, so color is free to carry magnitude instead of department.
const ACTIVITY_STEPS = ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#1c5cab', '#0d366b'];

function activityFill(ratio: number): string {
  const index = Math.min(ACTIVITY_STEPS.length - 1, Math.floor(ratio * ACTIVITY_STEPS.length));
  return ACTIVITY_STEPS[index];
}

function shortLabel(label: string): string {
  const name = label.split('@')[0];
  return name.length > 18 ? `${name.slice(0, 17)}…` : name;
}

const EDGE_COLOR = '#898781';
const SIZE = 460;
const CENTER = SIZE / 2;
const NODE_RADIUS = 150;
const LABEL_RADIUS = NODE_RADIUS + 16;

export function CommsNetworkGraph({ graph }: { readonly graph: CommsGraph }) {
  const { nodes, edges } = graph;
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ width: '100%', maxWidth: 460, height: 'auto' }}>
        {edges.map(e => {
          const from = positions.get(e.source);
          const to = positions.get(e.target);
          if (!from || !to) return null;
          const ratio = e.weight / maxWeight;
          return (
            <line key={`${e.source}-${e.target}`}
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={EDGE_COLOR} strokeOpacity={0.2 + ratio * 0.5} strokeWidth={1 + ratio * 3}
              strokeLinecap="round"
            >
              <title>{`${e.weight} message${e.weight === 1 ? '' : 's'} · last contact ${new Date(e.lastInteractionAt).toLocaleDateString('en-ZA')}`}</title>
            </line>
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
  );
}