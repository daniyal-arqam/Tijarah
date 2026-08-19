"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useI18n } from "@/components/Providers";

type Quote = {
  id: string;
  status: string;
  version: number;
  factoryCostEstimate?: number;
  profit?: number;
  subtotal: number;
  vat: number;
  total: number;
  paymentTerms: string;
  notes?: string;
  lines: { id: string; product: string; quantity: number; unitPrice: number }[];
  rfq: { title: string; company?: { legalName: string } };
};

export default function QuoteDetail() {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const [q, setQ] = useState<Quote | null>(null);
  const [me, setMe] = useState<{ role: string } | null>(null);
  const [counter, setCounter] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api("/auth/me").then(setMe);
    api(`/api/quotes/${id}`).then(setQ);
  }, [id]);

  if (!q) return <p className="text-muted-foreground">{t.loading}</p>;
  const companyView = me?.role === "COMPANY";

  return (
    <div className="surface-slab mx-auto max-w-3xl rounded-2xl p-8">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        Tijarah · v{q.version}
      </div>
      <h1 className="mt-2 font-display text-3xl font-bold">{q.rfq.title}</h1>
      <p className="text-muted-foreground">{q.rfq.company?.legalName}</p>
      <table className="mt-6 w-full text-sm">
        <tbody>
          {q.lines.map((l) => (
            <tr key={l.id} className="border-t border-border">
              <td className="py-3">{l.product}</td>
              <td>{l.quantity}</td>
              <td>{l.unitPrice.toLocaleString()} SAR</td>
              <td className="text-end">{(l.quantity * l.unitPrice).toLocaleString()} SAR</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!companyView && q.factoryCostEstimate != null && (
        <div className="mt-6 rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm">
          <div className="font-medium text-primary">{t.internalOnly}</div>
          <div className="mt-2 flex justify-between">
            <span>{t.factoryCost}</span>
            <span>{q.factoryCostEstimate.toLocaleString()} SAR</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span>{t.companySees}</span>
            <span>{q.subtotal.toLocaleString()} SAR</span>
          </div>
          <div className="mt-1 flex justify-between font-semibold text-molten">
            <span>{t.yourProfit}</span>
            <span>{(q.profit ?? q.subtotal - q.factoryCostEstimate).toLocaleString()} SAR</span>
          </div>
        </div>
      )}
      <div className="mt-6 space-y-1 text-end">
        <div>Subtotal {q.subtotal.toLocaleString()} SAR</div>
        <div>VAT 15% {q.vat.toLocaleString()} SAR</div>
        <div className="text-2xl font-semibold text-molten">{q.total.toLocaleString()} SAR</div>
      </div>
      {companyView && q.status !== "ACCEPTED" && q.status !== "REJECTED" && (
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            className="btn-molten"
            onClick={async () => {
              await api(`/api/quotes/${q.id}/decide`, { method: "POST", body: JSON.stringify({ accept: true }) });
              setMsg(t.accepted);
              setQ(await api(`/api/quotes/${id}`));
            }}
          >
            {t.accept}
          </button>
          <button
            className="btn-steel"
            onClick={async () => {
              await api(`/api/quotes/${q.id}/decide`, { method: "POST", body: JSON.stringify({ accept: false }) });
              setMsg(t.reject);
              setQ(await api(`/api/quotes/${id}`));
            }}
          >
            {t.reject}
          </button>
          <input className="field max-w-[180px]" placeholder="SAR" value={counter} onChange={(e) => setCounter(e.target.value)} />
          <button
            className="btn-steel text-primary"
            onClick={async () => {
              await api(`/api/quotes/${q.id}/counter`, { method: "POST", body: JSON.stringify({ total: Number(counter) }) });
              setMsg(t.counter);
              setQ(await api(`/api/quotes/${id}`));
            }}
          >
            {t.counter}
          </button>
        </div>
      )}
      {msg && <p className="mt-4 text-molten">{msg}</p>}
    </div>
  );
}
