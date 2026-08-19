"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHead } from "@/components/PageHead";
import { useI18n } from "@/components/Providers";
import { Avatar, Stars } from "@/components/ui";

type Salesman = {
  id: string;
  displayName: string;
  match: number;
  trustScore: number;
  slug: string;
  bio?: string | null;
  photoUrl?: string | null;
  yearsExperience?: number;
  cities?: string[];
  specialties?: string[];
  rating?: number;
  reviewCount?: number;
};

function pretty(s: string) {
  return s.replaceAll("_", " ");
}

export default function SuppliersPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Salesman[]>([]);
  useEffect(() => {
    api("/api/salesmen").then(setRows).catch(() => setRows([]));
  }, []);
  return (
    <div>
      <PageHead title={t.suppliers} subtitle={t.forCompaniesBody} />
      <div className="mt-7 grid gap-4 md:grid-cols-2">
        {rows.map((s) => (
          <article key={s.id} className="uplift surface-slab rounded-xl p-5">
            <div className="flex gap-4">
              <Avatar name={s.displayName} src={s.photoUrl} />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <h3 className="font-display font-semibold">{s.displayName}</h3>
                  <span className="shrink-0 text-xs text-primary">
                    {s.match}% · {t.trust} {s.trustScore}/10
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Stars value={s.rating || 0} />
                  <span>
                    {s.reviewCount ?? 0} {t.reviews}
                    {s.yearsExperience ? ` · ${s.yearsExperience}y` : ""}
                  </span>
                </div>
              </div>
            </div>
            {s.bio && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{s.bio}</p>}
            <div className="mt-3 flex flex-wrap gap-1">
              {(s.cities ?? []).slice(0, 3).map((c) => (
                <span key={c} className="rounded border border-border px-2 py-0.5 text-xs">
                  {c}
                </span>
              ))}
              {(s.specialties ?? []).slice(0, 3).map((c) => (
                <span key={c} className="rounded border border-border px-2 py-0.5 text-xs capitalize">
                  {pretty(c)}
                </span>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Link href={`/p/${s.slug}`} className="btn-steel flex-1 text-center text-sm">
                {t.profile}
              </Link>
              <Link href="/app/rfqs" className="btn-molten flex-1 text-center text-sm">
                {t.rfqs}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
