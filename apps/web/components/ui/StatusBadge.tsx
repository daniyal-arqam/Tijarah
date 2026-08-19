const MAP: Record<string, string> = {
  ACCEPTED: "bg-success/15 text-success",
  PAID: "bg-success/15 text-success",
  RECEIVED: "bg-success/15 text-success",
  DELIVERED: "bg-success/15 text-success",
  SENT: "bg-sky-400/15 text-sky-300",
  VIEWED: "bg-sky-400/15 text-sky-300",
  CONFIRMED: "bg-sky-400/15 text-sky-300",
  SHIPPED: "bg-cyan-400/15 text-cyan-300",
  COUNTERED: "bg-warn/15 text-warn",
  SENT_TO_FACTORY: "bg-warn/15 text-warn",
  IN_PRODUCTION: "bg-warn/15 text-warn",
  OPEN: "bg-warn/15 text-warn",
  REJECTED: "bg-danger/15 text-danger",
  UNPAID: "bg-danger/15 text-danger",
  DRAFT: "bg-muted text-muted-foreground",
  PARTIAL: "bg-accent/15 text-accent",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${MAP[status] ?? "bg-muted text-muted-foreground"}`}>
      {status.replaceAll("_", " ").toLowerCase()}
    </span>
  );
}
