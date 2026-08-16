"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { useI18n } from "@/components/Providers";

export default function Pricing() {
  const { t } = useI18n();
  const plans = [
    {
      name: t.buyerPlan,
      price: t.buyerPrice,
      for: t.buyerFor,
      items: [t.forCompanies, t.quotes, t.orders, t.reviews],
    },
    {
      name: t.salesmanPlan,
      price: t.salesmanPrice,
      for: t.salesmanFor,
      popular: true,
      items: [t.leads, t.quotes, t.trust, t.dashboard],
    },
    {
      name: t.enterprise,
      price: t.talk,
      for: t.enterpriseFor,
      items: [t.company, t.dashboard, t.invoices, t.heroBadge],
    },
  ];
  return (
    <div className="min-h-screen tone-glow">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-20">
        <h1 className="font-display text-4xl font-bold sm:text-5xl">{t.pricingTitle}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{t.pricingSub}</p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <article
              key={p.name}
              className={`uplift surface-slab rounded-2xl p-7 ${p.popular ? "ring-1 ring-molten" : ""}`}
            >
              {p.popular && <div className="mb-3 text-xs font-medium text-molten">{t.popular}</div>}
              <h2 className="font-display text-2xl font-bold">{p.name}</h2>
              <div className="mt-2 text-3xl font-bold">{p.price}</div>
              <p className="mt-1 text-sm text-muted-foreground">{p.for}</p>
              <ul className="mt-6 space-y-2 text-sm">
                {p.items.map((i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary">✓</span>
                    {i}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn-molten mt-8 w-full">
                {t.getStarted}
              </Link>
            </article>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
