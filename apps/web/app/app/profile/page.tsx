"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHead } from "@/components/PageHead";
import { useI18n } from "@/components/Providers";
import { Avatar, Field, Stars } from "@/components/ui";

const SPECS = ["Steel", "Trading", "Manufacturing", "Logistics", "Fabrication", "Alloys"];

function parseSpecs(raw?: string | string[] | null) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

async function fileToJpeg(file: File) {
  const url = URL.createObjectURL(file);
  const img = document.createElement("img");
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
    img.src = url;
  });
  const canvas = document.createElement("canvas");
  const size = 400;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const min = Math.min(img.width, img.height);
  ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);
  URL.revokeObjectURL(url);
  return canvas.toDataURL("image/jpeg", 0.72);
}

export default function ProfilePage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<"profile" | "trust" | "notes">("profile");
  const [me, setMe] = useState<Record<string, unknown> | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [legalName, setLegalName] = useState("");
  const [photo, setPhoto] = useState("");
  const [specs, setSpecs] = useState<string[]>(["Steel", "Trading"]);
  const [trust, setTrust] = useState(10);
  const [msg, setMsg] = useState("");
  const [notes, setNotes] = useState<{ title: string; meta: string }[]>([]);

  useEffect(() => {
    api("/api/me").then((u) => {
      setMe(u);
      const sm = u.salesman as { displayName?: string; bio?: string; photoUrl?: string; firmName?: string; specialties?: string; trustScore?: number } | undefined;
      const co = u.company as { legalName?: string; logoUrl?: string; contactName?: string } | undefined;
      setDisplayName(sm?.displayName || co?.contactName || "");
      setBio(sm?.bio ?? "");
      setLegalName(co?.legalName ?? "");
      setPhoto(sm?.photoUrl || co?.logoUrl || "");
      setSpecs(parseSpecs(sm?.specialties).length ? parseSpecs(sm?.specialties) : ["Steel", "Trading"]);
      setTrust(sm?.trustScore ?? 10);
      const savedFirm = localStorage.getItem("tijarah-firm");
      if (savedFirm && !co?.legalName) setLegalName(savedFirm);
    });
    Promise.all([api("/api/quotes").catch(() => []), api("/api/orders").catch(() => [])]).then(([quotes, orders]) => {
      setNotes([
        ...quotes.slice(0, 4).map((x: { status: string; id: string }) => ({ title: `${t.quotes} ${x.id.slice(0, 8)}`, meta: x.status })),
        ...orders.slice(0, 4).map((x: { status: string; id: string }) => ({ title: `${t.orders} ${x.id.slice(0, 8)}`, meta: x.status })),
      ]);
    });
  }, [t.quotes, t.orders]);

  if (!me) return <p className="text-muted-foreground">{t.loading}</p>;
  const role = me.role as string;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await api("/api/me", {
      method: "PATCH",
      body: JSON.stringify(
        role === "SALESMAN"
          ? { displayName, bio, photoUrl: photo, specialties: specs }
          : { legalName, displayName, logoUrl: photo },
      ),
    });
    if (role === "SALESMAN") localStorage.setItem("tijarah-firm", legalName);
    setMsg(t.saved);
  }

  return (
    <div>
      <PageHead title={t.profile} subtitle={t.howBuyersSee} />
      <div className="mt-5 inline-flex rounded-full border border-border bg-muted/40 p-1">
        {(["profile", "trust", "notes"] as const).map((x) => (
          <button
            key={x}
            className={`uplift rounded-full px-4 py-1.5 text-sm ${tab === x ? "bg-muted text-foreground" : "text-muted-foreground"}`}
            onClick={() => setTab(x)}
          >
            {x === "profile" ? t.profileTab : x === "trust" ? t.trustTab : t.notesTab}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
          <form className="surface-slab space-y-4 rounded-2xl p-6" onSubmit={save}>
            <Field label={t.uploadPhoto}>
              <div className="mt-2 flex items-center gap-4">
                <Avatar name={displayName || (me.email as string)} src={photo} size="lg" />
                <input
                  type="file"
                  accept="image/*"
                  className="text-sm file:me-3 file:rounded-md file:border-0 file:bg-molten file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-black"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) setPhoto(await fileToJpeg(f));
                  }}
                />
              </div>
            </Field>
            <Field label={t.fullName}>
              <input className="field" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </Field>
            <Field label={t.companyName}>
              <input className="field" value={role === "COMPANY" ? legalName : legalName} onChange={(e) => setLegalName(e.target.value)} />
            </Field>
            <Field label={t.email}>
              <input className="field opacity-70" value={me.email as string} readOnly />
            </Field>
            {role === "SALESMAN" && (
              <>
                <Field label="Bio">
                  <textarea className="field min-h-[110px]" value={bio} onChange={(e) => setBio(e.target.value)} />
                </Field>
                <Field label={t.specialties}>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SPECS.map((s) => {
                      const on = specs.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSpecs((x) => (on ? x.filter((i) => i !== s) : [...x, s]))}
                          className={`uplift rounded-full px-3 py-1 text-sm ${on ? "bg-molten text-black" : "bg-muted text-muted-foreground"}`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </Field>
                <a className="block text-sm text-primary" href={`/p/${(me.salesman as { slug: string }).slug}`} target="_blank">
                  {t.publicLink}
                </a>
              </>
            )}
            <button className="btn-molten">{t.saveChanges}</button>
            {msg && <p className="text-sm text-molten">{msg}</p>}
          </form>
          <aside className="uplift surface-slab h-fit rounded-2xl p-6 text-center">
            <Avatar name={displayName || "A"} src={photo} size="lg" />
            <div className="mt-3 font-display text-xl font-bold">{displayName || "—"}</div>
            <div className="text-sm capitalize text-muted-foreground">{role.toLowerCase()}</div>
            <Stars value={5} className="mt-3 justify-center text-lg" />
            <p className="mt-3 line-clamp-4 text-sm text-muted-foreground">{bio}</p>
          </aside>
        </div>
      )}

      {tab === "trust" && (
        <div className="uplift surface-slab mt-6 max-w-lg rounded-2xl p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{t.trust}</div>
          <div className="mt-2 font-display text-5xl font-bold">{trust}/100</div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-molten" style={{ width: `${trust}%` }} />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{t.how6b}</p>
        </div>
      )}

      {tab === "notes" && (
        <ul className="surface-slab mt-6 divide-y divide-border rounded-2xl">
          {notes.map((n, i) => (
            <li key={i} className="flex justify-between px-5 py-4 text-sm">
              <span>{n.title}</span>
              <span className="text-muted-foreground">{n.meta}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
