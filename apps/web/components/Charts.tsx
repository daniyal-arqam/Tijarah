export function AreaChart({ points, labels }: { points: number[]; labels: string[] }) {
  const w = 560;
  const h = 220;
  const pad = 28;
  const max = Math.max(1, ...points);
  const xs = points.map((_, i) => pad + (i * (w - pad * 2)) / Math.max(1, points.length - 1));
  const ys = points.map((p) => h - pad - (p / max) * (h - pad * 2));
  const line = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  const fill = `${line} L${xs[xs.length - 1]},${h - pad} L${xs[0]},${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-52 w-full">
      <defs>
        <linearGradient id="rev" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--molten))" stopOpacity="0.45" />
          <stop offset="100%" stopColor="hsl(var(--molten))" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((t) => (
        <line key={t} x1={pad} x2={w - pad} y1={pad + t * (h - pad * 2)} y2={pad + t * (h - pad * 2)} stroke="hsl(var(--border))" strokeOpacity="0.6" />
      ))}
      <path d={fill} fill="url(#rev)" />
      <path d={line} fill="none" stroke="hsl(var(--molten))" strokeWidth="2.5" />
      {xs.map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={ys[i]} r="3.5" fill="hsl(var(--molten))" />
          <text x={x} y={h - 8} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="11">
            {labels[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function BarChart({ items }: { items: { label: string; value: number; color: string }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="flex h-52 items-end gap-4 px-4 pb-6 pt-2">
      {items.map((i) => (
        <div key={i.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-40 w-full items-end justify-center">
            <div
              className="w-10 rounded-t-md"
              style={{ height: `${Math.max(6, (i.value / max) * 100)}%`, background: i.color }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground">{i.label}</span>
        </div>
      ))}
    </div>
  );
}
