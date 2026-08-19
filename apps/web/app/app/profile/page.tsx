"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHead } from "@/components/PageHead";
import { useI18n } from "@/components/Providers";
import { Avatar, Field, Stars } from "@/components/ui";

const SPECS = [
  "Steel",
  "sheet_metal",
  "rebar",
  "tanks",
  "steel_structure",
  "plate",
  "coil",
  "pipe",
  "Trading",
  "Manufacturing",
  "Fabrication",
  "Alloys",
];
const CITIES = ["Riyadh", "Jeddah", "Dammam", "Khobar", "Jubail", "Yanbu", "Makkah", "Madinah", "Abha", "Tabuk"];

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

function pretty(s: string) {
  return s.replaceAll("_", " ");
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
  const [specs, setSpecs] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [years, setYears] = useState(0);
  const [wa, setWa] = useState("");
  const [trust, setTrust] = useState(4);
  const [title, setTitle] = useState("");
  const [certs, setCerts] = useState("");
  const [coverageNotes, setCoverageNotes] = useState("");
  const [factoryId, setFactoryId] = useState("");
  const [factories, setFactories] = useState<{ id: string; legalName: string; verified?: boolean }[]>([]);
  const [millName, setMillName] = useState("");
  const [msg, setMsg] = useState("");
  const [notes, setNotes] = useState<{ title: string; meta: string }[]>([]);

  useEffect(() => {
    api("/api/me").then((u) => {
      setMe(u);
      const sm = u.salesman as {
        displayName?: string;
        bio?: string;
        photoUrl?: string;
        specialties?: string;
        cities?: string;
        yearsExperience?: number;
        waNumber?: string | null;
        trustScore?: number;
        slug?: string;
        title?: string;
        certifications?: string | null;
        coverageNotes?: string | null;
        factoryId?: string | null;
        factory?: { legalName: string } | null;
      } | undefined;
      const co = u.company as { legalName?: string; logoUrl?: string; contactName?: string } | undefined;
      const mill = u.factory as { legalName?: string; logoUrl?: string } | undefined;
      setDisplayName(sm?.displayName || co?.contactName || mill?.legalName || "");
      setBio(sm?.bio ?? "");
      setLegalName(co?.legalName || mill?.legalName || "");
      setPhoto(sm?.photoUrl || co?.logoUrl || mill?.logoUrl || "");
      setSpecs(parseSpecs(sm?.specialties));
      setCities(parseSpecs(sm?.cities));
      setYears(sm?.yearsExperience ?? 0);
      setWa(sm?.waNumber ?? "");
      setTrust(sm?.trustScore ?? 4);
      setTitle(sm?.title ?? "");
      setCerts(sm?.certifications ?? "");
      setCoverageNotes(sm?.coverageNotes ?? "");
      setFactoryId(sm?.factoryId ?? "");
      setMillName(sm?.factory?.legalName ?? mill?.legalName ?? "");
      const savedFirm = localStorage.getItem("tijarah-firm");
      if (savedFirm && !co?.legalName) setLegalName(savedFirm);
    });
    api("/api/factories").then(setFactories).catch(() => setFactories([]));
    Promise.all([api("/api/quotes").catch(() => []), api("/api/orders").catch(() => [])]).then(([quotes, orders]) => {
      setNotes([
        ...quotes.slice(0, 4).map((x: { status: string; id: string }) => ({ title: `${t.quotes} ${x.id.slice(0, 8)}`, meta: x.status })),
        ...orders.slice(0, 4).map((x: { status: string; id: string }) => ({ title: `${t.orders} ${x.id.slice(0, 8)}`, meta: x.status })),
      ]);
    });
  }, [t.quotes, t.orders]);

  if (!me) return <p className="text-muted-foreground">{t.loading}</p>;
  const role = me.role as string;
  const slug = (me.salesman as { slug?: string } | undefined)?.slug;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await api("/api/me", {
      method: "PATCH",
      body: JSON.stringify(
        role === "SALESMAN"
          ? { displayName, bio, photoUrl: photo, specialties: specs, cities, yearsExperience: years, waNumber: wa, title, certifications: certs, coverageNotes, factoryId: factoryId || undefined }
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
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
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
            {role !== "SALESMAN" && (
              <Field label={t.companyName}>
                <input className="field" value={legalName} onChange={(e) => setLegalName(e.target.value)} />
              </Field>
            )}
            <Field label={t.email}>
              <input className="field opacity-70" value={me.email as string} readOnly />
            </Field>
            {role === "SALESMAN" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t.yearsExp}>
                    <input
                      className="field"
                      type="number"
                      min={0}
                      max={60}
                      value={years}
                      onChange={(e) => setYears(Number(e.target.value))}
                    />
                  </Field>
                  <Field label={t.jobTitle}>
                    <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} />
                  </Field>
                  <Field label={t.whatsapp} hint={t.waHint}>
                    <input className="field" value={wa} onChange={(e) => setWa(e.target.value)} placeholder="9665…" />
                  </Field>
                </div>
                <Field label={t.linkMill}>
                  <select className="field" value={factoryId} onChange={(e) => setFactoryId(e.target.value)}>
                    <option value="">—</option>
                    {factories.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.legalName}
                        {f.verified ? " ✓" : ""}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t.certifications}>
                  <input className="field" value={certs} onChange={(e) => setCerts(e.target.value)} />
                </Field>
                <Field label="Bio">
                  <textarea className="field min-h-[110px]" value={bio} onChange={(e) => setBio(e.target.value)} />
                </Field>
                <Field label={t.coverageNotes}>
                  <textarea className="field min-h-[70px]" value={coverageNotes} onChange={(e) => setCoverageNotes(e.target.value)} />
                </Field>
                <Field label={t.coverage} hint={t.citiesHint}>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {CITIES.map((c) => {
                      const on = cities.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCities((x) => (on ? x.filter((i) => i !== c) : [...x, c]))}
                          className={`uplift rounded-full px-3 py-1 text-sm ${on ? "bg-molten text-black" : "bg-muted text-muted-foreground"}`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
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
                          className={`uplift rounded-full px-3 py-1 text-sm capitalize ${on ? "bg-molten text-black" : "bg-muted text-muted-foreground"}`}
                        >
                          {pretty(s)}
                        </button>
                      );
                    })}
                  </div>
                </Field>
                {slug && (
                  <a className="block text-sm text-primary" href={`/p/${slug}`} target="_blank" rel="noopener noreferrer">
                    {t.publicLink}
                  </a>
                )}
              </>
            )}
            <button className="btn-molten">{t.saveChanges}</button>
            {msg && <p className="text-sm text-molten">{msg}</p>}
          </form>
          <aside className="uplift surface-slab h-fit rounded-2xl p-6">
            <div className="text-center">
              <Avatar name={displayName || "A"} src={photo} size="lg" />
              <div className="mt-3 font-display text-xl font-bold">{displayName || "—"}</div>
              <div className="text-sm text-muted-foreground">
                {role === "SALESMAN" ? t.metalSalesman : role === "FACTORY" ? t.factoryRole : role.toLowerCase()}
              </div>
              <Stars value={5} className="mt-3 justify-center text-lg" />
            </div>
            {role === "SALESMAN" && (
              <dl className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t.trust}</dt>
                  <dd className="font-medium text-molten">{trust}/10</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t.linkMill}</dt>
                  <dd className="font-medium">{millName || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t.coverage}</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {cities.length ? cities.map((c) => (
                      <span key={c} className="rounded border border-border px-2 py-0.5 text-xs">
                        {c}
                      </span>
                    )) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t.specialties}</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {specs.length ? specs.map((c) => (
                      <span key={c} className="rounded border border-border px-2 py-0.5 text-xs capitalize">
                        {pretty(c)}
                      </span>
                    )) : "—"}
                  </dd>
                </div>
              </dl>
            )}
            <p className="mt-3 line-clamp-4 text-sm text-muted-foreground">{bio}</p>
          </aside>
        </div>
      )}

      {tab === "trust" && (
        <div className="uplift surface-slab mt-6 max-w-lg rounded-2xl p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{t.trust}</div>
            <div className="mt-2 font-display text-5xl font-bold">{trust}/10</div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-molten" style={{ width: `${trust * 10}%` }} />
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
