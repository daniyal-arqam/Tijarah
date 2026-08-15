"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Rfq = {
  id: string;
  title: string;
  status: string;
  salesmanId: string;
  salesman?: { displayName: string };
  company?: { legalName: string };
};

type Salesman = { id: string; displayName: string; match: number; trustScore: number; slug: string };

export default function RfqsPage() {
  const [me, setMe] = useState<{ role: string } | null>(null);
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [form, setForm] = useState({ salesmanId: "", title: "", specialty: "rebar", specs: "", quantity: 1, destinationCity: "Riyadh" });
  const [quoteForm, setQuoteForm] = useState({ rfqId: "", product: "", quantity: 1, unitPrice: 0, factoryCostEstimate: 0 });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api("/auth/me").then(async (u) => {
      setMe(u);
      setRfqs(await api("/api/rfqs"));
      if (u.role === "COMPANY") setSalesmen(await api("/api/salesmen"));
    });
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-semibold">RFQs</h1>
      {me?.role === "COMPANY" && (
        <form
          className="mt-6 grid gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#16181f]"
          onSubmit={async (e) => {
            e.preventDefault();
            await api("/api/rfqs", { method: "POST", body: JSON.stringify(form) });
            setMsg("RFQ sent");
            setRfqs(await api("/api/rfqs"));
          }}
        >
          <select className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700" value={form.salesmanId} onChange={(e) => setForm({ ...form, salesmanId: e.target.value })}>
            <option value="">Select salesman</option>
            {salesmen.map((s) => (
              <option key={s.id} value={s.id}>
                {s.displayName} · match {s.match}% · trust {s.trustScore}
              </option>
            ))}
          </select>
          <input className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700" placeholder="Specs" value={form.specs} onChange={(e) => setForm({ ...form, specs: e.target.value })} />
          <input type="number" className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700" placeholder="Qty" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
          <button className="rounded-lg bg-copper py-2 font-medium text-black">Send RFQ</button>
        </form>
      )}
      {me?.role === "SALESMAN" && (
        <form
          className="mt-6 grid gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#16181f]"
          onSubmit={async (e) => {
            e.preventDefault();
            const created = await api("/api/quotes", {
              method: "POST",
              body: JSON.stringify({
                rfqId: quoteForm.rfqId,
                factoryCostEstimate: quoteForm.factoryCostEstimate,
                lines: [{ product: quoteForm.product, quantity: quoteForm.quantity, unitPrice: quoteForm.unitPrice }],
              }),
            });
            setMsg(`Quote sent · ${created.total} SAR (margin ${created.margin})`);
          }}
        >
          <div className="text-sm font-medium">Send quote (factory cost stays private)</div>
          <select className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700" value={quoteForm.rfqId} onChange={(e) => setQuoteForm({ ...quoteForm, rfqId: e.target.value })}>
            <option value="">Select RFQ</option>
            {rfqs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title} · {r.company?.legalName}
              </option>
            ))}
          </select>
          <input className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700" placeholder="Product line" value={quoteForm.product} onChange={(e) => setQuoteForm({ ...quoteForm, product: e.target.value })} />
          <input type="number" className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700" placeholder="Qty" value={quoteForm.quantity} onChange={(e) => setQuoteForm({ ...quoteForm, quantity: Number(e.target.value) })} />
          <input type="number" className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700" placeholder="Unit price SAR (what company sees)" value={quoteForm.unitPrice} onChange={(e) => setQuoteForm({ ...quoteForm, unitPrice: Number(e.target.value) })} />
          <input type="number" className="rounded-lg border border-copper/50 bg-copper/5 px-3 py-2" placeholder="Factory cost SAR (only you)" value={quoteForm.factoryCostEstimate} onChange={(e) => setQuoteForm({ ...quoteForm, factoryCostEstimate: Number(e.target.value) })} />
          <button className="rounded-lg bg-copper py-2 font-medium text-black">Send quote</button>
        </form>
      )}
      {msg && <p className="mt-3 text-copper">{msg}</p>}
      <ul className="mt-8 space-y-3">
        {rfqs.map((r) => (
          <li key={r.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="font-medium">{r.title}</div>
            <div className="text-sm text-zinc-500">
              {r.company?.legalName} → {r.salesman?.displayName} · {r.status}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
