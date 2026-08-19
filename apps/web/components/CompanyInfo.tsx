"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui";
import { useI18n } from "@/components/Providers";

export type FactoryInfo = {
  id: string;
  legalName: string;
  tradeName?: string | null;
  city?: string | null;
  crNumber?: string | null;
  vatNumber?: string | null;
  phone?: string | null;
  address?: string | null;
  about?: string | null;
  specialties?: string[];
  capacityTons?: number;
  verified?: boolean;
};

export type SalesmanCard = {
  id: string;
  displayName: string;
  slug: string;
  photoUrl?: string | null;
  bio?: string | null;
  title?: string | null;
  yearsExperience?: number;
  cities?: string[];
  specialties?: string[];
  trustScore: number;
};

function pretty(s: string) {
  return s.replaceAll("_", " ");
}

export function CompanyInfoPanel({
  factory,
  teammates,
  onClose,
}: {
  factory: FactoryInfo;
  teammates: SalesmanCard[];
  onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="surface-slab max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">{t.companyInfo}</p>
            <h2 className="mt-1 font-display text-2xl font-bold">{factory.legalName}</h2>
            {factory.tradeName && <p className="text-sm text-muted-foreground">{factory.tradeName}</p>}
          </div>
          <button className="btn-steel h-9 px-3 text-sm" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {factory.verified && <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-400">{t.millVerified}</span>}
          {factory.city && <span className="rounded-full border border-border px-3 py-1 text-xs">{factory.city}</span>}
          {factory.crNumber && (
            <span className="rounded-full border border-border px-3 py-1 text-xs">
              CR {factory.crNumber}
            </span>
          )}
          {factory.capacityTons ? (
            <span className="rounded-full border border-border px-3 py-1 text-xs">{factory.capacityTons.toLocaleString()} t capacity</span>
          ) : null}
        </div>
        {factory.about && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{factory.about}</p>}
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          {factory.address && (
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">{t.millAddress}</dt>
              <dd>{factory.address}</dd>
            </div>
          )}
          {factory.phone && (
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">{t.millPhone}</dt>
              <dd>{factory.phone}</dd>
            </div>
          )}
          {factory.vatNumber && (
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">VAT</dt>
              <dd>{factory.vatNumber}</dd>
            </div>
          )}
        </dl>
        <div className="mt-3 flex flex-wrap gap-1">
          {(factory.specialties ?? []).map((s) => (
            <span key={s} className="rounded border border-border px-2 py-0.5 text-xs capitalize">
              {pretty(s)}
            </span>
          ))}
        </div>
        <h3 className="mt-8 font-display text-lg font-semibold">{t.linkedSalesmen}</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {teammates.map((s) => (
            <Link key={s.id} href={`/p/${s.slug}`} className="uplift surface-extrude rounded-xl p-4">
              <div className="flex gap-3">
                <Avatar name={s.displayName} src={s.photoUrl} />
                <div className="min-w-0">
                  <div className="font-medium">{s.displayName}</div>
                  <div className="text-xs text-muted-foreground">{s.title || t.metalSalesman}</div>
                  <div className="mt-1 text-xs text-molten">
                    {t.trust} {s.trustScore}/10
                  </div>
                </div>
              </div>
              {s.bio && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{s.bio}</p>}
              <div className="mt-2 flex flex-wrap gap-1">
                {(s.cities ?? []).slice(0, 3).map((c) => (
                  <span key={c} className="rounded border border-border px-1.5 py-0.5 text-[10px]">
                    {c}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
