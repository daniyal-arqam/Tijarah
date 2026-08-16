"use client";

import Link from "next/link";
import { useI18n } from "@/components/Providers";
import { BrandMark } from "./BrandMark";

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-border/70 bg-card/30">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <BrandMark />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">{t.footerBlurb}</p>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest">{t.platform}</div>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>
              <Link href="/how-it-works" className="hover:text-primary">
                {t.howItWorks}
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:text-primary">
                {t.pricing}
              </Link>
            </li>
            <li>
              <Link href="/signup" className="hover:text-primary">
                {t.signup}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest">{t.account}</div>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>
              <Link href="/login" className="hover:text-primary">
                {t.login}
              </Link>
            </li>
            <li>
              <Link href="/forgot-password" className="hover:text-primary">
                {t.resetPassword}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest">{t.company}</div>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-primary">
                {t.home}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/70 py-5 text-center text-xs text-muted-foreground">
        © 2026 Tijarah · تجارة. {t.rights}
      </div>
    </footer>
  );
}
