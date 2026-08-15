"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Review = {
  id: string;
  quality: number;
  deliverySpeed: number;
  professionalism: number;
  body: string;
  createdAt: string;
};
type Order = { id: string; status: string; review?: { id: string } | null };

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [me, setMe] = useState<{ role: string } | null>(null);
  const [form, setForm] = useState({ orderId: "", quality: 5, deliverySpeed: 5, professionalism: 5, body: "" });

  useEffect(() => {
    api("/auth/me").then(async (u) => {
      setMe(u);
      setReviews(await api("/api/reviews"));
      if (u.role === "COMPANY") setOrders(await api("/api/orders"));
    });
  }, []);

  const unlocked = orders.filter((o) => o.status === "RECEIVED" && !o.review);

  return (
    <div>
      <h1 className="text-3xl font-semibold">Reviews</h1>
      <p className="text-zinc-500">Only after a received order.</p>
      {me?.role === "COMPANY" && (
        <form
          className="mt-6 space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#16181f]"
          onSubmit={async (e) => {
            e.preventDefault();
            await api("/api/reviews", { method: "POST", body: JSON.stringify(form) });
            setReviews(await api("/api/reviews"));
          }}
        >
          <select className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700" value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })}>
            <option value="">Select received order</option>
            {unlocked.map((o) => (
              <option key={o.id} value={o.id}>
                {o.id.slice(0, 8)}
              </option>
            ))}
          </select>
          <textarea className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700" placeholder="Your review" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <button className="rounded-lg bg-copper px-4 py-2 font-medium text-black" disabled={!form.orderId}>
            Submit review
          </button>
        </form>
      )}
      <ul className="mt-8 space-y-4">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
            <div className="text-copper">
              Quality {r.quality} · Speed {r.deliverySpeed} · Professionalism {r.professionalism}
            </div>
            <p className="mt-2">{r.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
