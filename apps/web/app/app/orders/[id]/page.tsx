"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

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

  if (!o) return <p>Loading…</p>;
  const idx = STEPS.indexOf(o.status);

  return (
    <div>
      <h1 className="text-3xl font-semibold">Order details</h1>
      <p className="text-zinc-500">
        {o.quote?.rfq?.title} · {o.company?.legalName} · {o.quote?.total?.toLocaleString()} SAR
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`rounded-full px-3 py-1 text-xs ${
              i <= idx ? "bg-copper text-black" : "border border-zinc-600 text-zinc-500"
            }`}
          >
            {s.replaceAll("_", " ")}
          </div>
        ))}
      </div>
      <ul className="mt-8 space-y-3 text-sm">
        {o.events.map((e) => (
          <li key={e.id} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
            <span className="font-medium">{e.status}</span> — {e.note}{" "}
            <span className="text-zinc-500">{new Date(e.createdAt).toLocaleString()}</span>
          </li>
        ))}
      </ul>
      {me?.role === "SALESMAN" && o.status !== "RECEIVED" && o.status !== "DELIVERED" && (
        <div className="mt-6 flex flex-wrap gap-2">
          {STEPS.filter((s) => STEPS.indexOf(s) > idx && s !== "RECEIVED").map((s) => (
            <button
              key={s}
              className="rounded-lg border border-zinc-500 px-3 py-2 text-sm"
              onClick={async () => {
                await api(`/api/orders/${o.id}/status`, { method: "POST", body: JSON.stringify({ status: s, note: `Moved to ${s}` }) });
                await load();
              }}
            >
              Mark {s.replaceAll("_", " ")}
            </button>
          ))}
        </div>
      )}
      {me?.role === "COMPANY" && o.status === "DELIVERED" && (
        <button
          className="mt-6 rounded-lg bg-copper px-4 py-2 font-medium text-black"
          onClick={async () => {
            await api(`/api/orders/${o.id}/receive`, { method: "POST" });
            setMsg("Receipt confirmed — you can leave a review");
            await load();
          }}
        >
          Confirm receipt
        </button>
      )}
      {msg && <p className="mt-3 text-copper">{msg}</p>}
    </div>
  );
}
