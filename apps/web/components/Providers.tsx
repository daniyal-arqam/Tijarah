"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { dict, type Locale } from "@/lib/i18n";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  dark: boolean;
  setDark: (v: boolean) => void;
  t: (typeof dict)["en"];
};

const C = createContext<Ctx | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const l = localStorage.getItem("tijarah-locale") as Locale | null;
    const d = localStorage.getItem("tijarah-dark");
    if (l === "ar" || l === "en") setLocale(l);
    if (d === "0") setDark(false);
  }, []);

  useEffect(() => {
    localStorage.setItem("tijarah-locale", locale);
    localStorage.setItem("tijarah-dark", dark ? "1" : "0");
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.classList.toggle("light", !dark);
  }, [locale, dark]);

  useEffect(() => {
    const timers = new WeakMap<Element, number>();

    const target = (el: EventTarget | null) => {
      if (!(el instanceof Element)) return null;
      return el.closest("button, a.btn-molten, a.btn-steel");
    };

    const clear = (el: Element) => {
      const prev = timers.get(el);
      if (prev) window.clearTimeout(prev);
      el.classList.remove("is-working");
    };

    const onDown = (e: PointerEvent) => {
      const el = target(e.target);
      if (!el || (el instanceof HTMLButtonElement && el.disabled)) return;
      const prev = timers.get(el);
      if (prev) window.clearTimeout(prev);
      el.classList.add("is-working");
    };

    const onUp = (e: Event) => {
      const el = target(e.target);
      if (!el) return;
      const id = window.setTimeout(() => clear(el), 450);
      timers.set(el, id);
    };

    document.addEventListener("pointerdown", onDown);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return (
    <C.Provider value={{ locale, setLocale, dark, setDark, t: dict[locale] }}>
      {children}
    </C.Provider>
  );
}

export function useI18n() {
  const v = useContext(C);
  if (!v) throw new Error("Providers missing");
  return v;
}
