"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHead } from "@/components/PageHead";
import { useI18n } from "@/components/Providers";
import { Avatar } from "@/components/ui";

type Row = {
  id: string;
  displayName: string;
  slug: string;
  photoUrl?: string | null;
  title?: string | null;
  trustScore: number;
  orders: number;
};

export default function TeamPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    api("/api/dashboard")
      .then((d) => setRows((d.salesmen ?? []) as Row[]))
      .catch(() => setRows([]));
  }, []);

  return (
    <div>
      <PageHead title={t.linkedSalesmen} subtitle={t.teamSub} />
      <ul className="mt-6 space-y-3">
        {rows.map((s) => (
          <li key={s.id} className="uplift surface-slab flex items-center gap-4 rounded-2xl p-5">
            <Avatar name={s.displayName} src={s.photoUrl} />
            <div className="min-w-0 flex-1">
              <Link href={`/p/${s.slug}`} className="font-display font-semibold hover:text-molten">
                {s.displayName}
              </Link>
              <div className="text-xs text-muted-foreground">
                {s.title} · {t.trust} {s.trustScore}/10 · {s.orders} {t.orders}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
