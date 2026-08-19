"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { useI18n } from "@/components/Providers";
import { Avatar, Stars } from "@/components/ui";

type Review = {
  body: string;
  quality: number;
  deliverySpeed: number;
  professionalism: number;
  wouldOrderAgain: boolean;
  createdAt: string;
  from?: "COMPANY" | "FACTORY";
};

type Profile = {
  displayName: string;
  bio?: string;
  title?: string;
  languages?: string[];
  certifications?: string;
  coverageNotes?: string;
  trustScore: number;
  yearsExperience: number;
  cities: string[];
  specialties: string[];
  waNumber?: string;
  photoUrl?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  millVerified?: boolean;
  verifiedDocs?: string[];
  reviewCount: number;
  rating: number;
  avgQuality: number;
  avgSpeed: number;
  avgProfessionalism: number;
  reviews: Review[];
};

function pretty(s: string) {
  return s.replaceAll("_", " ");
}

export default function PublicProfile() {
  const { t } = useI18n();
  const { slug } = useParams<{ slug: string }>();
  const [s, setS] = useState<Profile | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    fetch(`/public/salesmen/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setS)
      .catch(() => setMissing(true));
  }, [slug]);

  if (missing) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <p className="p-8 text-muted-foreground">{t.notFound}</p>
      </div>
    );
  }

  if (!s) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <p className="p-8 text-muted-foreground">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-xs uppercase tracking-widest text-primary">{t.metalSalesman}</p>

        <section className="surface-slab mt-4 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Avatar name={s.displayName} src={s.photoUrl} size="lg" />
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-4xl font-bold">{s.displayName}</h1>
              {s.title && <p className="mt-1 text-muted-foreground">{s.title}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                <Stars value={s.rating || 0} />
                <span className="text-muted-foreground">
                  {s.rating ? s.rating.toFixed(1) : "—"} · {s.reviewCount} {t.reviews}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {s.emailVerified && <span className="rounded-full bg-muted px-3 py-1 text-xs">{t.emailVerifiedBadge}</span>}
                {s.phoneVerified && <span className="rounded-full bg-muted px-3 py-1 text-xs">{t.phoneVerifiedBadge}</span>}
                {(s.verifiedDocs ?? []).map((d) => (
                  <span key={d} className="rounded-full bg-muted px-3 py-1 text-xs">
                    {d} {t.verified}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              {s.waNumber && (
                <a className="btn-molten h-11 px-5 text-center" href={`https://wa.me/${s.waNumber}`}>
                  {t.whatsapp}
                </a>
              )}
            </div>
          </div>

          <dl className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border p-4">
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">{t.trust}</dt>
              <dd className="mt-1 font-display text-3xl font-bold text-molten">{s.trustScore}/10</dd>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-molten" style={{ width: `${s.trustScore * 10}%` }} />
              </div>
            </div>
            <div className="rounded-xl border border-border p-4">
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">{t.yearsExp}</dt>
              <dd className="mt-1 font-display text-3xl font-bold">{s.yearsExperience}</dd>
              <p className="mt-1 text-xs text-muted-foreground">{t.yearsOnDesk}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">{t.rating}</dt>
              <dd className="mt-1 font-display text-3xl font-bold">{s.rating ? s.rating.toFixed(1) : "—"}</dd>
              <p className="mt-1 text-xs text-muted-foreground">
                {t.quality} {s.avgQuality || "—"} · {t.speed} {s.avgSpeed || "—"} · {t.professionalism} {s.avgProfessionalism || "—"}
              </p>
            </div>
          </dl>
        </section>

        {s.bio && (
          <section className="surface-slab mt-5 rounded-2xl p-6">
            <h2 className="font-display text-xl font-semibold">{t.about}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{s.bio}</p>
            {s.coverageNotes && <p className="mt-3 text-sm text-muted-foreground">{s.coverageNotes}</p>}
            {s.certifications && <p className="mt-2 text-sm">{s.certifications}</p>}
            {s.languages?.length ? (
              <p className="mt-2 text-xs text-muted-foreground">{s.languages.join(" · ")}</p>
            ) : null}
          </section>
        )}

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <section className="surface-slab rounded-2xl p-6">
            <h2 className="font-display text-xl font-semibold">{t.coverage}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {s.cities.length ? (
                s.cities.map((c) => (
                  <span key={c} className="rounded-full border border-border px-3 py-1 text-sm">
                    {c}
                  </span>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </div>
          </section>
          <section className="surface-slab rounded-2xl p-6">
            <h2 className="font-display text-xl font-semibold">{t.specialties}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {s.specialties.length ? (
                s.specialties.map((x) => (
                  <span key={x} className="rounded-full border border-border px-3 py-1 text-sm capitalize">
                    {pretty(x)}
                  </span>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </div>
          </section>
        </div>

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">{t.reviews}</h2>
          {s.reviews.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">{t.noReviews}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {s.reviews.map((r, i) => (
                <li key={i} className="uplift surface-slab rounded-xl p-5">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <Stars value={(r.quality + r.deliverySpeed + r.professionalism) / 3} />
                    <span className="text-xs text-muted-foreground">{r.from === "FACTORY" ? t.fromFactory : t.fromCompany}</span>
                    {r.wouldOrderAgain && <span className="text-xs text-molten">{t.wouldOrderAgain}</span>}
                  </div>
                  <p className="mt-3">{r.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t.quality} {r.quality}/5 · {t.speed} {r.deliverySpeed}/5 · {t.professionalism} {r.professionalism}/5
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
