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
  }, [locale, dark]);

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
