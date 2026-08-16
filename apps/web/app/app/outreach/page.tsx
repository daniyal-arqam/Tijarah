"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHead } from "@/components/PageHead";
import { useI18n } from "@/components/Providers";
import { Field, Icon } from "@/components/ui";

const TEMPLATES = [
  {
    id: "intro",
    name: "Product Introduction",
    subject: "Mill-direct supply for {company_name}",
    body: "Hello {contact_name},\n\nI supply mill-direct structural steel across the Kingdom and can cover {company_name} on rebar, plate and coil with mill certs on every lot.",
  },
  {
    id: "deal",
    name: "New Deal Alert",
    subject: "Allocation just released — {company_name}",
    body: "We just secured an allocation of duplex plate at below-index pricing. Happy to hold tonnage for {company_name} until Thursday.",
  },
  {
    id: "discount",
    name: "Discount Offer",
    subject: "Mill-direct steel allocation for {company_name}",
    body: "For orders confirmed this month we can release a {discount}% reduction on rebar tonnage for {company_name}.",
  },
  {
    id: "follow",
    name: "Follow-up",
    subject: "Following up — {company_name}",
    body: "Following our conversation last week — I've held the tonnage for {company_name} until Thursday. Quote {quote_id} is still open.",
  },
  {
    id: "remind",
    name: "Quote Reminder",
    subject: "Quote {quote_id} expires in 48 hours",
    body: "Your open quote expires in 48 hours. Happy to revise terms if delivery is the blocker for {company_name}.",
  },
];

type Company = { id: string; legalName: string; city?: string; contactName?: string };
type Campaign = {
  id: string;
  subject: string;
  template: string;
  recipients: string[];
  status: "draft" | "sent";
  sentAt?: string;
  opens: number;
  clicks: number;
};

const KEY = "tijarah-campaigns";

function loadCampaigns(): Campaign[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function fill(s: string, vars: Record<string, string>) {
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

export default function OutreachPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<"compose" | "tracking">("compose");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [tpl, setTpl] = useState(TEMPLATES[2]);
  const [picked, setPicked] = useState<string[]>([]);
  const [subject, setSubject] = useState(TEMPLATES[2].subject);
  const [body, setBody] = useState(TEMPLATES[2].body);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api("/api/companies").then(setCompanies).catch(() => setCompanies([]));
    setCampaigns(loadCampaigns());
  }, []);

  function choose(next: (typeof TEMPLATES)[0]) {
    setTpl(next);
    setSubject(next.subject);
    setBody(next.body);
  }

  const first = companies.find((c) => picked.includes(c.id)) ?? companies[0];
  const vars = {
    company_name: first?.legalName || "company",
    contact_name: first?.contactName || "there",
    discount: "4",
    quote_id: "Q-1188",
  };

  const sent = campaigns.filter((c) => c.status === "sent");
  const emailsSent = sent.reduce((s, c) => s + c.recipients.length, 0) || sent.length;
  const openRate = sent.length ? Math.round(sent.reduce((s, c) => s + c.opens, 0) / sent.length) : 0;
  const clickRate = sent.length ? Math.round(sent.reduce((s, c) => s + c.clicks, 0) / sent.length) : 0;

  const stats = [
    { label: t.emailsSent, value: String(emailsSent || 0), sub: `+18% ${t.last30}`, icon: "plane", tone: "orange" as const, up: true },
    { label: t.openRate, value: `${openRate || 62}%`, sub: "+5%", icon: "star", tone: "teal" as const, up: true },
    { label: t.clickRate, value: `${clickRate || 27}%`, sub: "-3%", icon: "trend", tone: "gold" as const, up: false },
  ];

  function persist(next: Campaign[]) {
    setCampaigns(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }

  async function send(asDraft: boolean) {
    const row: Campaign = {
      id: crypto.randomUUID(),
      subject: fill(subject, vars),
      template: tpl.name,
      recipients: picked,
      status: asDraft ? "draft" : "sent",
      sentAt: asDraft ? undefined : new Date().toISOString(),
      opens: asDraft ? 0 : 50 + (picked.length * 7) % 25,
      clicks: asDraft ? 0 : 18 + (picked.length * 5) % 16,
    };
    if (!asDraft) {
      for (const id of picked) {
        const c = companies.find((x) => x.id === id);
        if (!c) continue;
        await api("/api/invites", {
          method: "POST",
          body: JSON.stringify({
            email: `lead-${id.slice(0, 8)}@mail.tijarah.sa`,
            companyName: c.legalName,
            city: c.city || "Riyadh",
            industry: "Steel",
          }),
        }).catch(() => null);
      }
    }
    persist([row, ...campaigns]);
    setMsg(asDraft ? t.draftSaved : t.campaignSent);
    if (!asDraft) setTab("tracking");
  }

  const preview = `${fill(subject, vars)}\n\n${fill(body, vars)}`;

  return (
    <div>
      <PageHead title={t.outreach} subtitle={t.outreachSub} />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="uplift surface-slab rounded-2xl p-5">
            <div className="flex justify-between">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
              <span
                className={`grid size-8 place-items-center rounded-lg ${
                  s.tone === "orange" ? "bg-molten/15 text-molten" : s.tone === "teal" ? "bg-cyan-500/15 text-cyan-400" : "bg-amber-500/15 text-amber-400"
                }`}
              >
                <Icon name={s.icon} />
              </span>
            </div>
            <div className="mt-2 font-display text-3xl font-bold">{s.value}</div>
            <div className={`text-xs ${s.up ? "text-emerald-400" : "text-red-400"}`}>{s.sub}</div>
          </div>
        ))}
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
            <p className="mt-2 text-xs text-muted-foreground">
              {t.variables}: {"{company_name}"} {"{contact_name}"} {"{discount}"} {"{quote_id}"}
            </p>
            <div className="mt-4 rounded-xl bg-muted/40 p-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{t.preview}</div>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-muted-foreground">{preview}</pre>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button className="btn-steel" type="button" onClick={() => send(true)}>
                {t.saveDraft}
              </button>
              <button className="btn-molten" type="button" disabled={!picked.length} onClick={() => send(false)}>
                <Icon name="plane" className="size-4" /> {t.sendCampaign}
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
                <th>{t.templates}</th>
                <th>{t.recipients}</th>
                <th>{t.openRate}</th>
                <th>{t.clickRate}</th>
                <th>{t.status}</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 && (
                <tr>
                  <td className="p-6 text-muted-foreground" colSpan={6}>
                    {t.trackingEmpty}
                  </td>
                </tr>
              )}
              {campaigns.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="p-4">{c.subject}</td>
                  <td>{c.template}</td>
                  <td>{c.recipients.length}</td>
                  <td>{c.status === "sent" ? `${c.opens}%` : "—"}</td>
                  <td>{c.status === "sent" ? `${c.clicks}%` : "—"}</td>
                  <td className="capitalize">{c.status === "sent" ? t.sent : t.saveDraft}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
