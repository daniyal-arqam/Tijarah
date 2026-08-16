"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/components/Providers";
import { BrandMark } from "./BrandMark";

export function SiteHeader() {
  const { t, locale, setLocale, dark, setDark } = useI18n();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const nav = [
    { href: "/", label: t.home },
    { href: "/how-it-works", label: t.howItWorks },
    { href: "/pricing", label: t.pricing },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <BrandMark />
        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`text-sm transition-colors hover:text-foreground ${
                path === n.href ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <button
            className="uplift grid size-9 place-items-center rounded-md hover:bg-muted"
            aria-label="Toggle theme"
            onClick={() => setDark(!dark)}
          >
            {dark ? "☀" : "☾"}
          </button>
          <button
            className="uplift rounded-md px-3 py-1.5 text-xs hover:bg-muted"
            onClick={() => setLocale(locale === "en" ? "ar" : "en")}
          >
            {t.lang}
          </button>
          <Link href="/login" className="uplift rounded-md px-4 py-2 text-sm hover:bg-muted">
            {t.login}
          </Link>
          <Link href="/signup" className="btn-molten h-9">
            {t.signup}
          </Link>
        </div>
        <button className="uplift grid size-9 place-items-center rounded-md border border-border md:hidden" onClick={() => setOpen(!open)}>
          ☰
        </button>
      </div>
      {open && (
        <div className="space-y-2 border-t border-border px-5 py-4 md:hidden">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="block py-2 text-sm" onClick={() => setOpen(false)}>
              {n.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-2">
            <button className="uplift rounded-md border border-border px-3 py-1 text-xs" onClick={() => setLocale(locale === "en" ? "ar" : "en")}>
              {t.lang}
            </button>
            <Link href="/login" className="uplift rounded-md px-3 py-1.5 text-sm hover:bg-muted">
              {t.login}
            </Link>
            <Link href="/signup" className="btn-molten h-8 text-xs">
              {t.signup}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
