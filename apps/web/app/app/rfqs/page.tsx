"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHead } from "@/components/PageHead";
import { useI18n } from "@/components/Providers";
import { Field, StatusBadge } from "@/components/ui";

type Rfq = {
  id: string;
  title: string;
  status: string;
  specialty?: string;
  quantity?: number;
  unit?: string;
  destinationCity?: string;
  specs?: string;
  salesmanId: string;
  salesman?: { displayName: string };
  company?: { legalName: string };
};

type Salesman = { id: string; displayName: string; match: number; trustScore: number; slug: string };

export default function RfqsPage() {
  const { t } = useI18n();
  const [me, setMe] = useState<{ role: string } | null>(null);
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [form, setForm] = useState({
    salesmanId: "",
    title: "",
    specialty: "rebar",
    specs: "",
    quantity: 1,
    unit: "ton",
    destinationCity: "Riyadh",
    neededBy: "",
  });
  const [quoteForm, setQuoteForm] = useState({
    rfqId: "",
    product: "",
    quantity: 1,
    unitPrice: 0,
    factoryCostEstimate: 0,
    paymentTerms: "NET_30" as const,
    deliveryDate: "",
  });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api("/auth/me").then(async (u) => {
      setMe(u);
      setRfqs(await api("/api/rfqs"));
      if (u.role === "COMPANY") setSalesmen(await api("/api/salesmen"));
    });
  }, []);

  const subtotal = quoteForm.quantity * quoteForm.unitPrice;
  const vat = Math.round(subtotal * 0.15 * 100) / 100;
  const total = Math.round((subtotal + vat) * 100) / 100;
  const margin = Math.round((subtotal - quoteForm.factoryCostEstimate) * 100) / 100;

  return (
    <div>
      <PageHead title={t.rfqs} subtitle={t.rfqsSub} />
      {me?.role === "COMPANY" && (
        <form
          className="surface-slab mt-6 grid gap-4 rounded-2xl p-6 md:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            await api("/api/rfqs", { method: "POST", body: JSON.stringify(form) });
            setMsg(t.sendRfq);
            setRfqs(await api("/api/rfqs"));
          }}
        >
          <Field label={t.selectSupplier} hint={t.selectSupplierHint}>
            <select className="field" required value={form.salesmanId} onChange={(e) => setForm({ ...form, salesmanId: e.target.value })}>
              <option value="">{t.selectSupplier}</option>
              {salesmen.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.displayName} · {s.match}% match · {t.trust} {s.trustScore}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.rfqTitle} hint={t.rfqTitleHint}>
            <input className="field" required placeholder="Rebar B500B 16mm — 40 tons" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label={t.specialtyLabel} hint={t.specialtyHint}>
            <select className="field" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })}>
              {["rebar", "plate", "coil", "beam", "pipe", "fabrication"].map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.destinationCity} hint={t.destinationHint}>
            <input className="field" required value={form.destinationCity} onChange={(e) => setForm({ ...form, destinationCity: e.target.value })} />
          </Field>
          <Field label={t.quantityLabel} hint={t.quantityHint}>
            <div className="flex gap-2">
              <input type="number" min={0.01} step="0.01" className="field" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
              <select className="field w-28" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                <option value="ton">ton</option>
                <option value="pcs">pcs</option>
                <option value="kg">kg</option>
              </select>
            </div>
          </Field>
          <Field label={t.neededBy} hint={t.neededByHint}>
            <input type="date" className="field" value={form.neededBy} onChange={(e) => setForm({ ...form, neededBy: e.target.value })} />
          </Field>
          <div className="md:col-span-2">
            <Field label={t.productSpecs} hint={t.productSpecsHint}>
              <textarea className="field min-h-[90px]" required placeholder="Grade, diameter, mill certs, length, coating…" value={form.specs} onChange={(e) => setForm({ ...form, specs: e.target.value })} />
            </Field>
          </div>
          <button className="btn-molten md:col-span-2">{t.sendRfq}</button>
        </form>
      )}
      {me?.role === "SALESMAN" && (
        <form
          className="surface-slab mt-6 grid gap-4 rounded-2xl p-6 md:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const created = await api("/api/quotes", {
              method: "POST",
              body: JSON.stringify({
                rfqId: quoteForm.rfqId,
                factoryCostEstimate: quoteForm.factoryCostEstimate,
                paymentTerms: quoteForm.paymentTerms,
                deliveryDate: quoteForm.deliveryDate || undefined,
                lines: [{ product: quoteForm.product, quantity: quoteForm.quantity, unitPrice: quoteForm.unitPrice }],
              }),
            });
            setMsg(`${t.sendQuote} · ${created.total} SAR`);
          }}
        >
          <div className="md:col-span-2 text-sm text-muted-foreground">{t.sendQuoteHint}</div>
          <Field label={t.selectRfq} hint={t.selectRfqHint}>
            <select className="field" required value={quoteForm.rfqId} onChange={(e) => setQuoteForm({ ...quoteForm, rfqId: e.target.value })}>
              <option value="">{t.selectRfq}</option>
              {rfqs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} · {r.company?.legalName}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.productLine} hint={t.productLineHint}>
            <input className="field" required placeholder="Rebar B500B 16mm" value={quoteForm.product} onChange={(e) => setQuoteForm({ ...quoteForm, product: e.target.value })} />
          </Field>
          <Field label={t.quantityLabel} hint={t.qtySameAsRfq}>
            <input type="number" min={0.01} step="0.01" className="field" value={quoteForm.quantity} onChange={(e) => setQuoteForm({ ...quoteForm, quantity: Number(e.target.value) })} />
          </Field>
          <Field label={t.unitPriceLabel} hint={t.unitPriceHint}>
            <input type="number" min={0} step="0.01" className="field" value={quoteForm.unitPrice} onChange={(e) => setQuoteForm({ ...quoteForm, unitPrice: Number(e.target.value) })} />
          </Field>
          <Field label={t.factoryCostLabel} hint={t.factoryPrivate}>
            <input type="number" min={0} step="0.01" className="field border-primary/40 bg-primary/5" value={quoteForm.factoryCostEstimate} onChange={(e) => setQuoteForm({ ...quoteForm, factoryCostEstimate: Number(e.target.value) })} />
          </Field>
          <Field label={t.terms} hint={t.termsHint}>
            <select className="field" value={quoteForm.paymentTerms} onChange={(e) => setQuoteForm({ ...quoteForm, paymentTerms: e.target.value as typeof quoteForm.paymentTerms })}>
              <option value="ADVANCE_50">Advance 50%</option>
              <option value="NET_15">Net 15</option>
              <option value="NET_30">Net 30</option>
              <option value="NET_45">Net 45</option>
              <option value="COD">COD</option>
            </select>
          </Field>
          <Field label={t.delivery} hint={t.deliveryHint}>
            <input type="date" className="field" value={quoteForm.deliveryDate} onChange={(e) => setQuoteForm({ ...quoteForm, deliveryDate: e.target.value })} />
          </Field>
          <div className="surface-extrude md:col-span-2 rounded-xl p-4 text-sm">
            <div className="flex justify-between">
              <span>{t.subtotal}</span>
              <span>{subtotal.toLocaleString()} SAR</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>VAT 15%</span>
              <span>{vat.toLocaleString()} SAR</span>
            </div>
            <div className="mt-2 flex justify-between font-semibold text-molten">
              <span>{t.amount} ({t.companySees})</span>
              <span>{total.toLocaleString()} SAR</span>
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>{t.margin} — {t.private}</span>
              <span>{margin.toLocaleString()} SAR</span>
            </div>
          </div>
          <button className="btn-molten md:col-span-2">{t.sendQuote}</button>
        </form>
      )}
      {msg && <p className="mt-3 text-molten">{msg}</p>}
      <ul className="mt-8 space-y-3">
        {rfqs.map((r) => (
          <li key={r.id} className="uplift surface-slab rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-medium">{r.title}</div>
              <StatusBadge status={r.status} />
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {r.company?.legalName} → {r.salesman?.displayName}
              {r.quantity != null && ` · ${r.quantity} ${r.unit || ""}`}
              {r.destinationCity && ` · ${r.destinationCity}`}
            </div>
            {r.specs && <p className="mt-2 text-sm text-muted-foreground">{r.specs}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
