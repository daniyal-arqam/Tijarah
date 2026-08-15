"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, type Me } from "@/lib/api";
import { useI18n } from "./Providers";

const NAV = [
  { href: "/app", key: "dashboard" as const },
  { href: "/app/leads", key: "leads" as const, roles: ["SALESMAN"] },
  { href: "/app/rfqs", key: "rfqs" as const },
  { href: "/app/quotes", key: "quotes" as const },
  { href: "/app/orders", key: "orders" as const },
  { href: "/app/invoices", key: "invoices" as const },
  { href: "/app/reviews", key: "reviews" as const },
  { href: "/app/profile", key: "profile" as const },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const { t, locale, setLocale, dark, setDark } = useI18n();
  const path = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    api("/auth/me")
      .then(setMe)
      .catch(() => router.replace("/login"));
  }, [router]);

  if (!me) {
    return <div className="grid min-h-screen place-items-center text-zinc-500">Loading…</div>;
  }

  const items = NAV.filter((n) => !n.roles || n.roles.includes(me.role));

  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-zinc-100">
      <aside className="fixed inset-y-0 start-0 z-20 hidden w-60 flex-col border-e border-zinc-800 bg-[#0c0d11] text-zinc-300 md:flex">
        <div className="px-5 py-6">
          <div className="text-xl font-semibold tracking-wide text-copper">TIJARAH</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Metal supply</div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {items.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`block rounded-lg px-3 py-2 text-sm ${
                path === n.href ? "bg-zinc-800 text-white" : "hover:bg-zinc-900"
              }`}
            >
              {t[n.key]}
            </Link>
          ))}
        </nav>
        <div className="border-t border-zinc-800 p-4 text-sm">
          <div className="font-medium text-white">{me.salesman?.displayName || me.company?.legalName || me.email}</div>
          <div className="text-xs text-zinc-500">{me.role}</div>
        </div>
      </aside>

      <div className="md:ps-60">
        <header className="sticky top-0 z-10 flex items-center justify-end gap-2 border-b border-zinc-200 bg-paper/80 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-ink/80">
          <button
            className="rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700"
            onClick={() => setLocale(locale === "en" ? "ar" : "en")}
          >
            EN | ع
          </button>
          <button
            className="rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700"
            onClick={() => setDark(!dark)}
          >
            {dark ? "Light" : "Dark"}
          </button>
          <button
            className="rounded-md px-2 py-1 text-xs text-zinc-500"
            onClick={async () => {
              await api("/auth/logout", { method: "POST" });
              router.replace("/login");
            }}
          >
            Logout
          </button>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-zinc-800 bg-[#0c0d11] py-2 text-[10px] uppercase tracking-wide text-zinc-400 md:hidden">
        {items.slice(0, 4).map((n) => (
          <Link key={n.href} href={n.href} className={path === n.href ? "text-copper" : ""}>
            {t[n.key]}
          </Link>
        ))}
      </nav>
    </div>
  );
}
