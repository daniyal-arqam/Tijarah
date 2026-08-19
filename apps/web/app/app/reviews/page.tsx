"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { PageHead } from "@/components/PageHead";
import { useI18n } from "@/components/Providers";
import { Field, Stars } from "@/components/ui";

type Review = {
  id: string;
  quality: number;
  deliverySpeed: number;
  professionalism: number;
  body: string;
  createdAt: string;
  from?: string;
  authorRole?: string;
  order?: { company?: { legalName: string }; factory?: { legalName: string } };
};
type Order = {
  id: string;
  status: string;
  factoryPaid?: boolean;
  reviews?: { authorId?: string; authorRole?: string }[];
  review?: { id: string } | null;
  company?: { legalName: string };
  salesman?: { displayName: string };
  quote?: { rfq?: { title: string } };
};

export default function ReviewsPage() {
  const { t } = useI18n();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [me, setMe] = useState<{ role: string; id?: string } | null>(null);
  const [form, setForm] = useState({ orderId: "", quality: 5, deliverySpeed: 5, professionalism: 5, body: "" });

  useEffect(() => {
    api("/auth/me").then(async (u) => {
      setMe(u);
      setReviews(await api("/api/reviews"));
      if (u.role === "COMPANY" || u.role === "FACTORY") setOrders(await api("/api/orders"));
    });
  }, []);

  const unlocked = orders.filter((o) => {
    const already = (o.reviews ?? []).some((r) => r.authorRole === me?.role) || Boolean(o.review);
    if (me?.role === "COMPANY") return o.status === "RECEIVED" && !already;
    if (me?.role === "FACTORY") return Boolean(o.factoryPaid) && !already;
    return false;
  });
  const avg = (r: Review) => (r.quality + r.deliverySpeed + r.professionalism) / 3;
  const overall = reviews.length ? reviews.reduce((s, r) => s + avg(r), 0) / reviews.length : 0;
  const dist = useMemo(() => {
    const d = [0, 0, 0, 0, 0];
    for (const r of reviews) d[Math.max(1, Math.min(5, Math.round(avg(r)))) - 1] += 1;
    return d;
  }, [reviews]);
  const maxBar = Math.max(1, ...dist);

  return (
    <div>
      <PageHead title={t.reviews} subtitle={t.reviewsBothSides} />
      <div className="uplift card-flip mt-7 flex flex-wrap items-center gap-8 rounded-2xl p-6">
        <div>
          <div className="font-display text-5xl font-bold">{reviews.length ? overall.toFixed(1) : "—"}</div>
          <Stars value={overall} className="mt-2 text-xl" />
          <div className="mt-1 text-sm text-muted-foreground">
            {reviews.length} {t.reviews}
          </div>
        </div>
        <div className="min-w-[220px] flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-3 text-xs">
              <span className="w-12 text-muted-foreground">{star} ★</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-molten" style={{ width: `${(dist[star - 1] / maxBar) * 100}%` }} />
              </div>
              <span className="w-6 text-end">{dist[star - 1]}</span>
            </div>
          ))}
        </div>
      </div>

      {(me?.role === "COMPANY" || me?.role === "FACTORY") && (
        <form
          className="surface-slab mt-6 grid gap-4 rounded-2xl p-6 md:grid-cols-3"
          onSubmit={async (e) => {
            e.preventDefault();
            await api("/api/reviews", { method: "POST", body: JSON.stringify(form) });
            setReviews(await api("/api/reviews"));
            setForm({ ...form, orderId: "", body: "" });
          }}
        >
          <Field label={t.selectOrder} hint={t.reviewsSub}>
            <select className="field" required value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })}>
              <option value="">{t.selectOrder}</option>
              {unlocked.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.quote?.rfq?.title || o.salesman?.displayName || o.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.quality}>
            <select className="field" value={form.quality} onChange={(e) => setForm({ ...form, quality: Number(e.target.value) })}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} / 5
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.speed}>
            <select className="field" value={form.deliverySpeed} onChange={(e) => setForm({ ...form, deliverySpeed: Number(e.target.value) })}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} / 5
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.professionalism}>
            <select className="field" value={form.professionalism} onChange={(e) => setForm({ ...form, professionalism: Number(e.target.value) })}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} / 5
                </option>
              ))}
            </select>
          </Field>
          <div className="md:col-span-3">
            <Field label={t.yourReview}>
              <textarea className="field" required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </Field>
          </div>
          <button className="btn-molten md:col-span-3" disabled={!form.orderId}>
            {t.submitReview}
          </button>
        </form>
      )}

      <ul className="mt-8 space-y-4">
        {reviews.map((r) => {
          const from = r.from || r.authorRole;
          const label = from === "FACTORY" ? t.fromFactory : t.fromCompany;
          const name = from === "FACTORY" ? r.order?.factory?.legalName : r.order?.company?.legalName;
          return (
            <li key={r.id} className="uplift card-flip rounded-2xl p-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="font-semibold">{name || label}</div>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs text-emerald-400">{label}</span>
                <span className="ms-auto text-xs text-muted-foreground">{r.createdAt.slice(0, 10)}</span>
              </div>
              <Stars value={avg(r)} className="mt-2" />
              <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
