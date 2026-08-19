"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/components/Providers";
import { BrandMark } from "@/components/marketing/BrandMark";

function Form() {
  const { t } = useI18n();
  const router = useRouter();
  const search = useSearchParams();
  const roleParam = search.get("role");
  const googleFlow = search.get("google") === "1";
  const [role, setRole] = useState<"SALESMAN" | "COMPANY" | "FACTORY">(
    roleParam === "COMPANY" ? "COMPANY" : roleParam === "FACTORY" ? "FACTORY" : "SALESMAN",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [googleEmail, setGoogleEmail] = useState("");

  useEffect(() => {
    if (!googleFlow) return;
    api("/auth/google/pending")
      .then((d: { email: string; name: string }) => {
        setGoogleEmail(d.email);
        setEmail(d.email);
        if (d.name) setName(d.name);
      })
      .catch((ex: unknown) => setErr(ex instanceof Error ? ex.message : t.googleError));
  }, [googleFlow, t.googleError]);

  const checks = [
    [t.pwRule1, password.length >= 8],
    [t.pwRule2, /[A-Z]/.test(password)],
    [t.pwRule3, /[0-9]/.test(password)],
    [t.pwRule4, /[^A-Za-z0-9]/.test(password)],
  ] as const;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      if (googleFlow) {
        await api("/auth/google/complete", { method: "POST", body: JSON.stringify({ role, name }) });
      } else {
        if (password !== confirm) {
          setErr("Passwords do not match");
          return;
        }
        await api("/auth/signup", { method: "POST", body: JSON.stringify({ email, password, role, name }) });
      }
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
          <p className="mt-1 text-sm text-muted-foreground">{googleFlow ? t.googlePickRole : t.pickSide}</p>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(["SALESMAN", "COMPANY", "FACTORY"] as const).map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRole(r)}
                className={`uplift rounded-xl border p-4 text-left ${
                  role === r ? "border-molten text-molten" : "border-border text-muted-foreground"
                }`}
              >
                <div className="font-medium">{r === "SALESMAN" ? t.salesman : r === "FACTORY" ? t.factoryRole : t.companyRole}</div>
                <div className="text-xs">{r === "SALESMAN" ? t.salesmanHint : r === "FACTORY" ? t.factoryHint : t.companyHint}</div>
              </button>
            ))}
          </div>
          <label className="mt-5 block text-sm text-muted-foreground">{t.fullName}</label>
          <input className="field" required value={name} onChange={(e) => setName(e.target.value)} />
          {googleFlow ? (
            <>
              <label className="mt-3 block text-sm text-muted-foreground">{t.email}</label>
              <input className="field" type="email" readOnly value={googleEmail || email} />
            </>
          ) : (
            <>
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
            </>
          )}
          {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
          <button className="btn-molten mt-6 w-full py-3">{googleFlow ? t.googleFinish : t.createAccount}</button>
          {!googleFlow && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                {t.or}
                <span className="h-px flex-1 bg-border" />
              </div>
              <a href={`/auth/google?role=${role}`} className="btn-steel w-full py-3">
                {t.google}
              </a>
            </>
          )}
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
