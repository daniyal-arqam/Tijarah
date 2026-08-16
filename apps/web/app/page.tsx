"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { useI18n } from "@/components/Providers";

export default function Landing() {
  const { t } = useI18n();
  const sides = [
    {
      title: t.forSalesmen,
      body: t.forSalesmenBody,
      points: [t.leads, t.quotes, `${t.trust} & ${t.reviews}`],
      tone: "primary",
    },
    {
      title: t.forCompanies,
      body: t.forCompaniesBody,
      points: [t.forCompanies, t.quotes, t.orders],
      tone: "accent",
    },
    {
      title: t.whyTijarah,
      body: t.whyBody,
      points: [t.heroBadge, t.reviews, t.quotes],
      tone: "success",
    },
  ];
  const steps = [
    { title: t.stepMatch, body: t.stepMatchBody },
    { title: t.stepQuote, body: t.stepQuoteBody },
    { title: t.stepDeliver, body: t.stepDeliverBody },
  ];

  return (
    <div className="min-h-screen tone-glow">
      <SiteHeader />
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 py-20 lg:grid-cols-[1.05fr_1fr] lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {t.heroBadge}
            </span>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] sm:text-6xl">
              {t.heroTitle1}
              <span className="block text-molten">{t.heroTitle2}</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">{t.heroBody}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/signup" className="btn-molten h-11 px-5">
                {t.getStarted}
              </Link>
              <Link href="/how-it-works" className="btn-steel h-11 px-5">
                {t.seeHow}
              </Link>
            </div>
            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6">
              {[
                ["1,240", t.statAccounts],
                ["18.4M", t.statQuoted],
                ["96%", t.statOnTime],
              ].map(([n, l]) => (
                <div key={l}>
                  <dt className="font-display text-2xl font-bold">{n}</dt>
                  <dd className="text-xs uppercase tracking-wider text-muted-foreground">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative">
            <div className="absolute -inset-8 rounded-[2rem] bg-primary/15 blur-3xl" />
            <div className="surface-slab relative overflow-hidden rounded-2xl p-2">
              <img src="/hero-coil.jpg" alt="Steel coils in a mill warehouse" width={1440} height={1080} className="pic-zoom h-full w-full rounded-xl object-cover" />
            </div>
            <div className="uplift surface-extrude absolute -bottom-5 start-4 hidden w-56 rounded-xl p-4 sm:block">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{t.liveQuote}</div>
              <div className="mt-1 font-display text-xl font-bold">240,000 SAR</div>
              <div className="mt-1 text-xs text-success">{t.accepted}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="font-display text-3xl font-bold sm:text-4xl">{t.bothSides}</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">{t.bothSidesBody}</p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {sides.map((s) => (
            <article key={s.title} className="uplift surface-slab rounded-2xl p-7">
              <span
                className={`grid size-12 place-items-center rounded-xl border text-lg ${
                  s.tone === "primary"
                    ? "border-primary/25 bg-primary/12 text-primary"
                    : s.tone === "accent"
                      ? "border-accent/25 bg-accent/12 text-accent"
                      : "border-success/25 bg-success/12 text-success"
                }`}
              >
                ◆
              </span>
              <h3 className="mt-5 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2.5 text-sm text-muted-foreground">{s.body}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {s.points.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border/70 bg-card/30">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">{t.threeSteps}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="uplift surface-extrude rounded-2xl p-7">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-molten font-display font-bold text-black">
                    {i + 1}
                  </span>
                  <span className="font-mono-ui text-3xl font-bold text-muted-foreground/40">0{i + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="surface-slab sheen relative overflow-hidden rounded-3xl px-8 py-14 text-center">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">{t.ctaTitle}</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{t.ctaBody}</p>
            <Link href="/signup" className="btn-molten mt-8 h-11 px-6">
              {t.getStarted}
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
