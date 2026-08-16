"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/components/Providers";
import { BrandMark } from "@/components/marketing/BrandMark";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState("");
  const [googleMsg, setGoogleMsg] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("tijarah-email");
    if (saved) setEmail(saved);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      if (remember) localStorage.setItem("tijarah-email", email);
      else localStorage.removeItem("tijarah-email");
      await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      router.push("/app");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Failed");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md">
        <BrandMark />
        <form onSubmit={onSubmit} className="surface-slab mt-8 rounded-2xl p-8">
          <h1 className="font-display text-3xl font-bold">{t.welcome}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.workspace}</p>
          <label className="mt-6 block text-sm text-muted-foreground">{t.email}</label>
          <input className="field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <label className="mt-4 block text-sm text-muted-foreground">{t.password}</label>
          <input className="field" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="mt-4 flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-muted-foreground">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              {t.remember}
            </label>
            <Link href="/forgot-password" className="text-primary">
              {t.forgot}
            </Link>
          </div>
          {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
          <button className="btn-molten mt-6 w-full py-3">{t.login}</button>
          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t.or}
            <span className="h-px flex-1 bg-border" />
          </div>
          <button
            type="button"
            className="btn-steel w-full py-3"
            onClick={() => setGoogleMsg(t.googleHint)}
          >
            {t.google}
          </button>
          {googleMsg && <p className="mt-3 text-sm text-muted-foreground">{googleMsg}</p>}
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {t.newTo}{" "}
            <Link href="/signup" className="text-primary">
              {t.createAccount}
            </Link>
          </p>
        </form>
        <Link href="/" className="mt-6 block text-center text-sm text-muted-foreground">
          ← {t.backHome}
        </Link>
      </div>
    </div>
  );
}
