"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHead } from "@/components/PageHead";
import { useI18n } from "@/components/Providers";
import { Field, StatusBadge } from "@/components/ui";

type Estimate = {
  id: string;
  status: string;
  amount?: number | null;
  readyBy?: string | null;
  factory?: { id: string; legalName: string } | null;
};
type ProposalRow = { id: string; status: string; sellPrice?: number | null; salesman: { displayName: string; trustScore: number } };
type Rfq = {
  id: string;
  title: string;
  status: string;
  specialty?: string;
  quantity?: number;
  unit?: string;
  destinationCity?: string;
  specs?: string;
  customize?: boolean;
  company?: { legalName: string };
  estimates?: Estimate[];
  proposals?: ProposalRow[];
  proposalCount?: number;
};
type Factory = { id: string; legalName: string };

export default function RfqsPage() {
  const { t } = useI18n();
  const [me, setMe] = useState<{ role: string } | null>(null);
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [form, setForm] = useState({
    title: "",
    specialty: "rebar",
    specs: "",
    quantity: 1,
    unit: "ton",
    destinationCity: "Riyadh",
    neededBy: "",
    customize: false,
  });
  const [pickMill, setPickMill] = useState<Record<string, string>>({});
  const [sell, setSell] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState("");

  async function load() {
    setRfqs(await api("/api/rfqs"));
  }

  useEffect(() => {
    api("/auth/me").then(async (u) => {
      setMe(u);
      setRfqs(await api("/api/rfqs"));
      if (u.role === "SALESMAN") setFactories(await api("/api/factories").catch(() => []));
    });
  }, []);

  return (
    <div>
      <PageHead title={me?.role === "COMPANY" ? t.listNeed : t.openNeeds} subtitle={t.rfqsSub} />
      {me?.role === "COMPANY" && (
        <form
          className="surface-slab mt-6 grid gap-4 rounded-2xl p-6 md:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            await api("/api/rfqs", { method: "POST", body: JSON.stringify(form) });
            setMsg(t.needListed);
            await load();
          }}
        >
          <Field label={t.rfqTitle} hint={t.rfqTitleHint}>
            <input className="field" required placeholder="Rebar B500B 16mm — 40 tons" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label={t.buyOrCustomize}>
            <select className="field" value={form.customize ? "custom" : "buy"} onChange={(e) => setForm({ ...form, customize: e.target.value === "custom" })}>
              <option value="buy">{t.buyReady}</option>
              <option value="custom">{t.customizeProduct}</option>
            </select>
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
          <button className="btn-molten md:col-span-2">{t.listNeed}</button>
        </form>
      )}
      {msg && <p className="mt-3 text-molten">{msg}</p>}
      <ul className="mt-8 space-y-4">
        {rfqs.map((r) => {
          const quoted = (r.estimates ?? []).filter((e) => e.status === "QUOTED" || e.status === "ACCEPTED");
          const ranked = [...quoted].sort((a, b) => (a.amount ?? 1e15) - (b.amount ?? 1e15) || new Date(a.readyBy || 0).getTime() - new Date(b.readyBy || 0).getTime());
          const millCost = ranked[0]?.amount ?? 0;
          const sellPrice = sell[r.id] ?? (millCost ? millCost + 100 : 0);
          return (
            <li key={r.id} className="uplift surface-slab rounded-xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{r.title}</div>
                <div className="flex gap-2">
                  {r.customize && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400">{t.customizeProduct}</span>}
                  <StatusBadge status={r.status} />
                </div>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {me?.role === "COMPANY" ? `${r.proposalCount ?? r.proposals?.length ?? 0} ${t.proposals}` : r.company?.legalName}
                {r.quantity != null && ` · ${r.quantity} ${r.unit || ""}`}
                {r.destinationCity && ` · ${r.destinationCity}`}
              </div>
              {r.specs && <p className="mt-2 text-sm text-muted-foreground">{r.specs}</p>}

              {me?.role === "COMPANY" && (r.proposals?.length ?? 0) > 0 && (
                <ul className="mt-4 space-y-2 text-sm">
                  {r.proposals!.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2">
                      <span>
                        {p.salesman.displayName} · {t.trust} {p.salesman.trustScore}/10
                      </span>
                      <span className="font-medium text-molten">{p.sellPrice?.toLocaleString()} SAR</span>
                    </li>
                  ))}
                </ul>
              )}

              {me?.role === "SALESMAN" && (
                <div className="mt-4 space-y-3 border-t border-border pt-4">
                  <div className="flex flex-wrap gap-2">
                    <select className="field mt-0 max-w-xs" value={pickMill[r.id] ?? ""} onChange={(e) => setPickMill((m) => ({ ...m, [r.id]: e.target.value }))}>
                      <option value="">{t.pickFactory}</option>
                      {factories.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.legalName}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn-steel h-10 px-3 text-xs"
                      onClick={async () => {
                        if (!pickMill[r.id]) return;
                        await api("/api/estimates", { method: "POST", body: JSON.stringify({ rfqId: r.id, factoryId: pickMill[r.id] }) });
                        setMsg(t.estimateRequested);
                        await load();
                      }}
                    >
                      {t.requestEstimate}
                    </button>
                  </div>
                  {ranked.length > 0 && (
                    <ul className="space-y-2 text-sm">
                      {ranked.map((e, i) => (
                        <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2">
                          <span>
                            {e.factory?.legalName} · {e.amount?.toLocaleString()} SAR · {e.readyBy ? e.readyBy.slice(0, 10) : "—"}
                            {i === 0 && <span className="ms-2 text-xs text-emerald-400">{t.bestMill}</span>}
                          </span>
                          {e.status !== "ACCEPTED" && (
                            <button
                              className="text-xs text-primary"
                              onClick={async () => {
                                await api(`/api/estimates/${e.id}/accept`, { method: "POST" });
                                await load();
                              }}
                            >
                              {t.pickFactory}
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex flex-wrap items-end gap-2">
                    <Field label={t.yourRate}>
                      <input
                        type="number"
                        min={0}
                        className="field mt-0 w-36"
                        value={sellPrice}
                        onChange={(e) => setSell((s) => ({ ...s, [r.id]: Number(e.target.value) }))}
                      />
                    </Field>
                    {millCost > 0 && (
                      <div className="pb-2 text-xs text-muted-foreground">
                        {t.factoryCost} {millCost.toLocaleString()} · {t.yourProfit} {(sellPrice - millCost).toLocaleString()} SAR
                      </div>
                    )}
                    <button
                      className="btn-molten h-10 px-3 text-xs"
                      onClick={async () => {
                        await api("/api/proposals", {
                          method: "POST",
                          body: JSON.stringify({
                            rfqId: r.id,
                            sellPrice,
                            factoryCost: millCost || undefined,
                            subject: `${r.title} — ${sellPrice} SAR`,
                            body: `I will ready this order and deliver to ${r.destinationCity} at ${sellPrice} SAR.`,
                          }),
                        });
                        setMsg(t.proposalSent);
                      }}
                    >
                      {t.sendProposal}
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
