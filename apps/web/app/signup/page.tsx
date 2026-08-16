"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/components/Providers";
import { BrandMark } from "@/components/marketing/BrandMark";

function Form() {
  const { t } = useI18n();
  const router = useRouter();
  const roleParam = useSearchParams().get("role");
  const [role, setRole] = useState<"SALESMAN" | "COMPANY">(roleParam === "COMPANY" ? "COMPANY" : "SALESMAN");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [googleMsg, setGoogleMsg] = useState("");

  const checks = [
    [t.pwRule1, password.length >= 8],
    [t.pwRule2, /[A-Z]/.test(password)],
    [t.pwRule3, /[0-9]/.test(password)],
    [t.pwRule4, /[^A-Za-z0-9]/.test(password)],
  ] as const;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (password !== confirm) {
      setErr("Passwords do not match");
      return;
    }
    try {
      await api("/auth/signup", { method: "POST", body: JSON.stringify({ email, password, role, name }) });
      router.push("/app");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Failed");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-lg">
        <BrandMark />
        <form onSubmit={onSubmit} className="surface-slab mt-8 rounded-2xl p-8">
          <h1 className="font-display text-3xl font-bold">{t.createAccount}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.pickSide}</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {(["SALESMAN", "COMPANY"] as const).map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRole(r)}
                className={`uplift rounded-xl border p-4 text-left ${
                  role === r ? "border-molten text-molten" : "border-border text-muted-foreground"
                }`}
              >
                <div className="font-medium">{r === "SALESMAN" ? t.salesman : t.companyRole}</div>
                <div className="text-xs">{r === "SALESMAN" ? t.salesmanHint : t.companyHint}</div>
              </button>
            ))}
          </div>
          <label className="mt-5 block text-sm text-muted-foreground">{t.fullName}</label>
          <input className="field" required value={name} onChange={(e) => setName(e.target.value)} />
          <label className="mt-3 block text-sm text-muted-foreground">{t.email}</label>
          <input className="field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <label className="mt-3 block text-sm text-muted-foreground">{t.password}</label>
          <input className="field" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <ul className="mt-2 space-y-1 text-xs">
            {checks.map(([label, ok]) => (
              <li key={label} className={ok ? "text-success" : "text-muted-foreground"}>
                {ok ? "✓" : "○"} {label}
              </li>
            ))}
          </ul>
          <label className="mt-3 block text-sm text-muted-foreground">{t.confirmPassword}</label>
          <input className="field" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
          <button className="btn-molten mt-6 w-full py-3">{t.createAccount}</button>
          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t.or}
            <span className="h-px flex-1 bg-border" />
          </div>
          <button type="button" className="btn-steel w-full py-3" onClick={() => setGoogleMsg(t.googleHint)}>
            {t.google}
          </button>
          {googleMsg && <p className="mt-3 text-sm text-muted-foreground">{googleMsg}</p>}
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {t.already}{" "}
            <Link href="/login" className="text-primary">
              {t.login}
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

export default function SignupPage() {
  return (
    <Suspense>
      <Form />
    </Suspense>
  );
}
