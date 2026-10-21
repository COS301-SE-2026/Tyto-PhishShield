import { useState } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer } from 'recharts';
import type { DepartmentBreakdown } from './analytics.service';

type Metric = 'clickRate' | 'detectionRate';

const METRIC_LABEL: Record<Metric, string> = {
  clickRate: 'Click Rate',
  detectionRate: 'Detection Rate',
};

// Single series plotting one metric across departments — a magnitude job, so
// one hue is correct (not categorical identity, so no multi-hue validation needed).
const RADAR_COLOR = 'var(--color-primary)';

export function DepartmentRadar({ departments }: { readonly departments: DepartmentBreakdown[] }) {
  const [metric, setMetric] = useState<Metric>('clickRate');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {(['clickRate', 'detectionRate'] as const).map(m => (
          <button key={m} type="button" onClick={() => setMetric(m)}
            style={{
              padding: '5px 10px', borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif',
              border: `1.5px solid ${metric === m ? 'var(--color-primary)' : 'var(--border)'}`,
              background: metric === m ? 'var(--color-primary-light)' : 'transparent',
              color: metric === m ? 'var(--color-primary)' : 'var(--text-muted)',
            }}>
            {METRIC_LABEL[m]}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={departments} outerRadius="75%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="department" tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontFamily: 'Inter, system-ui, sans-serif' }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
          <Radar name={METRIC_LABEL[metric]} dataKey={metric} stroke={RADAR_COLOR} fill={RADAR_COLOR} fillOpacity={0.25} />
          <Tooltip
            formatter={(value: unknown) => [`${Math.round(Number(value))}%`, METRIC_LABEL[metric]] as [string, string]}
            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, fontFamily: 'Inter, system-ui, sans-serif' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}