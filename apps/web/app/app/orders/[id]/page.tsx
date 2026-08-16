"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useI18n } from "@/components/Providers";

const STEPS = ["CONFIRMED", "SENT_TO_FACTORY", "IN_PRODUCTION", "SHIPPED", "DELIVERED", "RECEIVED"];

type Order = {
  id: string;
  status: string;
  company?: { legalName: string };
  salesman?: { displayName: string };
  quote?: { total?: number; rfq?: { title: string } };
  events: { id: string; status: string; note?: string; createdAt: string }[];
};

export default function OrderDetail() {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const [o, setO] = useState<Order | null>(null);
  const [me, setMe] = useState<{ role: string } | null>(null);
  const [msg, setMsg] = useState("");

  async function load() {
    setO(await api(`/api/orders/${id}`));
  }

  useEffect(() => {
    api("/auth/me").then(setMe);
    load();
  }, [id]);

  if (!o) return <p className="text-muted-foreground">{t.loading}</p>;
  const idx = STEPS.indexOf(o.status);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">{t.orders}</h1>
      <p className="text-muted-foreground">
        {o.quote?.rfq?.title} · {o.company?.legalName} · {o.quote?.total?.toLocaleString()} SAR
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`rounded-full px-3 py-1 text-xs ${
              i <= idx ? "bg-molten text-black" : "border border-border text-muted-foreground"
            }`}
          >
            {s.replaceAll("_", " ")}
          </div>
        ))}
      </div>
      <ul className="mt-8 space-y-3 text-sm">
        {o.events.map((e) => (
          <li key={e.id} className="uplift surface-slab rounded-xl p-3">
            <span className="font-medium">{e.status}</span> — {e.note}{" "}
            <span className="text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</span>
          </li>
        ))}
      </ul>
      {me?.role === "SALESMAN" && o.status !== "RECEIVED" && o.status !== "DELIVERED" && (
        <div className="mt-6 flex flex-wrap gap-2">
          {STEPS.filter((s) => STEPS.indexOf(s) > idx && s !== "RECEIVED").map((s) => (
            <button
              key={s}
              className="btn-steel text-sm"
              onClick={async () => {
                await api(`/api/orders/${o.id}/status`, { method: "POST", body: JSON.stringify({ status: s, note: `Moved to ${s}` }) });
                await load();
              }}
            >
              {s.replaceAll("_", " ")}
            </button>
          ))}
        </div>
      )}
      {me?.role === "COMPANY" && o.status === "DELIVERED" && (
        <button
          className="btn-molten mt-6"
          onClick={async () => {
            await api(`/api/orders/${o.id}/receive`, { method: "POST" });
            setMsg(t.confirmReceipt);
            await load();
          }}
        >
          {t.confirmReceipt}
        </button>
      )}
      {msg && <p className="mt-3 text-molten">{msg}</p>}
    </div>
  );
}
