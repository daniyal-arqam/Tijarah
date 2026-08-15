"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Order = {
  id: string;
  status: string;
  company?: { legalName: string };
  quote?: { rfq?: { title: string }; total?: number };
};

export default function OrdersPage() {
  const [rows, setRows] = useState<Order[]>([]);
  useEffect(() => {
    api("/api/orders").then(setRows).catch(() => setRows([]));
  }, []);
  return (
    <div>
      <h1 className="text-3xl font-semibold">Orders</h1>
      <p className="text-zinc-500">Every confirmed order and where it is right now.</p>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#16181f]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-zinc-500">
            <tr>
              <th className="p-4">Order</th>
              <th>Company</th>
              <th>Product</th>
              <th>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="p-4">{o.id.slice(0, 8)}</td>
                <td>{o.company?.legalName}</td>
                <td>{o.quote?.rfq?.title}</td>
                <td>{o.quote?.total?.toLocaleString()} SAR</td>
                <td>{o.status}</td>
                <td>
                  <Link className="text-copper" href={`/app/orders/${o.id}`}>
                    Track
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
