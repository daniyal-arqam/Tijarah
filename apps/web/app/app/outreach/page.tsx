"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHead } from "@/components/PageHead";
import { useI18n } from "@/components/Providers";
import { Field, Icon, StatusBadge } from "@/components/ui";

const TEMPLATES = [
  {
    id: "intro",
    name: "Product Introduction",
    subject: "Mill-direct supply for {company_name}",
    body: "Hello {contact_name},\n\nI can cover {company_name} on rebar, plate and coil with mill certs on every lot. Open my Tijarah profile to see my desk, trust score and reviews.",
  },
  {
    id: "deal",
    name: "New Deal Alert",
    subject: "Allocation just released — {company_name}",
    body: "We just secured an allocation of plate this month for {company_name}. Happy to walk the spec from my Tijarah profile.",
  },
  {
    id: "follow",
    name: "Follow-up",
    subject: "Following up — {company_name}",
    body: "Following our last note — I've held tonnage for {company_name}. Happy to walk the spec on a call.",
  },
];

type Company = { id: string; legalName: string; city?: string; contactName?: string };
type Proposal = {
  id: string;
  subject: string;
  status: string;
  sentAt: string;
  openedAt?: string | null;
  followUpDue?: boolean;
  companyName?: string;
  profileUrl?: string;
  sellPrice?: number | null;
  profit?: number | null;
  factoryCost?: number | null;
};

export default function OutreachPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<"compose" | "tracking">("compose");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [tpl, setTpl] = useState(TEMPLATES[0]);
  const [picked, setPicked] = useState<string[]>([]);
  const [subject, setSubject] = useState(TEMPLATES[0].subject);
  const [body, setBody] = useState(TEMPLATES[0].body);
  const [rows, setRows] = useState<Proposal[]>([]);
  const [mill, setMill] = useState("our mill");
  const [msg, setMsg] = useState("");

  async function load() {
    const [cos, props, me] = await Promise.all([
      api("/api/companies").catch(() => []),
      api("/api/proposals").catch(() => []),
      api("/api/me").catch(() => null),
    ]);
    setCompanies(cos);
    setRows(props);
    const name = me?.salesman?.factory?.legalName;
    if (name) setMill(name);
  }

  useEffect(() => {
    load();
  }, []);

  function choose(next: (typeof TEMPLATES)[0]) {
    setTpl(next);
    setSubject(next.subject);
    setBody(next.body);
  }

  const first = companies.find((c) => picked.includes(c.id)) ?? companies[0];
  const vars: Record<string, string> = {
    company_name: first?.legalName || "company",
    contact_name: first?.contactName || "there",
    mill_name: mill,
  };
  function fill(s: string) {
    return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
  }

  const sent = rows.length;
  const opened = rows.filter((p) => p.openedAt || p.status === "OPENED" || p.status === "SELECTED").length;
  const openRate = sent ? Math.round((opened / sent) * 100) : 0;

  async function send() {
    await api("/api/proposals", {
      method: "POST",
      body: JSON.stringify({
        companyIds: picked,
        subject: fill(subject),
        body: fill(body),
      }),
    });
    setMsg(t.proposalSent);
    setPicked([]);
    setTab("tracking");
    await load();
  }

  const preview = `${fill(subject)}\n\n${fill(body)}\n\n${t.publicLink}`;

  return (
    <div>
      <PageHead title={t.outreach} subtitle={t.sendProposalHint} />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="uplift surface-slab rounded-2xl p-5">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.emailsSent}</div>
          <div className="mt-2 font-display text-3xl font-bold">{sent}</div>
        </div>
        <div className="uplift surface-slab rounded-2xl p-5">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.openRate}</div>
          <div className="mt-2 font-display text-3xl font-bold">{openRate}%</div>
        </div>
        <div className="uplift surface-slab rounded-2xl p-5">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.followUpDue}</div>
          <div className="mt-2 font-display text-3xl font-bold">{rows.filter((p) => p.followUpDue).length}</div>
        </div>
      </div>

      <div className="mt-6 inline-flex rounded-full border border-border bg-muted/40 p-1">
        {(["compose", "tracking"] as const).map((x) => (
          <button
            key={x}
            className={`rounded-full px-4 py-1.5 text-sm uplift ${tab === x ? "bg-foreground text-background" : "text-muted-foreground"}`}
            onClick={() => setTab(x)}
          >
            {x === "compose" ? t.compose : t.tracking}
          </button>
        ))}
      </div>

      {tab === "compose" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="space-y-4">
            <div className="surface-slab rounded-2xl p-3">
              <div className="px-2 pb-2 text-xs uppercase tracking-widest text-muted-foreground">{t.templates}</div>
              {TEMPLATES.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => choose(x)}
                  className={`uplift mb-1 w-full rounded-xl px-3 py-2.5 text-start text-sm ${tpl.id === x.id ? "ring-1 ring-molten" : "hover:bg-muted/50"}`}
                >
                  {x.name}
                </button>
              ))}
            </div>
            <div className="surface-slab rounded-2xl p-3">
              <div className="px-2 pb-2 text-xs uppercase tracking-widest text-muted-foreground">
                {t.recipients} ({picked.length})
              </div>
              <div className="max-h-72 overflow-y-auto">
                {companies.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted/40">
                    <input
                      type="checkbox"
                      className="accent-orange-500"
                      checked={picked.includes(c.id)}
                      onChange={() => setPicked((p) => (p.includes(c.id) ? p.filter((x) => x !== c.id) : [...p, c.id]))}
                    />
                    {c.legalName}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="surface-slab rounded-2xl p-6">
            <Field label={t.subject}>
              <input className="field" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </Field>
            <Field label={t.message}>
              <textarea className="field min-h-[160px]" value={body} onChange={(e) => setBody(e.target.value)} />
            </Field>
            <div className="mt-4 rounded-xl bg-muted/40 p-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{t.preview}</div>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-muted-foreground">{preview}</pre>
            </div>
            <div className="mt-5 flex justify-end">
              <button className="btn-molten" type="button" disabled={!picked.length} onClick={send}>
                <Icon name="plane" className="size-4" /> {t.sendProposal}
              </button>
            </div>
            {msg && <p className="mt-3 text-sm text-success">{msg}</p>}
          </div>
        </div>
      ) : (
        <div className="surface-slab mt-6 overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="p-4">{t.subject}</th>
                <th>{t.company}</th>
                <th>{t.yourRate}</th>
                <th>{t.yourProfit}</th>
                <th>{t.status}</th>
                <th>{t.opened}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-muted-foreground">
                    {t.trackingEmpty}
                  </td>
                </tr>
              )}
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="p-4">{c.subject}</td>
                  <td>{c.companyName}</td>
                  <td>{c.sellPrice != null ? `${c.sellPrice.toLocaleString()} SAR` : "—"}</td>
                  <td>{c.profit != null ? `${c.profit.toLocaleString()} SAR` : "—"}</td>
                  <td>
                    <StatusBadge status={c.followUpDue ? "FOLLOW_UP" : c.status} />
                  </td>
                  <td>{c.openedAt ? new Date(c.openedAt).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
