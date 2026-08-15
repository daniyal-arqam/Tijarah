"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/components/Providers";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("salesman@tijarah.sa");
  const [password, setPassword] = useState("Tijarah1!");
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      router.push("/app");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Failed");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-ink px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#16181f] p-8">
        <h1 className="text-3xl font-semibold text-white">{t.welcome}</h1>
        <p className="mt-1 text-sm text-zinc-400">{t.workspace}</p>
        <label className="mt-6 block text-sm text-zinc-400">Email</label>
        <input
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-ink px-3 py-2 text-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label className="mt-4 block text-sm text-zinc-400">Password</label>
        <input
          type="password"
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-ink px-3 py-2 text-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
        <button className="mt-6 w-full rounded-lg bg-copper py-3 font-medium text-black shadow-glow">{t.login}</button>
        <p className="mt-4 text-center text-sm text-zinc-500">
          New?{" "}
          <Link href="/signup" className="text-copper">
            {t.signup}
          </Link>
        </p>
      </form>
    </div>
  );
}
