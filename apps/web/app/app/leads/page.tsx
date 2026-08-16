"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHead } from "@/components/PageHead";
import { useI18n } from "@/components/Providers";
import { Icon, Stars } from "@/components/ui";

type Company = {
  id: string;
  legalName: string;
  city?: string;
  industry?: string;
  size?: string;
  contactName?: string;
  phone?: string;
  _count?: { orders: number };
};

const BLURB: Record<string, string> = {
  Manufacturing: "Specialty alloy processor serving petrochemical maintenance contracts.",
  Steel: "Mill-direct structural steel for commercial and infrastructure programmes.",
  Construction: "Main contractor buying rebar, plate and fabricated assemblies this quarter.",
  Trading: "Regional trader covering coil, beam and pipe across GCC yards.",
};

function blurb(c: Company) {
  return BLURB[c.industry || ""] || `Buying ${c.industry || "metal"} products out of ${c.city || "KSA"} — matched to your coverage.`;
}

function matchPct(c: Company) {
  return 68 + (c.legalName.length + (c._count?.orders ?? 0) * 5) % 28;
}

function rating(c: Company) {
  return Math.min(5, 4 + ((c._count?.orders ?? 0) % 10) / 10);
}

export default function LeadsPage() {
  const { t } = useI18n();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState("all");
  const [city, setCity] = useState("all");
  const [sort, setSort] = useState<"match" | "rated" | "orders">("match");
  const [sortOpen, setSortOpen] = useState(false);
  const [open, setOpen] = useState<Company | null>(null);

  useEffect(() => {
    api("/api/companies").then(setCompanies).catch(() => setCompanies([]));
  }, []);

  const industries = useMemo(
    () => Array.from(new Set(companies.map((c) => c.industry).filter(Boolean))) as string[],
    [companies],
  );
  const cities = useMemo(
    () => Array.from(new Set(companies.map((c) => c.city).filter(Boolean))) as string[],
    [companies],
  );

  const rows = companies
    .filter((c) => c.legalName.toLowerCase().includes(q.toLowerCase()))
    .filter((c) => industry === "all" || c.industry === industry)
    .filter((c) => city === "all" || c.city === city)
    .slice()
    .sort((a, b) => {
      if (sort === "rated") return rating(b) - rating(a);
      if (sort === "orders") return (b._count?.orders ?? 0) - (a._count?.orders ?? 0);
      return matchPct(b) - matchPct(a);
    });

  const sortLabel = sort === "rated" ? t.highestRated : sort === "orders" ? t.mostOrders : t.bestMatch;

  return (
    <div>
      <PageHead title={t.leadDiscovery} subtitle={`${rows.length} ${t.matchedCompanies}`} />

      <div className="surface-slab mt-6 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <span className="pointer-events-none absolute start-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground">
              <Icon name="search" className="size-4" />
            </span>
            <input
              className="field mt-0 h-10"
              style={{ paddingInlineStart: "2.5rem" }}
              placeholder={t.searchCompanies}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select className="field mt-0 h-10 w-[160px]" value={industry} onChange={(e) => setIndustry(e.target.value)}>
            <option value="all">{t.allIndustries}</option>
            {industries.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
          <select className="field mt-0 h-10 w-[140px]" value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="all">{t.allCities}</option>
            {cities.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
          <div className="relative">
            <button type="button" className="btn-steel mt-0 h-10" onClick={() => setSortOpen(!sortOpen)}>
              {sortLabel} ▾
            </button>
            {sortOpen && (
              <ul className="surface-slab absolute end-0 z-20 mt-2 w-48 overflow-hidden rounded-xl py-1">
                {(
                  [
                    ["match", t.bestMatch],
                    ["rated", t.highestRated],
                    ["orders", t.mostOrders],
                  ] as const
                ).map(([k, label]) => (
                  <li key={k}>
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between px-3 py-2 text-start text-sm ${
                        sort === k ? "bg-cyan-600 text-white" : "hover:bg-muted/60"
                      }`}
                      onClick={() => {
                        setSort(k);
                        setSortOpen(false);
                      }}
                    >
                      {label}
                      {sort === k && <Icon name="check" className="size-4" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => {
            const pct = matchPct(c);
            const rate = rating(c);
            const orders = c._count?.orders ?? 0;
            const reviews = Math.max(3, Math.round(orders * 0.6) || 8);
            return (
              <article key={c.id} className="uplift card-flip rounded-xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-base font-semibold">{c.legalName}</h3>
                  <span className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-molten/70 text-xs font-bold text-molten">
                    {pct}%
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon name="pin" className="size-3.5" />
                  {c.city || "—"} · {c.industry || "—"} · {c.size || "—"}
                </p>
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{blurb(c)}</p>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <Stars value={rate} />
                  <span className="text-muted-foreground">
                    {rate.toFixed(1)} · {orders} {t.orders}
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="btn-steel flex-1 text-sm" onClick={() => setOpen(c)}>
                    {t.viewDetails}
                  </button>
                  <Link href="/app/outreach" className="btn-molten flex-1 text-center text-sm">
                    {t.contact}
                  </Link>
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon name="star" className="size-3.5 text-molten" />
                  {reviews} {t.reviews} · {orders > 2 ? t.activeThisMonth : t.lastMonths}
                </p>
              </article>
            );
          })}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4" onClick={() => setOpen(null)}>
          <div className="surface-slab max-w-lg rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl font-bold">{open.legalName}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{blurb(open)}</p>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">{t.fullName}</dt>
                <dd>{open.contactName || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">{t.orders}</dt>
                <dd>{open._count?.orders ?? 0}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">{t.allCities}</dt>
                <dd>{open.city || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">{t.allIndustries}</dt>
                <dd>{open.industry || "—"}</dd>
              </div>
            </dl>
            <Link href="/app/outreach" className="btn-molten mt-5 w-full">
              {t.contact}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
