"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { useI18n } from "@/components/Providers";

export default function HowItWorks() {
  const { t } = useI18n();
  const steps = [
    [t.how1, t.how1b],
    [t.how2, t.how2b],
    [t.how3, t.how3b],
    [t.how4, t.how4b],
    [t.how5, t.how5b],
    [t.how6, t.how6b],
  ];
  return (
    <div className="min-h-screen tone-glow">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-20">
        <h1 className="font-display text-4xl font-bold sm:text-5xl">{t.howTitle}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t.howIntro}</p>
        <ol className="mt-12 space-y-8">
          {steps.map(([title, body], i) => (
            <li key={title} className="uplift surface-slab rounded-2xl p-6">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                STEP 0{i + 1}
              </div>
              <h2 className="mt-2 font-display text-2xl font-bold">{title}</h2>
              <p className="mt-2 text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
        <Link href="/signup" className="btn-molten mt-10 inline-flex h-11 px-6">
          {t.createAccount}
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
