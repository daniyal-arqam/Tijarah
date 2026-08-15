import type { Quote, QuoteLine, Role } from "@prisma/client";

const VAT = 0.15;

export function quoteTotals(lines: QuoteLine[], discount: number) {
  const subtotal = Math.max(0, lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0) - discount);
  const vat = Math.round(subtotal * VAT * 100) / 100;
  const total = Math.round((subtotal + vat) * 100) / 100;
  return { subtotal, vat, total };
}

export function serializeQuote(
  quote: Quote & { lines: QuoteLine[] },
  role: Role,
) {
  const totals = quoteTotals(quote.lines, quote.discount);
  const margin = Math.round((totals.subtotal - quote.factoryCostEstimate) * 100) / 100;
  if (role === "COMPANY") {
    const { factoryCostEstimate: _hidden, ...rest } = quote;
    return { ...rest, ...totals };
  }
  return { ...quote, ...totals, margin };
}

export function serializeOrder<T extends { quote?: (Quote & { lines: QuoteLine[] }) | null }>(
  order: T,
  role: Role,
) {
  if (!order.quote) return order;
  return { ...order, quote: serializeQuote(order.quote, role) };
}
