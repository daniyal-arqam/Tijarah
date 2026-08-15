"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function ProfilePage() {
  const [me, setMe] = useState<Record<string, unknown> | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [legalName, setLegalName] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api("/api/me").then((u) => {
      setMe(u);
      const sm = u.salesman as { displayName?: string; bio?: string } | undefined;
      const co = u.company as { legalName?: string } | undefined;
      setDisplayName(sm?.displayName ?? "");
      setBio(sm?.bio ?? "");
      setLegalName(co?.legalName ?? "");
    });
  }, []);

  if (!me) return <p>Loading…</p>;
  const role = me.role as string;

  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-semibold">Profile</h1>
      <p className="text-zinc-500">{me.email as string}</p>
      <form
        className="mt-6 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          await api("/api/me", {
            method: "PATCH",
            body: JSON.stringify(role === "SALESMAN" ? { displayName, bio } : { legalName }),
          });
          setMsg("Saved");
        }}
      >
        {role === "SALESMAN" && (
          <>
            <input className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            <textarea className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700" value={bio} onChange={(e) => setBio(e.target.value)} />
            <a className="block text-sm text-copper" href={`/p/${(me.salesman as { slug: string }).slug}`} target="_blank">
              Public profile link
            </a>
          </>
        )}
        {role === "COMPANY" && (
          <input className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700" value={legalName} onChange={(e) => setLegalName(e.target.value)} />
        )}
        <button className="rounded-lg bg-copper px-4 py-2 font-medium text-black">Save</button>
      </form>
      {msg && <p className="mt-3 text-copper">{msg}</p>}
    </div>
  );
}
