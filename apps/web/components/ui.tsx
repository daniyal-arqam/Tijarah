import type { ReactNode } from "react";

export function Icon({ name, className = "size-4" }: { name: string; className?: string }) {
  const p = { className, fill: "none", stroke: "currentColor", strokeWidth: 1.7, viewBox: "0 0 24 24" };
  const icons: Record<string, ReactNode> = {
    dash: (
      <svg {...p}>
        <path d="M4 19V9l8-6 8 6v10" />
        <path d="M9 19v-6h6v6" />
      </svg>
    ),
    leads: (
      <svg {...p}>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 9h8M8 13h5" />
      </svg>
    ),
    mail: (
      <svg {...p}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    ),
    quote: (
      <svg {...p}>
        <path d="M7 4h8l5 5v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
        <path d="M15 4v5h5M8 13h8M8 17h5" />
      </svg>
    ),
    order: (
      <svg {...p}>
        <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
      </svg>
    ),
    star: (
      <svg {...p}>
        <path d="m12 3 2.4 6.6H21l-5.2 4 2 6.4L12 16.8 6.2 20l2-6.4L3 9.6h6.6z" />
      </svg>
    ),
    user: (
      <svg {...p}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c1.5-3.5 4.2-5 8-5s6.5 1.5 8 5" />
      </svg>
    ),
    invoice: (
      <svg {...p}>
        <path d="M6 3h9l5 5v13H6z" />
        <path d="M15 3v5h5M9 12h6M9 16h4" />
      </svg>
    ),
    search: (
      <svg {...p}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    ),
    bell: (
      <svg {...p}>
        <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
        <path d="M10 21a2 2 0 0 0 4 0" />
      </svg>
    ),
    sun: (
      <svg {...p}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v2M12 19v2M5 12H3M21 12h-2M6 6l1.5 1.5M16.5 16.5 18 18M18 6l-1.5 1.5M7.5 16.5 6 18" />
      </svg>
    ),
    moon: (
      <svg {...p}>
        <path d="M19 13.5A7.5 7.5 0 1 1 10.5 5 6 6 0 0 0 19 13.5z" />
      </svg>
    ),
    globe: (
      <svg {...p}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" />
      </svg>
    ),
    plane: (
      <svg {...p} strokeLinejoin="round" strokeLinecap="round">
        <path d="m22 2-7 20-4-9-9-4z" />
        <path d="M22 2 11 13" />
      </svg>
    ),
    pin: (
      <svg {...p}>
        <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.2" />
      </svg>
    ),
    check: (
      <svg {...p}>
        <path d="M5 12.5 9.5 17 19 7" />
      </svg>
    ),
    trend: (
      <svg {...p}>
        <path d="M4 18 10 10l4 4 6-8" />
      </svg>
    ),
    lock: (
      <svg {...p}>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    ),
  };
  return icons[name] ?? icons.dash;
}

export function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  const map: Record<string, string> = {
    ACCEPTED: "bg-emerald-500/15 text-emerald-400",
    RECEIVED: "bg-emerald-500/15 text-emerald-400",
    DELIVERED: "bg-emerald-500/15 text-emerald-400",
    PAID: "bg-emerald-500/15 text-emerald-400",
    SENT: "bg-sky-500/15 text-sky-400",
    VIEWED: "bg-sky-500/15 text-sky-400",
    SHIPPED: "bg-sky-500/15 text-sky-300",
    CONFIRMED: "bg-blue-500/15 text-blue-400",
    IN_PRODUCTION: "bg-blue-500/15 text-blue-400",
    REJECTED: "bg-red-500/15 text-red-400",
    DRAFT: "bg-zinc-500/20 text-zinc-400",
    COUNTERED: "bg-amber-500/15 text-amber-400",
    OPEN: "bg-amber-500/15 text-amber-300",
    SENT_TO_FACTORY: "bg-amber-500/15 text-amber-300",
    PARTIAL: "bg-amber-500/15 text-amber-300",
    UNPAID: "bg-red-500/15 text-red-400",
    OPENED: "bg-sky-500/15 text-sky-400",
    SELECTED: "bg-emerald-500/15 text-emerald-400",
    FOLLOW_UP: "bg-amber-500/15 text-amber-400",
  };
  const label = s.replaceAll("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map[s] ?? "bg-muted text-muted-foreground"}`}>{label}</span>;
}

export function Stars({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`inline-flex gap-0.5 text-molten ${className}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i}>{i <= Math.round(value) ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function Avatar({ name, src, size = "md" }: { name: string; src?: string | null; size?: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? "size-24 text-3xl" : size === "sm" ? "size-10 text-sm" : "size-10 text-sm";
  if (src) {
    return <img src={src} alt="" className={`${dim} rounded-full object-cover`} />;
  }
  return (
    <span className={`grid ${dim} place-items-center rounded-full bg-molten font-display font-bold text-black`}>
      {(name || "?").slice(0, 1).toUpperCase()}
    </span>
  );
}
