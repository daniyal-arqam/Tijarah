"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHead } from "@/components/PageHead";
import { useI18n } from "@/components/Providers";

type Salesman = { id: string; displayName: string; match: number; trustScore: number; slug: string };

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
            <div className="flex justify-between">
              <h3 className="font-display font-semibold">{s.displayName}</h3>
              <span className="text-xs text-primary">{s.match}% · {t.trust} {s.trustScore}</span>
            </div>
            <Link href={`/p/${s.slug}`} className="mt-3 inline-block text-sm text-primary">
              {t.profile}
            </Link>
            <Link href="/app/rfqs" className="btn-molten mt-4 w-full">
              {t.rfqs}
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
