export function LineChart({ points, labels }: { points: number[]; labels: string[] }) {
  const w = 560;
  const h = 220;
  const pad = 28;
  const max = Math.max(...points, 1);
  const step = (w - pad * 2) / Math.max(points.length - 1, 1);
  const coords = points.map((p, i) => {
    const x = pad + i * step;
    const y = h - pad - (p / max) * (h - pad * 2);
    return `${x},${y}`;
  });
  const line = coords.join(" ");
  const area = `${pad},${h - pad} ${line} ${pad + (points.length - 1) * step},${h - pad}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-52 w-full">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line key={t} x1={pad} x2={w - pad} y1={h - pad - t * (h - pad * 2)} y2={h - pad - t * (h - pad * 2)} stroke="hsl(var(--border))" strokeWidth="1" />
      ))}
      <polygon points={area} fill="url(#rev)" opacity="0.45" />
      <polyline points={line} fill="none" stroke="hsl(var(--molten))" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => {
        const x = pad + i * step;
        const y = h - pad - (p / max) * (h - pad * 2);
        return <circle key={i} cx={x} cy={y} r="3.5" fill="hsl(var(--molten))" />;
      })}
      {labels.map((l, i) => (
        <text key={l} x={pad + i * step} y={h - 8} textAnchor="middle" className="fill-muted-foreground" fontSize="11">
          {l}
        </text>
      ))}
      <defs>
        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--molten))" stopOpacity="0.55" />
          <stop offset="100%" stopColor="hsl(var(--molten))" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function BarChart({
  items,
}: {
  items: { label: string; value: number; color: string }[];
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="flex h-52 items-end gap-4 px-2 pb-1 pt-4">
      {items.map((i) => (
        <div key={i.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-40 w-full items-end justify-center">
            <div
              className="w-10 rounded-t-lg sm:w-12"
              style={{ height: `${Math.max(8, (i.value / max) * 100)}%`, background: i.color }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground">{i.label}</span>
        </div>
      ))}
    </div>
  );
}
