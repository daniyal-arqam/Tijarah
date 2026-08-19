import type { Quote, QuoteLine, Role, SalesmanProfile } from "@prisma/client";
import { hideBuyerFromMill, salesmanCard } from "./factoryView.js";

const VAT = 0.15;

export function quoteTotals(lines: QuoteLine[], discount: number) {
  const subtotal = Math.max(0, lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0) - discount);
  const vat = Math.round(subtotal * VAT * 100) / 100;
  const total = Math.round((subtotal + vat) * 100) / 100;
  return { subtotal, vat, total };
}

export function salesmanProfit(sellSubtotal: number, factoryCost: number) {
  return Math.round((sellSubtotal - factoryCost) * 100) / 100;
}

export function serializeQuote(
  quote: Quote & { lines: QuoteLine[]; salesman?: SalesmanProfile | null; rfq?: { salesman?: SalesmanProfile | null } },
  role: Role,
) {
  const totals = quoteTotals(quote.lines, quote.discount);
  const factoryCost = quote.factoryCostEstimate ?? 0;
  const clean: Record<string, unknown> = { ...quote };
  if (role === "COMPANY") {
    delete clean.factoryCostEstimate;
    if (quote.salesman) clean.salesman = salesmanCard(quote.salesman);
    if (clean.rfq && typeof clean.rfq === "object") {
      const rfq = { ...(clean.rfq as Record<string, unknown>) };
      if (rfq.salesman && typeof rfq.salesman === "object") {
        rfq.salesman = salesmanCard(rfq.salesman as Parameters<typeof salesmanCard>[0]);
      }
      clean.rfq = rfq;
    }
    return { ...clean, ...totals };
  }
  if (role === "FACTORY") {
    delete clean.factoryCostEstimate;
    return hideBuyerFromMill({ ...clean, ...totals, jobAmount: factoryCost });
  }
  return {
    ...clean,
    ...totals,
    factoryCostEstimate: factoryCost,
    profit: salesmanProfit(totals.subtotal, factoryCost),
  };
}

export function serializeOrder<
  T extends {
    quote?: (Quote & { lines: QuoteLine[] }) | null;
    salesman?: SalesmanProfile | null;
    company?: unknown;
    factory?: { legalName?: string } | null;
    factoryCost?: number;
    factoryPaidAt?: Date | null;
    factoryId?: string | null;
  },
>(order: T, role: Role) {
  const next: Record<string, unknown> = { ...order };
  const factoryCost = order.factoryCost ?? order.quote?.factoryCostEstimate ?? 0;
  if (order.quote) next.quote = serializeQuote(order.quote, role);
  if (role === "COMPANY") {
    if (order.salesman) next.salesman = salesmanCard(order.salesman);
    delete next.factory;
    delete next.factoryId;
    delete next.factoryCost;
    delete next.factoryPaidAt;
    return next;
  }
  if (role === "FACTORY") {
    delete next.company;
    delete next.companyId;
    next.jobAmount = factoryCost;
    next.factoryPaid = Boolean(order.factoryPaidAt);
    if (order.salesman) next.salesman = salesmanCard(order.salesman);
    if (next.quote && typeof next.quote === "object") {
      const q = { ...(next.quote as Record<string, unknown>) };
      delete q.total;
      delete q.subtotal;
      delete q.vat;
      delete q.profit;
      next.quote = q;
    }
    return hideBuyerFromMill(next);
  }
  next.factoryCost = factoryCost;
  next.profit = order.quote ? salesmanProfit(quoteTotals(order.quote.lines, order.quote.discount).subtotal, factoryCost) : 0;
  next.factoryPaid = Boolean(order.factoryPaidAt);
  return next;
}
