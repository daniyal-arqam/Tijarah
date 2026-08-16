"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { useI18n } from "@/components/Providers";
import { Avatar, Stars } from "@/components/ui";

export default function PublicProfile() {
  const { t } = useI18n();
  const { slug } = useParams<{ slug: string }>();
  const [s, setS] = useState<{
    displayName: string;
    bio?: string;
    trustScore: number;
    cities: string[];
    specialties: string[];
    waNumber?: string;
    photoUrl?: string;
    reviews: { body: string; quality: number }[];
  } | null>(null);

  useEffect(() => {
    fetch(`/public/salesmen/${slug}`)
      .then((r) => r.json())
      .then(setS);
  }, [slug]);

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
      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="text-xs uppercase tracking-widest text-primary">Tijarah</div>
        <div className="mt-4 flex items-center gap-4">
          <Avatar name={s.displayName} src={s.photoUrl} size="lg" />
          <div>
            <h1 className="font-display text-4xl font-bold">{s.displayName}</h1>
            <Stars value={5} className="mt-1" />
          </div>
        </div>
        <p className="mt-2 text-muted-foreground">{s.bio}</p>
        <div className="mt-4 text-molten">
          {t.trust} {s.trustScore}/100
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {s.specialties.map((x) => (
            <span key={x} className="rounded border border-border px-2 py-1">
              {x}
            </span>
          ))}
        </div>
        {s.waNumber && (
          <a className="btn-steel mt-6 inline-block text-primary" href={`https://wa.me/${s.waNumber}`}>
            {t.whatsapp}
          </a>
        )}
        <h2 className="mt-10 font-display text-xl font-semibold">{t.reviews}</h2>
        <ul className="mt-4 space-y-3">
          {s.reviews.map((r, i) => (
            <li key={i} className="uplift surface-slab rounded-xl p-4">
              <div className="text-molten">{r.quality}/5</div>
              <p className="mt-1">{r.body}</p>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
