"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function PublicProfile() {
  const { slug } = useParams<{ slug: string }>();
  const [s, setS] = useState<{
    displayName: string;
    bio?: string;
    trustScore: number;
    cities: string[];
    specialties: string[];
    waNumber?: string;
    reviews: { body: string; quality: number }[];
  } | null>(null);

  useEffect(() => {
    fetch(`/public/salesmen/${slug}`)
      .then((r) => r.json())
      .then(setS);
  }, [slug]);

  if (!s) return <p className="p-8">Loading…</p>;

  return (
    <div className="min-h-screen bg-ink px-6 py-12 text-zinc-100">
      <div className="mx-auto max-w-3xl">
        <div className="text-copper">TIJARAH</div>
        <h1 className="mt-2 text-4xl font-semibold">{s.displayName}</h1>
        <p className="mt-2 text-zinc-400">{s.bio}</p>
        <div className="mt-4 text-copper">Trust {s.trustScore}/100</div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {s.specialties.map((x) => (
            <span key={x} className="rounded border border-zinc-600 px-2 py-1">
              {x}
            </span>
          ))}
        </div>
        {s.waNumber && (
          <a className="mt-6 inline-block rounded-lg border border-copper px-4 py-2 text-copper" href={`https://wa.me/${s.waNumber}`}>
            WhatsApp
          </a>
        )}
        <h2 className="mt-10 text-xl">Reviews</h2>
        <ul className="mt-4 space-y-3">
          {s.reviews.map((r, i) => (
            <li key={i} className="rounded-xl border border-zinc-800 p-4">
              <div className="text-copper">{r.quality}/5</div>
              <p className="mt-1">{r.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
