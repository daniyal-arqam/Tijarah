"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHead } from "@/components/PageHead";
import { useI18n } from "@/components/Providers";

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
  const { t } = useI18n();
  const [rows, setRows] = useState<Invoice[]>([]);
  const [me, setMe] = useState<{ role: string } | null>(null);
  useEffect(() => {
    api("/auth/me").then(setMe);
    api("/api/invoices").then(setRows).catch(() => setRows([]));
  }, []);
  return (
    <div>
      <PageHead title={t.invoices} subtitle={t.invoicesSub} />
      <div className="mt-7 space-y-4">
        {rows.map((i) => (
          <article key={i.id} className="uplift surface-slab rounded-2xl p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs text-muted-foreground">{t.taxInvoice}</div>
                <div className="text-xl font-semibold">{i.number}</div>
                <div className="text-sm text-muted-foreground">{i.order?.company?.legalName}</div>
              </div>
              <div className="text-end">
                <div className="text-2xl font-semibold text-molten">{i.total.toLocaleString()} SAR</div>
                <div className="text-xs">VAT {i.vat.toLocaleString()} · {i.status}</div>
              </div>
            </div>
            {me?.role === "SALESMAN" && i.status !== "PAID" && (
              <button
                className="btn-molten mt-4 text-sm"
                onClick={async () => {
                  await api(`/api/invoices/${i.id}/pay`, {
                    method: "POST",
                    body: JSON.stringify({ amount: i.total, method: "BANK_TRANSFER" }),
                  });
                  setRows(await api("/api/invoices"));
                }}
              >
                {t.recordTransfer}
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
