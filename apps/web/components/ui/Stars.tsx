export function Stars({ value, size = "text-sm" }: { value: number; size?: string }) {
  const full = Math.round(value);
  return (
    <span className={`tracking-tight text-molten ${size}`} aria-label={`${value} stars`}>
      {"★".repeat(Math.min(5, full))}
      <span className="text-muted-foreground">{"★".repeat(Math.max(0, 5 - full))}</span>
    </span>
  );
}
