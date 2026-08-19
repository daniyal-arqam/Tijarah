"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHead } from "@/components/PageHead";
import { useI18n } from "@/components/Providers";
import { StatusBadge } from "@/components/ui";

type Quote = {
  id: string;
  status: string;
  total?: number;
  version: number;
  paymentTerms?: string;
  deliveryDate?: string;
  rfq?: { title: string; company?: { legalName: string } };
  salesman?: { displayName: string };
};

function terms(v?: string) {
  if (!v) return "—";
  return v.replace("ADVANCE_50", "Advance 50%").replace("NET_", "Net ").replace("COD", "COD");
}

export default function QuotesPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Quote[]>([]);
  const [role, setRole] = useState("");
  const [filter, setFilter] = useState("ALL");
  useEffect(() => {
    api("/auth/me").then((u) => setRole(u.role)).catch(() => null);
    api("/api/quotes").then(setRows).catch(() => setRows([]));
  }, []);
  const shown = rows.filter((q) => filter === "ALL" || q.status === filter);
  return (
    <div>
      <PageHead
        title={t.quotes}
        subtitle={t.quotesSub}
        actions={
          <Link href="/app/rfqs" className="btn-molten text-sm">
            {t.newQuote}
          </Link>
        }
      />
      <div className="mt-4 flex justify-end">
        <select className="field mt-0 w-44" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="ALL">{t.allStatuses}</option>
          {["DRAFT", "SENT", "VIEWED", "COUNTERED", "ACCEPTED", "REJECTED"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="surface-slab mt-4 overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="p-4">{t.quotes}</th>
              <th>{role === "COMPANY" ? t.salesman : t.company}</th>
              <th>{t.productLine}</th>
              <th>{t.delivery}</th>
              <th>{t.terms}</th>
              <th>{t.amount}</th>
              <th>{t.status}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((q) => (
              <tr key={q.id} className="border-t border-border">
                <td className="p-4 font-mono-ui text-xs">Q-{q.id.slice(-4).toUpperCase()}</td>
                <td>{role === "COMPANY" ? q.salesman?.displayName ?? "—" : q.rfq?.company?.legalName ?? "—"}</td>
                <td>{q.rfq?.title}</td>
                <td>{q.deliveryDate ? q.deliveryDate.slice(0, 10) : "—"}</td>
                <td>{terms(q.paymentTerms)}</td>
                <td className="font-medium">{q.total?.toLocaleString()} SAR</td>
                <td>
                  <StatusBadge status={q.status} />
                </td>
                <td>
                  <Link href={`/app/quotes/${q.id}`} className="text-primary">
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
