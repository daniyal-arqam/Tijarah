"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHead } from "@/components/PageHead";
import { useI18n } from "@/components/Providers";

type Order = {
  id: string;
  status: string;
  company?: { legalName: string };
  quote?: { rfq?: { title: string }; total?: number };
};

export default function OrdersPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Order[]>([]);
  useEffect(() => {
    api("/api/orders").then(setRows).catch(() => setRows([]));
  }, []);
  return (
    <div>
      <PageHead title={t.orders} subtitle={t.ordersSub} />
      <div className="surface-slab mt-7 overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-muted-foreground">
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
              <tr key={o.id} className="border-t border-border">
                <td className="p-4">{o.id.slice(0, 8)}</td>
                <td>{o.company?.legalName}</td>
                <td>{o.quote?.rfq?.title}</td>
                <td>{o.quote?.total?.toLocaleString()} SAR</td>
                <td>{o.status}</td>
                <td>
                  <Link className="text-primary" href={`/app/orders/${o.id}`}>
                    {t.view}
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
