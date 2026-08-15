"use client";

import Link from "next/link";
import { useI18n } from "@/components/Providers";

export default function Landing() {
  const { t, locale, setLocale, dark, setDark } = useI18n();
  return (
    <div className="min-h-screen bg-ink text-zinc-100">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="text-2xl font-semibold text-copper">Tijarah</div>
        <div className="flex items-center gap-3 text-sm">
          <button onClick={() => setLocale(locale === "en" ? "ar" : "en")}>EN | ع</button>
          <button onClick={() => setDark(!dark)}>{dark ? "Light" : "Dark"}</button>
          <Link href="/login" className="rounded-md bg-copper px-4 py-2 font-medium text-black">
            {t.login}
          </Link>
        </div>
      </header>
      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center">
        <div>
          <div className="text-5xl font-semibold">TIJARAH</div>
          <div className="mt-1 text-2xl text-copper">تجارة</div>
          <p className="mt-6 text-xl text-zinc-300">{t.tagline}</p>
          <p className="mt-3 max-w-md text-zinc-400">
            Public trust profile. Private factory cost. Company only sees the offer.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup?role=SALESMAN" className="rounded-md bg-copper px-5 py-3 font-medium text-black">
              {t.sell}
            </Link>
            <Link href="/signup?role=COMPANY" className="rounded-md border border-zinc-500 px-5 py-3">
              {t.buy}
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-700 bg-[#16181f] p-6 shadow-glow">
          <div className="text-xs uppercase tracking-widest text-zinc-500">Quotation · Q-1042</div>
          <div className="mt-4 text-lg">Sheet metal tanks × 12</div>
          <div className="mt-6 flex items-end justify-between">
            <div>
              <div className="text-xs text-zinc-500">Total</div>
              <div className="text-3xl font-semibold text-copper">18,000 SAR</div>
            </div>
            <div className="rounded-lg border border-copper/40 bg-copper/10 px-3 py-2 text-xs text-copper">
              Factory cost locked
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
