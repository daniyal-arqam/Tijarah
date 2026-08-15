"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { api } from "@/lib/api";

function Form() {
  const router = useRouter();
  const roleParam = useSearchParams().get("role");
  const [role, setRole] = useState<"SALESMAN" | "COMPANY">(roleParam === "COMPANY" ? "COMPANY" : "SALESMAN");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");

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
    <div className="grid min-h-screen place-items-center bg-ink px-4">
      <form onSubmit={onSubmit} className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#16181f] p-8">
        <h1 className="text-3xl font-semibold text-white">Create account</h1>
        <p className="mt-1 text-sm text-zinc-400">Pick your side of the trade.</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {(["SALESMAN", "COMPANY"] as const).map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setRole(r)}
              className={`rounded-xl border p-4 text-left ${
                role === r ? "border-copper text-copper" : "border-zinc-700 text-zinc-300"
              }`}
            >
              <div className="font-medium">{r === "SALESMAN" ? "Salesman / وسيط" : "Company / شركة"}</div>
              <div className="text-xs text-zinc-500">{r === "SALESMAN" ? "Sell / broker metal" : "Buy metal products"}</div>
            </button>
          ))}
        </div>
        <input className="mt-4 w-full rounded-lg border border-zinc-700 bg-ink px-3 py-2 text-white" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="mt-3 w-full rounded-lg border border-zinc-700 bg-ink px-3 py-2 text-white" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="mt-3 w-full rounded-lg border border-zinc-700 bg-ink px-3 py-2 text-white" type="password" placeholder="Password (8+, A-Z, number, symbol)" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input className="mt-3 w-full rounded-lg border border-zinc-700 bg-ink px-3 py-2 text-white" type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
        <button className="mt-6 w-full rounded-lg bg-copper py-3 font-medium text-black">Create account</button>
        <p className="mt-4 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="text-copper">
            Sign in
          </Link>
        </p>
      </form>
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
