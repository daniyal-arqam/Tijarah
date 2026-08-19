"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHead } from "@/components/PageHead";
import { useI18n } from "@/components/Providers";
import { Avatar, StatusBadge } from "@/components/ui";

type Proposal = {
  id: string;
  subject: string;
  body: string;
  status: string;
  sentAt: string;
  sellPrice?: number | null;
  readyBy?: string | null;
  rfqTitle?: string;
  profileUrl: string;
  salesman: {
    id: string;
    displayName: string;
    slug: string;
    photoUrl?: string | null;
    title?: string | null;
    trustScore: number;
    yearsExperience?: number;
  };
};

export default function InboxPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Proposal[]>([]);
  const [open, setOpen] = useState<Proposal | null>(null);
  const [msg, setMsg] = useState("");

  async function load() {
    setRows(await api("/api/proposals"));
  }

  useEffect(() => {
    load();
  }, []);

  async function openRow(p: Proposal) {
    setOpen(p);
    await api(`/api/proposals/${p.id}/open`, { method: "POST" }).catch(() => null);
  }

  const best = rows.find((p) => p.status !== "DECLINED" && p.sellPrice != null);

  return (
    <div>
      <PageHead title={t.inbox} subtitle={t.inboxSub} />
      {msg && <p className="mt-3 text-sm text-molten">{msg}</p>}
      <ul className="mt-6 space-y-3">
        {rows.length === 0 && <li className="text-sm text-muted-foreground">{t.noProposals}</li>}
        {rows.map((p) => (
          <li key={p.id} className="uplift surface-slab rounded-2xl p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <Avatar name={p.salesman.displayName} src={p.salesman.photoUrl} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display font-semibold">{p.salesman.displayName}</h3>
                  <StatusBadge status={p.status} />
                  <span className="text-xs text-molten">
                    {t.trust} {p.salesman.trustScore}/10
                  </span>
                  {best?.id === p.id && p.status !== "SELECTED" && (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400">{t.bestPick}</span>
                  )}
                </div>
                {p.salesman.title && <p className="text-xs text-muted-foreground">{p.salesman.title}</p>}
                <p className="mt-2 font-medium">{p.subject}</p>
                {p.rfqTitle && <p className="text-xs text-muted-foreground">{p.rfqTitle}</p>}
                {p.sellPrice != null && (
                  <p className="mt-1 font-display text-xl font-bold text-molten">{p.sellPrice.toLocaleString()} SAR</p>
                )}
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.body}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="btn-steel h-9 px-3 text-xs" onClick={() => openRow(p)}>
                    {t.view}
                  </button>
                  <Link href={`/p/${p.salesman.slug}`} className="btn-steel h-9 px-3 text-xs">
                    {t.profile}
                  </Link>
                  {p.status !== "SELECTED" && p.status !== "DECLINED" && (
                    <button
                      className="btn-molten h-9 px-3 text-xs"
                      onClick={async () => {
                        await api(`/api/proposals/${p.id}/select`, { method: "POST" });
                        setMsg(`${t.selected}: ${p.salesman.displayName}`);
                        await load();
                      }}
                    >
                      {t.selectSalesman}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4" onClick={() => setOpen(null)}>
          <div className="surface-slab max-w-lg rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl font-bold">{open.subject}</h2>
            {open.sellPrice != null && <p className="mt-2 text-molten">{open.sellPrice.toLocaleString()} SAR</p>}
            <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-muted-foreground">{open.body}</pre>
            <Link href={`/p/${open.salesman.slug}`} className="mt-4 inline-block text-sm text-primary">
              {t.publicLink}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
