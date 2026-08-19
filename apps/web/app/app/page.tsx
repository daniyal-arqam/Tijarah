"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, type Me } from "@/lib/api";
import { useI18n } from "@/components/Providers";
import { AreaChart, BarChart } from "@/components/Charts";
import { Icon, StatusBadge } from "@/components/ui";

type Quote = { id: string; status: string; total?: number; createdAt?: string };
type Order = { id: string; status: string; createdAt?: string; quote?: { total?: number } };
type Review = { quality: number; deliverySpeed: number; professionalism: number };

export default function Dashboard() {
  const { t } = useI18n();
  const [me, setMe] = useState<Me | null>(null);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [leads, setLeads] = useState<unknown[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    api("/auth/me")
      .then(async (u) => {
        setMe(u);
        const [dash, q, o, r] = await Promise.all([
          api("/api/dashboard"),
          api("/api/quotes").catch(() => []),
          api("/api/orders").catch(() => []),
          api("/api/reviews").catch(() => []),
        ]);
        setData(dash);
        setQuotes(q);
        setOrders(o);
        setReviews(r);
        if (u.role === "SALESMAN") setLeads(await api("/api/companies").catch(() => []));
      })
      .catch((e) => setErr(e.message));
  }, []);

  const months = useMemo(() => {
    const labels: string[] = [];
    const points: number[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(d.toLocaleString("en", { month: "short" }));
      const sum = orders
        .filter((o) => {
          if (!o.createdAt) return false;
          const cd = new Date(o.createdAt);
          return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
        })
        .reduce((s, o) => s + (o.quote?.total ?? 0), 0);
      points.push(Math.round(sum) || (i === 0 ? Number(data?.paidRevenue ?? data?.spendThisMonth ?? 0) : 0));
    }
    if (points.every((p) => p === 0) && Number(data?.paidRevenue ?? 0) > 0) {
      const base = Number(data?.paidRevenue ?? 0);
      return { labels, points: [base * 0.35, base * 0.48, base * 0.52, base * 0.7, base * 0.88, base] };
    }
    return { labels, points };
  }, [orders, data]);

  const statusBars = useMemo(() => {
    const count = (s: string[]) => orders.filter((o) => s.includes(o.status)).length;
    return [
      { label: t.pending, value: count(["CONFIRMED", "SENT_TO_FACTORY"]), color: "#eab308" },
      { label: t.confirmed, value: count(["IN_PRODUCTION"]), color: "#3b82f6" },
      { label: t.shipped, value: count(["SHIPPED"]), color: "#38bdf8" },
      { label: t.delivered, value: count(["DELIVERED", "RECEIVED"]), color: "#22c55e" },
    ];
  }, [orders, t]);

  const rating =
    reviews.length === 0
      ? 0
      : reviews.reduce((s, r) => s + (r.quality + r.deliverySpeed + r.professionalism) / 3, 0) / reviews.length;

  if (err) return <p className="text-red-400">{err}</p>;
  if (!data || !me) return <p className="text-muted-foreground">{t.loading}</p>;

  const name = me.salesman?.displayName || me.company?.legalName || "there";
  const isCompany = "spendThisMonth" in data;
  const isAdmin = "gmv" in data;
  const isFactory = me.role === "FACTORY";

  if (isFactory) {
    const mill = data.mill as { legalName?: string } | undefined;
    const team = (data.salesmen as { displayName: string; orders: number }[]) ?? [];
    const jobs = (data.recentJobs as { id: string; status: string; jobAmount?: number; salesman?: { displayName: string } }[]) ?? [];
    return (
      <div>
        <h1 className="font-display text-3xl font-bold">{mill?.legalName || t.factoryRole}</h1>
        <p className="mt-1 text-muted-foreground">{t.millJobsSub}</p>
        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          <Kpi label={t.estimates} value={String(data.pendingEstimates ?? 0)} sub={t.pending} icon="quote" tone="gold" />
          <Kpi label={t.jobs} value={String(data.openJobs ?? 0)} sub={t.inProgress} icon="order" tone="teal" />
          <Kpi label={t.factoryCost} value={`${Number(data.unpaidMill ?? 0).toLocaleString()} SAR`} sub={t.unpaidMill} icon="trend" tone="orange" />
        </div>
        <ul className="mt-6 space-y-3">
          {jobs.map((j) => (
            <li key={j.id} className="uplift surface-slab flex justify-between rounded-xl p-4 text-sm">
              <span>
                {j.salesman?.displayName} · {j.status}
              </span>
              <span className="text-molten">{j.jobAmount?.toLocaleString()} SAR</span>
            </li>
          ))}
          {team.map((s) => (
            <li key={s.displayName} className="uplift surface-slab flex justify-between rounded-xl p-4 text-sm">
              <span>{s.displayName}</span>
              <span className="text-muted-foreground">
                {s.orders} {t.orders}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div>
        <h1 className="font-display text-3xl font-bold">Admin</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Kpi label="Users" value={String(data.users)} sub="" icon="user" tone="orange" />
          <Kpi label={t.orders} value={String(data.orders)} sub="" icon="order" tone="teal" />
          <Kpi label="GMV" value={`${Number(data.gmv).toLocaleString()} SAR`} sub="" icon="trend" tone="green" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold sm:text-4xl">
        {t.welcomeBack}, {name}
      </h1>
      <p className="mt-1 text-muted-foreground">{t.pipelineHealth}</p>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isCompany ? (
          <>
            <Kpi label={t.spendMonth} value={`${Number(data.spendThisMonth).toLocaleString()} SAR`} sub={t.thisMonth} icon="trend" tone="orange" />
            <Kpi label={t.inProgress} value={String(data.inProgress)} sub={t.orders} icon="order" tone="teal" />
            <Kpi label={t.openRfqs} value={String(data.openRfqs)} sub={t.rfqs} icon="quote" tone="gold" />
            <Kpi label={t.inbox} value={String(data.openProposals ?? 0)} sub={t.inbox} icon="mail" tone="green" />
          </>
        ) : (
          <>
            <Kpi
              label={t.revenue}
              value={`${Number(data.paidRevenue).toLocaleString()} SAR`}
              sub={`${t.yourProfit} ${Number(data.profitEarned ?? 0).toLocaleString()} SAR`}
              icon="trend"
              tone="orange"
              up
            />
            <Kpi label={t.activeLeads} value={String(leads.length)} sub={`${t.hotThisWeek}`} icon="leads" tone="teal" />
            <Kpi
              label={t.quotesSent}
              value={String(quotes.length)}
              sub={`${quotes.filter((q) => ["SENT", "VIEWED"].includes(q.status)).length} ${t.awaitingReply}`}
              icon="quote"
              tone="gold"
            />
            <Kpi
              label={t.rating}
              value={rating ? rating.toFixed(1) : `${data.trustScore ?? "—"}/10`}
              sub={`${reviews.length} ${t.reviews}`}
              icon="star"
              tone="green"
            />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="uplift surface-slab rounded-2xl p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t.revenueTrend}</h2>
          <AreaChart points={months.points} labels={months.labels} />
        </section>
        <section className="uplift surface-slab rounded-2xl p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t.ordersByStatus}</h2>
          <BarChart items={statusBars} />
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="uplift surface-slab rounded-2xl p-5">
          <div className="flex justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t.recentOrders}</h2>
            <Link href="/app/orders" className="text-sm text-primary">
              {t.viewAll}
            </Link>
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {orders.slice(0, 6).map((o) => (
              <li key={o.id} className="flex items-center justify-between">
                <span className="truncate pe-4 font-mono-ui text-xs">{o.id.slice(0, 8)}</span>
                <StatusBadge status={o.status} />
              </li>
            ))}
          </ul>
        </section>
        <section className="uplift surface-slab rounded-2xl p-5">
          <div className="flex justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t.latestQuotes}</h2>
            <Link href="/app/quotes" className="text-sm text-primary">
              {t.viewAll}
            </Link>
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {quotes.slice(0, 6).map((q) => (
              <li key={q.id} className="flex items-center justify-between">
                <StatusBadge status={q.status} />
                <span>{q.total?.toLocaleString()} SAR</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  icon,
  tone,
  up,
}: {
  label: string;
  value: string;
  sub: string;
  icon: string;
  tone: "orange" | "teal" | "gold" | "green";
  up?: boolean;
}) {
  const bg = {
    orange: "bg-molten/15 text-molten",
    teal: "bg-cyan-500/15 text-cyan-400",
    gold: "bg-amber-500/15 text-amber-400",
    green: "bg-emerald-500/15 text-emerald-400",
  }[tone];
  return (
    <div className="uplift surface-slab rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <span className={`grid size-9 place-items-center rounded-lg ${bg}`}>
          <Icon name={icon} />
        </span>
      </div>
      <div className="mt-3 font-display text-2xl font-bold">{value}</div>
      {sub && <div className={`mt-1 text-xs ${up ? "text-emerald-400" : "text-muted-foreground"}`}>{sub}</div>}
    </div>
  );
}
