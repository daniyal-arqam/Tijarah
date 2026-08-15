"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Invoice = {
  id: string;
  number: string;
  total: number;
  vat: number;
  subtotal: number;
  status: string;
  order?: { company?: { legalName: string } };
};

export default function InvoicesPage() {
  const [rows, setRows] = useState<Invoice[]>([]);
  const [me, setMe] = useState<{ role: string } | null>(null);
  useEffect(() => {
    api("/auth/me").then(setMe);
    api("/api/invoices").then(setRows).catch(() => setRows([]));
  }, []);
  return (
    <div>
      <h1 className="text-3xl font-semibold">Invoices</h1>
      <p className="text-zinc-500">VAT 15% · SAR · bilingual tax invoice</p>
      <div className="mt-6 space-y-4">
        {rows.map((i) => (
          <article key={i.id} className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-[#16181f]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs text-zinc-500">TAX INVOICE / فاتورة ضريبية</div>
                <div className="text-xl font-semibold">{i.number}</div>
                <div className="text-sm text-zinc-500">{i.order?.company?.legalName}</div>
              </div>
              <div className="text-end">
                <div className="text-2xl font-semibold text-copper">{i.total.toLocaleString()} SAR</div>
                <div className="text-xs">VAT {i.vat.toLocaleString()} · {i.status}</div>
              </div>
            </div>
            {me?.role === "SALESMAN" && i.status !== "PAID" && (
              <button
                className="mt-4 rounded-lg bg-copper px-4 py-2 text-sm font-medium text-black"
                onClick={async () => {
                  await api(`/api/invoices/${i.id}/pay`, {
                    method: "POST",
                    body: JSON.stringify({ amount: i.total, method: "BANK_TRANSFER" }),
                  });
                  setRows(await api("/api/invoices"));
                }}
              >
                Record bank transfer
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
