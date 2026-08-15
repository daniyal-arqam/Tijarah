"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useI18n } from "@/components/Providers";

export default function Dashboard() {
  const { t } = useI18n();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api("/api/dashboard")
      .then(setData)
      .catch((e) => setErr(e.message));
  }, []);

  if (err) return <p className="text-red-400">{err}</p>;
  if (!data) return <p className="text-zinc-500">Loading dashboard…</p>;

  if ("spendThisMonth" in data) {
    return (
      <div>
        <h1 className="text-3xl font-semibold">Procurement</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card label="Spend this month" value={`${Number(data.spendThisMonth).toLocaleString()} SAR`} />
          <Card label="In progress" value={String(data.inProgress)} />
          <Card label="Open RFQs" value={String(data.openRfqs)} />
        </div>
      </div>
    );
  }

  if ("gmv" in data) {
    return (
      <div>
        <h1 className="text-3xl font-semibold">Admin</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card label="Users" value={String(data.users)} />
          <Card label="Orders" value={String(data.orders)} />
          <Card label="GMV" value={`${Number(data.gmv).toLocaleString()} SAR`} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold">Overview</h1>
      <p className="mt-1 text-zinc-500">Your sales performance.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label={t.trust} value={`${data.trustScore}/100`} />
        <Card label={t.paid} value={`${Number(data.paidRevenue).toLocaleString()} SAR`} />
        <Card label={t.margin} value={`${Number(data.privateMargin).toLocaleString()} SAR`} lock />
        <Card label="Orders this month" value={String(data.ordersThisMonth)} />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#16181f]">
          <div className="flex justify-between">
            <h2 className="font-medium">Latest quotes</h2>
            <Link href="/app/quotes" className="text-sm text-copper">
              View all
            </Link>
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {(data.recentQuotes as { id: string; status: string; total?: number }[]).map((q) => (
              <li key={q.id} className="flex justify-between">
                <span>{q.status}</span>
                <span>{q.total?.toLocaleString()} SAR</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#16181f]">
          <div className="flex justify-between">
            <h2 className="font-medium">Recent orders</h2>
            <Link href="/app/orders" className="text-sm text-copper">
              View all
            </Link>
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {(data.recentOrders as { id: string; status: string }[]).map((o) => (
              <li key={o.id} className="flex justify-between">
                <span className="truncate pe-4">{o.id.slice(0, 8)}</span>
                <span>{o.status}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Card({ label, value, lock }: { label: string; value: string; lock?: boolean }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#16181f]">
      <div className="text-xs uppercase tracking-wide text-zinc-500">
        {label} {lock ? "🔒" : ""}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
