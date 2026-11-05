/**
 * Shared Recharts styling. Recharts takes colours as props rather than classes,
 * so the palette has to live in JS — these constants are the only place chart
 * colours are written down.
 */
export const CHART = {
  signal: '#a8e01f',
  signalLight: '#d6fb6e',
  cool: '#4cc8ff',
  grid: 'rgba(255,255,255,0.055)',
  tick: '#646b7d',
};

export const axis = {
  tick: { fontSize: 11, fill: CHART.tick, fontFamily: '"JetBrains Mono", monospace' },
  stroke: 'rgba(255,255,255,0.1)',
  tickLine: false,
};

export const grid = {
  strokeDasharray: '2 6',
  stroke: CHART.grid,
  vertical: false,
};

/** Tooltip styled as a small panel instead of Recharts' white default. */
export function ChartTooltip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-ink-800/95 px-3 py-2 shadow-lift backdrop-blur-md">
      <div className="mb-1 text-[0.6875rem] uppercase tracking-[0.1em] text-ink-400">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-sm">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-ink-400">{p.name}</span>
          <span className="tnum ml-auto font-mono font-medium text-ink-50">
            {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Highlights the hovered bar/point without the grey default wash. */
export const cursor = { fill: 'rgba(255,255,255,0.04)' };
export const activeDot = { r: 4, strokeWidth: 2, stroke: '#101217' };
