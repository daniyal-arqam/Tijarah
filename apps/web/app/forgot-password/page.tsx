"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useI18n } from "@/components/Providers";
import { BrandMark } from "@/components/marketing/BrandMark";

function Form() {
  const { t } = useI18n();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [step, setStep] = useState<"ask" | "reset">("ask");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    const q = params.get("token");
    if (q) {
      setToken(q);
      setStep("reset");
    }
  }, [params]);

  async function requestLink(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      const data = (await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      })) as { ok: boolean; resetToken?: string };
      if (data.resetToken) setToken(data.resetToken);
      setStep("reset");
      setMsg(t.resetSent);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Failed");
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!token) {
      setErr("Reset link expired. Request a new one.");
      return;
    }
    try {
      await api("/auth/reset-password", { method: "POST", body: JSON.stringify({ password, token }) });
      setMsg("Password updated. You can sign in.");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Failed");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md">
        <BrandMark />
        <form onSubmit={step === "ask" ? requestLink : savePassword} className="surface-slab mt-8 rounded-2xl p-8">
          <h1 className="font-display text-3xl font-bold">{t.resetTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{step === "ask" ? t.resetBody : t.resetSent}</p>
          {step === "ask" ? (
            <>
              <label className="mt-6 block text-sm text-muted-foreground">{t.email}</label>
              <input className="field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              <button className="btn-molten mt-6 w-full py-3">{t.sendReset}</button>
            </>
          ) : (
            <>
              <label className="mt-6 block text-sm text-muted-foreground">{t.newPassword}</label>
              <input className="field" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              <button className="btn-molten mt-6 w-full py-3">{t.savePassword}</button>
            </>
          )}
          {msg && step !== "ask" && <p className="mt-3 text-sm text-success">{msg}</p>}
          {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
          <p className="mt-5 text-center text-sm">
            <Link href="/login" className="text-primary">
              {t.backSignIn}
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

export default function ForgotPassword() {
  return (
    <Suspense>
      <Form />
    </Suspense>
  );
}
