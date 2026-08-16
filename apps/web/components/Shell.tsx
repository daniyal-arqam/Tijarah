"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api, type Me } from "@/lib/api";
import { useI18n } from "./Providers";
import { BrandMark } from "./marketing/BrandMark";
import { Avatar, Icon } from "./ui";

const SALES_NAV = [
  { href: "/app", key: "dashboard" as const, icon: "dash" },
  { href: "/app/leads", key: "leads" as const, icon: "leads" },
  { href: "/app/outreach", key: "outreach" as const, icon: "mail" },
  { href: "/app/rfqs", key: "rfqs" as const, icon: "quote" },
  { href: "/app/quotes", key: "quotes" as const, icon: "quote" },
  { href: "/app/orders", key: "orders" as const, icon: "order" },
  { href: "/app/invoices", key: "invoices" as const, icon: "invoice" },
  { href: "/app/reviews", key: "reviews" as const, icon: "star" },
  { href: "/app/profile", key: "profile" as const, icon: "user" },
];

const COMPANY_NAV = [
  { href: "/app", key: "dashboard" as const, icon: "dash" },
  { href: "/app/suppliers", key: "suppliers" as const, icon: "leads" },
  { href: "/app/rfqs", key: "rfqs" as const, icon: "quote" },
  { href: "/app/quotes", key: "quotes" as const, icon: "quote" },
  { href: "/app/orders", key: "orders" as const, icon: "order" },
  { href: "/app/invoices", key: "invoices" as const, icon: "invoice" },
  { href: "/app/reviews", key: "reviews" as const, icon: "star" },
  { href: "/app/profile", key: "profile" as const, icon: "user" },
];

const ADMIN_NAV = SALES_NAV.filter((n) => n.href !== "/app/outreach");

export function Shell({ children }: { children: React.ReactNode }) {
  const { t, locale, setLocale, dark, setDark } = useI18n();
  const path = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [q, setQ] = useState("");
  const [notes, setNotes] = useState<{ title: string; meta: string }[]>([]);
  const [openNotes, setOpenNotes] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    api("/auth/me")
      .then(setMe)
      .catch(() => router.replace("/login"));
  }, [router]);

  useEffect(() => {
    Promise.all([api("/api/quotes").catch(() => []), api("/api/orders").catch(() => [])]).then(([quotes, orders]) => {
      const n = [
        ...quotes.slice(0, 3).map((x: { status: string; id: string }) => ({
          title: `Quote ${x.id.slice(0, 8)} · ${x.status}`,
          meta: t.quotes,
        })),
        ...orders.slice(0, 3).map((x: { status: string; id: string }) => ({
          title: `Order ${x.id.slice(0, 8)} · ${x.status}`,
          meta: t.orders,
        })),
      ];
      setNotes(n);
    });
  }, [t.quotes, t.orders]);

  const items = useMemo(() => {
    if (!me) return [];
    if (me.role === "COMPANY") return COMPANY_NAV;
    if (me.role === "ADMIN") return ADMIN_NAV;
    return SALES_NAV;
  }, [me]);

  if (!me) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">{t.loading}</div>;
  }

  const name = me.salesman?.displayName || me.company?.legalName || me.email;
  const photo = me.salesman?.photoUrl || me.company?.logoUrl;

  function searchGo(e: React.FormEvent) {
    e.preventDefault();
    const s = q.trim().toLowerCase();
    if (!s) return;
    if (s.includes("quote")) router.push("/app/quotes");
    else if (s.includes("order")) router.push("/app/orders");
    else if (s.includes("lead") || s.includes("compan")) router.push("/app/leads");
    else if (s.includes("rfq")) router.push("/app/rfqs");
    else if (s.includes("review")) router.push("/app/reviews");
    else router.push("/app/quotes");
  }

  return (
    <div className="min-h-screen bg-background text-foreground lg:ps-[260px]">
      <aside
        className={`fixed inset-y-0 start-0 z-50 flex w-[260px] flex-col border-e border-border bg-card/90 backdrop-blur-xl transition-transform lg:translate-x-0 ${menu ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-16 items-center border-b border-border px-5">
          <BrandMark href="/app" />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((n) => {
            const active = n.href === "/app" ? path === "/app" : path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMenu(false)}
                className={`uplift flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                  active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <Icon name={n.icon} className={`size-4 ${active ? "text-molten" : ""}`} />
                {t[n.key]}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <Link href="/app/profile" className="uplift flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50">
            <Avatar name={name} src={photo} size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{name}</span>
              <span className="block text-xs capitalize text-muted-foreground">{me.role.toLowerCase()}</span>
            </span>
          </Link>
        </div>
      </aside>
      {menu && <div className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden" onClick={() => setMenu(false)} />}

      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl sm:px-6">
        <button className="uplift lg:hidden" onClick={() => setMenu(true)} aria-label="Open menu">
          ☰
        </button>
        <form onSubmit={searchGo} className="relative hidden h-10 max-w-md flex-1 items-center md:flex">
          <span className="pointer-events-none absolute start-3 z-10 text-muted-foreground">
            <Icon name="search" className="size-4" />
          </span>
          <input
            className="field mt-0 h-10 w-full"
            style={{ paddingInlineStart: "2.5rem" }}
            placeholder={t.searchPlaceholder}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </form>
        <div className="ms-auto flex items-center gap-2">
          <button className="uplift grid size-9 place-items-center rounded-md hover:bg-muted" onClick={() => setDark(!dark)} aria-label="Theme">
            {dark ? <Icon name="sun" /> : <Icon name="moon" />}
          </button>
          <button className="uplift flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs hover:bg-muted" onClick={() => setLocale(locale === "en" ? "ar" : "en")}>
            <Icon name="globe" className="size-3.5" />
            {t.lang}
          </button>
          <div className="relative">
            <button className="uplift relative grid size-9 place-items-center rounded-md hover:bg-muted" onClick={() => setOpenNotes(!openNotes)}>
              <Icon name="bell" />
              {notes.length > 0 && (
                <span className="absolute -end-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-molten px-1 text-[10px] font-bold text-black">
                  {notes.length}
                </span>
              )}
            </button>
            {openNotes && (
              <ul className="surface-slab absolute end-0 z-40 mt-2 w-80 overflow-hidden rounded-xl">
                {notes.length === 0 && <li className="px-4 py-3 text-sm text-muted-foreground">—</li>}
                {notes.map((n, i) => (
                  <li key={i} className="border-b border-border/60 px-4 py-3 last:border-0">
                    <div className="text-sm">{n.title}</div>
                    <div className="text-xs text-muted-foreground">{n.meta}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {me.role === "SALESMAN" && (
            <Link href="/app/leads" className="btn-molten hidden h-9 px-3 text-xs sm:inline-flex">
              {t.findLeads}
            </Link>
          )}
          <button
            className="uplift rounded-md px-2 py-1 text-xs text-muted-foreground"
            onClick={async () => {
              await api("/auth/logout", { method: "POST" });
              router.replace("/login");
            }}
          >
            {t.logout}
          </button>
        </div>
      </header>
      <main className="tone-glow min-h-[calc(100vh-4rem)] px-4 py-7 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
