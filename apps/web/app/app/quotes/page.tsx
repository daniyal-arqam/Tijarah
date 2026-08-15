"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Quote = { id: string; status: string; total?: number; version: number; rfq?: { title: string; company?: { legalName: string } } };

export default function QuotesPage() {
  const [rows, setRows] = useState<Quote[]>([]);
  useEffect(() => {
    api("/api/quotes").then(setRows).catch(() => setRows([]));
  }, []);
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Quotes</h1>
          <p className="text-zinc-500">Build and track quotes you&apos;ve sent.</p>
        </div>
        <Link href="/app/rfqs" className="rounded-lg bg-copper px-4 py-2 text-sm font-medium text-black">
          + New from RFQ
        </Link>
      </div>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#16181f]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-zinc-500">
            <tr>
              <th className="p-4">Quote</th>
              <th>Company</th>
              <th>Product</th>
              <th>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((q) => (
              <tr key={q.id} className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="p-4">v{q.version}</td>
                <td>{q.rfq?.company?.legalName ?? "—"}</td>
                <td>{q.rfq?.title}</td>
                <td>{q.total?.toLocaleString()} SAR</td>
                <td>{q.status}</td>
                <td>
                  <Link href={`/app/quotes/${q.id}`} className="text-copper">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
