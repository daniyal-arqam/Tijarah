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
  notes?: string | null;
  rfq: { title: string; specs: string; quantity: number; unit: string; destinationCity: string };
  salesman: { displayName: string };
};

export default function EstimatesPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Estimate[]>([]);
  const [draft, setDraft] = useState<Record<string, { amount: number; readyBy: string }>>({});
  const [msg, setMsg] = useState("");

  async function load() {
    setRows(await api("/api/estimates"));
  }

  useEffect(() => {
    load().catch(() => setRows([]));
  }, []);

  return (
    <div>
      <PageHead title={t.estimates} subtitle={t.estimatesSub} />
      {msg && <p className="mt-3 text-sm text-molten">{msg}</p>}
      <ul className="mt-6 space-y-4">
        {rows.length === 0 && <li className="text-sm text-muted-foreground">{t.noEstimates}</li>}
        {rows.map((e) => (
          <li key={e.id} className="uplift surface-slab rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-display font-semibold">{e.rfq.title}</div>
                <div className="text-xs text-muted-foreground">
                  {e.salesman.displayName} · {e.rfq.quantity} {e.rfq.unit} · {e.rfq.destinationCity}
                </div>
              </div>
              <StatusBadge status={e.status} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{e.rfq.specs}</p>
            {e.status === "REQUESTED" ? (
              <form
                className="mt-4 grid gap-3 md:grid-cols-3"
                onSubmit={async (ev) => {
                  ev.preventDefault();
                  const d = draft[e.id] ?? { amount: 0, readyBy: "" };
                  await api(`/api/estimates/${e.id}`, { method: "PATCH", body: JSON.stringify(d) });
                  setMsg(t.saved);
                  await load();
                }}
              >
                <Field label={t.factoryCostLabel}>
                  <input
                    type="number"
                    min={0}
                    required
                    className="field"
                    value={draft[e.id]?.amount ?? ""}
                    onChange={(ev) => setDraft((x) => ({ ...x, [e.id]: { amount: Number(ev.target.value), readyBy: x[e.id]?.readyBy ?? "" } }))}
                  />
                </Field>
                <Field label={t.readyBy}>
                  <input
                    type="date"
                    className="field"
                    value={draft[e.id]?.readyBy ?? ""}
                    onChange={(ev) => setDraft((x) => ({ ...x, [e.id]: { amount: x[e.id]?.amount ?? 0, readyBy: ev.target.value } }))}
                  />
                </Field>
                <button className="btn-molten self-end">{t.sendEstimate}</button>
              </form>
            ) : (
              <div className="mt-3 text-sm">
                {e.amount != null && (
                  <span className="font-medium text-molten">{e.amount.toLocaleString()} SAR</span>
                )}
                {e.readyBy && <span className="ms-3 text-muted-foreground">{e.readyBy.slice(0, 10)}</span>}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
