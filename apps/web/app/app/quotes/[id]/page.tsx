"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

type Quote = {
  id: string;
  status: string;
  version: number;
  factoryCostEstimate?: number;
  margin?: number;
  subtotal: number;
  vat: number;
  total: number;
  paymentTerms: string;
  notes?: string;
  lines: { id: string; product: string; quantity: number; unitPrice: number }[];
  rfq: { title: string; company?: { legalName: string } };
};

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const [q, setQ] = useState<Quote | null>(null);
  const [me, setMe] = useState<{ role: string } | null>(null);
  const [counter, setCounter] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api("/auth/me").then(setMe);
    api(`/api/quotes/${id}`).then(setQ);
  }, [id]);

  if (!q) return <p>Loading…</p>;
  const companyView = me?.role === "COMPANY";

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-[#16181f]">
      <div className="text-xs uppercase tracking-widest text-zinc-500">Tijarah offer · v{q.version}</div>
      <h1 className="mt-2 text-3xl font-semibold">{q.rfq.title}</h1>
      <p className="text-zinc-500">{q.rfq.company?.legalName}</p>
      <table className="mt-6 w-full text-sm">
        <tbody>
          {q.lines.map((l) => (
            <tr key={l.id} className="border-t border-zinc-200 dark:border-zinc-800">
              <td className="py-3">{l.product}</td>
              <td>{l.quantity}</td>
              <td>{l.unitPrice.toLocaleString()} SAR</td>
              <td className="text-end">{(l.quantity * l.unitPrice).toLocaleString()} SAR</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!companyView && q.factoryCostEstimate != null && (
        <div className="mt-6 rounded-xl border border-copper/40 bg-copper/10 p-4 text-sm">
          <div className="font-medium text-copper">INTERNAL & CONFIDENTIAL — only you</div>
          <div className="mt-2 flex justify-between">
            <span>Factory cost</span>
            <span>{q.factoryCostEstimate.toLocaleString()} SAR</span>
          </div>
          <div className="flex justify-between">
            <span>Margin</span>
            <span>{q.margin?.toLocaleString()} SAR</span>
          </div>
        </div>
      )}
      <div className="mt-6 space-y-1 text-end">
        <div>Subtotal {q.subtotal.toLocaleString()} SAR</div>
        <div>VAT 15% {q.vat.toLocaleString()} SAR</div>
        <div className="text-2xl font-semibold text-copper">{q.total.toLocaleString()} SAR</div>
      </div>
      {companyView && q.status !== "ACCEPTED" && q.status !== "REJECTED" && (
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            className="rounded-lg bg-copper px-4 py-2 font-medium text-black"
            onClick={async () => {
              await api(`/api/quotes/${q.id}/decide`, { method: "POST", body: JSON.stringify({ accept: true }) });
              setMsg("Accepted — order created");
            }}
          >
            Accept
          </button>
          <button
            className="rounded-lg border border-zinc-500 px-4 py-2"
            onClick={async () => {
              await api(`/api/quotes/${q.id}/decide`, { method: "POST", body: JSON.stringify({ accept: false }) });
              setMsg("Rejected");
            }}
          >
            Reject
          </button>
          <input className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700" placeholder="Counter total SAR" value={counter} onChange={(e) => setCounter(e.target.value)} />
          <button
            className="rounded-lg border border-copper px-4 py-2 text-copper"
            onClick={async () => {
              await api(`/api/quotes/${q.id}/counter`, { method: "POST", body: JSON.stringify({ total: Number(counter) }) });
              setMsg("Counter sent");
            }}
          >
            Counter
          </button>
        </div>
      )}
      {msg && <p className="mt-4 text-copper">{msg}</p>}
    </div>
  );
}
