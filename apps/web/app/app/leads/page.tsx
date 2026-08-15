"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Company = { id: string; legalName: string; city?: string; industry?: string; size?: string; _count?: { orders: number } };

export default function LeadsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [invite, setInvite] = useState({ email: "", companyName: "", city: "Riyadh", industry: "Construction" });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api("/api/companies").then(setCompanies).catch(() => setCompanies([]));
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-semibold">Lead discovery</h1>
      <p className="mt-1 text-zinc-500">Buying companies on Tijarah. Invite clients you already know.</p>

      <form
        className="mt-6 grid gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#16181f] md:grid-cols-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const row = await api("/api/invites", { method: "POST", body: JSON.stringify(invite) });
          setMsg(`Invite sent to ${row.email}`);
        }}
      >
        <input className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700" placeholder="Company name" value={invite.companyName} onChange={(e) => setInvite({ ...invite, companyName: e.target.value })} />
        <input className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700" placeholder="Email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} />
        <input className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700" placeholder="City" value={invite.city} onChange={(e) => setInvite({ ...invite, city: e.target.value })} />
        <button className="rounded-lg bg-copper font-medium text-black">Send invite</button>
      </form>
      {msg && <p className="mt-2 text-sm text-copper">{msg}</p>}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {companies.map((c) => (
          <article key={c.id} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#16181f]">
            <div className="flex justify-between">
              <h2 className="text-lg font-medium">{c.legalName}</h2>
              <span className="text-xs text-zinc-500">{c._count?.orders ?? 0} orders</span>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              {c.city} · {c.industry} · {c.size}
            </p>
            <button
              className="mt-4 rounded-lg bg-copper px-4 py-2 text-sm font-medium text-black"
              onClick={() => api(`/api/leads/${c.id}`, { method: "POST", body: JSON.stringify({ kind: "HOT" }) })}
            >
              Save to Hot
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
