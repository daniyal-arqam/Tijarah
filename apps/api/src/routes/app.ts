import { Router } from "express";
import { z } from "zod";
import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth.js";
import { serializeQuote, serializeOrder, quoteTotals } from "../lib/money.js";
import { recalcTrustScore } from "../lib/trustScore.js";
import { publicUser } from "../lib/publicUser.js";
import { stripHtml } from "../lib/sanitize.js";
import type { OrderStatus, PaymentTerms, QuoteStatus } from "@prisma/client";

export const appRouter = Router();
appRouter.use(requireAuth);

const text = z.string().min(1).max(4000);
const money = z.number().nonnegative().max(1e9);

function parseJsonArr(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

appRouter.get("/me", async (req, res) => {
  const { user } = req as AuthedRequest;
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    include: { salesman: true, company: true },
  });
  res.json(publicUser(row));
});

appRouter.patch("/me", async (req, res) => {
  const { user } = req as AuthedRequest;
  const body = z
    .object({
      locale: z.enum(["en", "ar"]).optional(),
      phone: z.string().max(30).optional(),
      displayName: z.string().min(2).max(80).transform(stripHtml).optional(),
      bio: z.string().max(2000).transform(stripHtml).optional(),
      yearsExperience: z.number().int().min(0).max(60).optional(),
      cities: z.array(z.string()).optional(),
      specialties: z.array(z.string()).optional(),
      waNumber: z.string().max(30).optional(),
      photoUrl: z.string().max(500_000).optional(),
      legalName: z.string().min(2).max(120).optional(),
      logoUrl: z.string().max(500_000).optional(),
      industry: z.string().max(80).optional(),
      size: z.string().max(40).optional(),
      city: z.string().max(40).optional(),
      crNumber: z.string().max(40).optional(),
      vatNumber: z.string().max(40).optional(),
    })
    .parse(req.body);

  await prisma.user.update({
    where: { id: user.id },
    data: { locale: body.locale, phone: body.phone },
  });
  if (user.role === "SALESMAN") {
    await prisma.salesmanProfile.update({
      where: { userId: user.id },
      data: {
        displayName: body.displayName,
        bio: body.bio,
        yearsExperience: body.yearsExperience,
        cities: body.cities ? JSON.stringify(body.cities) : undefined,
        specialties: body.specialties ? JSON.stringify(body.specialties) : undefined,
        waNumber: body.waNumber,
        photoUrl: body.photoUrl,
      },
    });
  }
  if (user.role === "COMPANY") {
    await prisma.companyProfile.update({
      where: { userId: user.id },
      data: {
        legalName: body.legalName,
        industry: body.industry,
        size: body.size,
        city: body.city,
        crNumber: body.crNumber,
        vatNumber: body.vatNumber,
        logoUrl: body.logoUrl,
        contactName: body.displayName,
      },
    });
  }
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    include: { salesman: true, company: true },
  });
  res.json(publicUser(row));
});

appRouter.get("/dashboard", async (req, res) => {
  const { user } = req as AuthedRequest;
  if (user.role === "SALESMAN") {
    const sm = await prisma.salesmanProfile.findUnique({ where: { userId: user.id } });
    if (!sm) {
      res.status(404).json({ error: "No profile" });
      return;
    }
    const [quotes, orders, invoices, rfqs] = await Promise.all([
      prisma.quote.findMany({ where: { salesmanId: sm.id }, include: { lines: true, rfq: true } }),
      prisma.order.findMany({ where: { salesmanId: sm.id }, include: { company: true, quote: { include: { lines: true } } } }),
      prisma.invoice.findMany({ where: { order: { salesmanId: sm.id } }, include: { payments: true } }),
      prisma.rfq.findMany({ where: { salesmanId: sm.id, status: "OPEN" } }),
    ]);
    const paid = invoices.reduce((s, i) => s + i.payments.reduce((p, x) => p + x.amount, 0), 0);
    const month = new Date();
    month.setDate(1);
    const ordersMonth = orders.filter((o) => o.createdAt >= month).length;
    const received = orders.filter((o) => o.status === "RECEIVED" || o.status === "DELIVERED");
    const onTime =
      received.filter((o) => o.promisedDate && o.deliveredAt && o.deliveredAt <= o.promisedDate).length /
      Math.max(1, received.filter((o) => o.promisedDate && o.deliveredAt).length);
    const margin = quotes
      .filter((q) => q.status === "ACCEPTED")
      .reduce((s, q) => s + quoteTotals(q.lines, q.discount).subtotal - q.factoryCostEstimate, 0);
    res.json({
      trustScore: sm.trustScore,
      paidRevenue: paid,
      ordersThisMonth: ordersMonth,
      openQuotes: quotes.filter((q) => ["SENT", "VIEWED", "COUNTERED"].includes(q.status)).length,
      pendingDeliveries: orders.filter((o) => !["RECEIVED"].includes(o.status)).length,
      onTimePct: Math.round(onTime * 100),
      privateMargin: Math.round(margin * 100) / 100,
      openRfqs: rfqs.length,
      recentOrders: orders.slice(0, 6).map((o) => serializeOrder(o, user.role)),
      recentQuotes: quotes.slice(0, 6).map((q) => serializeQuote(q, user.role)),
    });
    return;
  }
  if (user.role === "COMPANY") {
    const co = await prisma.companyProfile.findUnique({ where: { userId: user.id } });
    if (!co) {
      res.status(404).json({ error: "No profile" });
      return;
    }
    const invoices = await prisma.invoice.findMany({
      where: { order: { companyId: co.id } },
      include: { payments: true, order: true },
    });
    const month = new Date();
    month.setDate(1);
    const spend = invoices
      .filter((i) => i.createdAt >= month)
      .reduce((s, i) => s + i.payments.reduce((p, x) => p + x.amount, 0), 0);
    const orders = await prisma.order.findMany({
      where: { companyId: co.id },
      include: { salesman: true, quote: { include: { lines: true } } },
    });
    const rfqs = await prisma.rfq.findMany({ where: { companyId: co.id } });
    res.json({
      spendThisMonth: spend,
      inProgress: orders.filter((o) => o.status !== "RECEIVED").length,
      openRfqs: rfqs.filter((r) => r.status === "OPEN").length,
      orders: orders.map((o) => serializeOrder(o, user.role)),
      invoices,
    });
    return;
  }
  const [users, orders, invoices] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.invoice.aggregate({ _sum: { total: true } }),
  ]);
  const pending = await prisma.credential.findMany({
    where: { status: "PENDING" },
    include: { user: { select: { email: true, role: true } } },
  });
  res.json({ users, orders, gmv: invoices._sum.total ?? 0, pendingCredentials: pending });
});

appRouter.get("/companies", requireRole("SALESMAN", "ADMIN"), async (req, res) => {
  const industry = String(req.query.industry ?? "");
  const city = String(req.query.city ?? "");
  const rows = await prisma.companyProfile.findMany({
    where: {
      industry: industry || undefined,
      city: city || undefined,
    },
    include: { _count: { select: { orders: true } } },
  });
  res.json(rows);
});

appRouter.post("/leads/:companyId", requireRole("SALESMAN"), async (req, res) => {
  const { user } = req as AuthedRequest;
  const sm = await prisma.salesmanProfile.findUnique({ where: { userId: user.id } });
  if (!sm) {
    res.status(404).json({ error: "No profile" });
    return;
  }
  const kind = z.enum(["HOT", "FOLLOW_UP", "NOT_INTERESTED", "CUSTOM"]).parse(req.body?.kind ?? "HOT");
  let list = await prisma.leadList.findFirst({ where: { salesmanId: sm.id, kind } });
  if (!list) {
    list = await prisma.leadList.create({
      data: { salesmanId: sm.id, kind, name: kind },
    });
  }
  const item = await prisma.leadListItem.upsert({
    where: { listId_companyId: { listId: list.id, companyId: req.params.companyId } },
    create: { listId: list.id, companyId: req.params.companyId },
    update: {},
  });
  res.json(item);
});

appRouter.get("/leads", requireRole("SALESMAN"), async (req, res) => {
  const { user } = req as AuthedRequest;
  const sm = await prisma.salesmanProfile.findUnique({ where: { userId: user.id } });
  const lists = await prisma.leadList.findMany({
    where: { salesmanId: sm!.id },
    include: { items: { include: { company: true } } },
  });
  res.json(lists);
});

appRouter.post("/invites", requireRole("SALESMAN"), async (req, res) => {
  const { user } = req as AuthedRequest;
  const body = z
    .object({
      email: z.string().email(),
      companyName: z.string().min(2).max(120),
      city: z.string().max(40).optional(),
      industry: z.string().max(80).optional(),
    })
    .parse(req.body);
  const sm = await prisma.salesmanProfile.findUnique({ where: { userId: user.id } });
  const invite = await prisma.invite.create({
    data: {
      salesmanId: sm!.id,
      email: body.email.toLowerCase(),
      companyName: body.companyName,
      city: body.city,
      industry: body.industry,
      token: crypto.randomBytes(24).toString("hex"),
    },
  });
  res.status(201).json(invite);
});

appRouter.get("/salesmen", requireRole("COMPANY", "ADMIN"), async (req, res) => {
  const { user } = req as AuthedRequest;
  const co = await prisma.companyProfile.findUnique({ where: { userId: user.id } });
  const specialty = String(req.query.specialty ?? "");
  const city = String(req.query.city ?? "");
  const rows = await prisma.salesmanProfile.findMany({
    include: { reviews: { where: { archived: false } }, user: { select: { emailVerified: true, phoneVerified: true } } },
  });
  const mapped = rows
    .map((s) => {
      const specs = parseJsonArr(s.specialties);
      const cities = parseJsonArr(s.cities);
      let match = 0;
      if (specialty && specs.includes(specialty)) match += 40;
      else if (!specialty) match += 20;
      if (city && cities.includes(city)) match += 30;
      else if (co?.city && cities.includes(co.city)) match += 30;
      match += Math.round((s.trustScore / 100) * 15);
      const avg =
        s.reviews.length === 0
          ? 0
          : s.reviews.reduce((a, r) => a + (r.quality + r.deliverySpeed + r.professionalism) / 3, 0) /
            s.reviews.length;
      match += Math.round((avg / 5) * 15);
      return {
        id: s.id,
        displayName: s.displayName,
        slug: s.slug,
        cities,
        specialties: specs,
        trustScore: s.trustScore,
        match: Math.min(100, match),
        rating: Math.round(avg * 10) / 10,
        reviewCount: s.reviews.length,
      };
    })
    .sort((a, b) => b.match - a.match);
  res.json(mapped);
});

appRouter.get("/salesmen/public/:slug", async (req, res) => {
  const s = await prisma.salesmanProfile.findUnique({
    where: { slug: req.params.slug },
    include: { reviews: { where: { archived: false } } },
  });
  if (!s) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({
    displayName: s.displayName,
    slug: s.slug,
    bio: s.bio,
    yearsExperience: s.yearsExperience,
    cities: parseJsonArr(s.cities),
    specialties: parseJsonArr(s.specialties),
    trustScore: s.trustScore,
    waNumber: s.waNumber,
    reviews: s.reviews,
  });
});

const rfqSchema = z.object({
  salesmanId: z.string().min(1),
  title: text,
  specialty: z.string().min(1),
  specs: text,
  quantity: money,
  unit: z.string().max(20).default("pcs"),
  destinationCity: z.string().min(1),
  neededBy: z.string().optional(),
});

appRouter.post("/rfqs", requireRole("COMPANY"), async (req, res) => {
  const { user } = req as AuthedRequest;
  const body = rfqSchema.parse(req.body);
  const co = await prisma.companyProfile.findUnique({ where: { userId: user.id } });
  const rfq = await prisma.rfq.create({
    data: {
      companyId: co!.id,
      salesmanId: body.salesmanId,
      title: stripHtml(body.title),
      specialty: body.specialty,
      specs: stripHtml(body.specs),
      quantity: body.quantity,
      unit: body.unit,
      destinationCity: body.destinationCity,
      neededBy: body.neededBy ? new Date(body.neededBy) : undefined,
    },
  });
  res.status(201).json(rfq);
});

appRouter.get("/rfqs", async (req, res) => {
  const { user } = req as AuthedRequest;
  const where =
    user.role === "SALESMAN"
      ? { salesman: { userId: user.id } }
      : user.role === "COMPANY"
        ? { company: { userId: user.id } }
        : {};
  const rows = await prisma.rfq.findMany({
    where,
    include: { company: true, salesman: true, quotes: { include: { lines: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(
    rows.map((r) => ({
      ...r,
      quotes: r.quotes.map((q) => serializeQuote(q, user.role)),
    })),
  );
});

const quoteSchema = z.object({
  rfqId: z.string(),
  paymentTerms: z.enum(["ADVANCE_50", "NET_15", "NET_30", "NET_45", "COD"]).default("NET_30"),
  deliveryDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
  factoryCostEstimate: money,
  discount: money.optional(),
  lines: z.array(z.object({ product: text, quantity: money, unitPrice: money })).min(1),
});

appRouter.post("/quotes", requireRole("SALESMAN"), async (req, res) => {
  const { user } = req as AuthedRequest;
  const body = quoteSchema.parse(req.body);
  const sm = await prisma.salesmanProfile.findUnique({ where: { userId: user.id } });
  const rfq = await prisma.rfq.findUnique({ where: { id: body.rfqId } });
  if (!rfq || rfq.salesmanId !== sm!.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const last = await prisma.quote.findFirst({ where: { rfqId: rfq.id }, orderBy: { version: "desc" } });
  const quote = await prisma.quote.create({
    data: {
      rfqId: rfq.id,
      salesmanId: sm!.id,
      version: (last?.version ?? 0) + 1,
      status: "SENT",
      paymentTerms: body.paymentTerms as PaymentTerms,
      deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : undefined,
      notes: body.notes ? stripHtml(body.notes) : undefined,
      factoryCostEstimate: body.factoryCostEstimate,
      discount: body.discount ?? 0,
      lines: { create: body.lines },
    },
    include: { lines: true, rfq: true },
  });
  res.status(201).json(serializeQuote(quote, user.role));
});

appRouter.get("/quotes", async (req, res) => {
  const { user } = req as AuthedRequest;
  const where =
    user.role === "SALESMAN"
      ? { salesman: { userId: user.id } }
      : user.role === "COMPANY"
        ? { rfq: { company: { userId: user.id } } }
        : {};
  const rows = await prisma.quote.findMany({
    where,
    include: { lines: true, rfq: { include: { company: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(rows.map((q) => serializeQuote(q, user.role)));
});

appRouter.get("/quotes/:id", async (req, res) => {
  const { user } = req as AuthedRequest;
  const q = await prisma.quote.findUnique({
    where: { id: req.params.id },
    include: { lines: true, rfq: { include: { company: true, salesman: true } } },
  });
  if (!q) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const allowed =
    user.role === "ADMIN" ||
    (user.role === "SALESMAN" && q.rfq.salesman.userId === user.id) ||
    (user.role === "COMPANY" && q.rfq.company.userId === user.id);
  if (!allowed) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (user.role === "COMPANY" && q.status === "SENT") {
    await prisma.quote.update({ where: { id: q.id }, data: { status: "VIEWED" } });
    q.status = "VIEWED";
  }
  res.json(serializeQuote(q, user.role));
});

appRouter.post("/quotes/:id/counter", requireRole("COMPANY"), async (req, res) => {
  const { user } = req as AuthedRequest;
  const body = z.object({ total: money, date: z.string().optional() }).parse(req.body);
  const q = await prisma.quote.findUnique({
    where: { id: req.params.id },
    include: { rfq: { include: { company: true } }, lines: true },
  });
  if (!q || q.rfq.company.userId !== user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const updated = await prisma.quote.update({
    where: { id: q.id },
    data: { status: "COUNTERED" as QuoteStatus, counterTotal: body.total, counterDate: body.date ? new Date(body.date) : undefined },
    include: { lines: true },
  });
  res.json(serializeQuote(updated, user.role));
});

appRouter.post("/quotes/:id/decide", requireRole("COMPANY"), async (req, res) => {
  const { user } = req as AuthedRequest;
  const body = z.object({ accept: z.boolean() }).parse(req.body);
  const q = await prisma.quote.findUnique({
    where: { id: req.params.id },
    include: { rfq: { include: { company: true } }, lines: true, salesman: true },
  });
  if (!q || q.rfq.company.userId !== user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (!body.accept) {
    const updated = await prisma.quote.update({
      where: { id: q.id },
      data: { status: "REJECTED" },
      include: { lines: true },
    });
    res.json(serializeQuote(updated, user.role));
    return;
  }
  const totals = quoteTotals(q.lines, q.discount);
  const due = new Date();
  due.setDate(due.getDate() + 30);
  const result = await prisma.$transaction(async (tx) => {
    const quote = await tx.quote.update({
      where: { id: q.id },
      data: { status: "ACCEPTED" },
      include: { lines: true },
    });
    const order = await tx.order.create({
      data: {
        quoteId: q.id,
        salesmanId: q.salesmanId,
        companyId: q.rfq.companyId,
        promisedDate: q.deliveryDate,
        events: { create: { status: "CONFIRMED", note: "Quote accepted", actorId: user.id } },
      },
    });
    const count = await tx.invoice.count();
    const invoice = await tx.invoice.create({
      data: {
        orderId: order.id,
        number: `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`,
        subtotal: totals.subtotal,
        vat: totals.vat,
        total: totals.total,
        dueDate: due,
      },
    });
    return { quote, order, invoice };
  });
  res.json({
    quote: serializeQuote(result.quote, user.role),
    order: result.order,
    invoice: result.invoice,
  });
});

appRouter.get("/orders", async (req, res) => {
  const { user } = req as AuthedRequest;
  const where =
    user.role === "SALESMAN"
      ? { salesman: { userId: user.id } }
      : user.role === "COMPANY"
        ? { company: { userId: user.id } }
        : {};
  const rows = await prisma.order.findMany({
    where,
    include: {
      company: true,
      salesman: true,
      quote: { include: { lines: true, rfq: true } },
      events: { orderBy: { createdAt: "asc" } },
      invoice: true,
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(rows.map((o) => serializeOrder(o, user.role)));
});

appRouter.get("/orders/:id", async (req, res) => {
  const { user } = req as AuthedRequest;
  const o = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      company: true,
      salesman: true,
      quote: { include: { lines: true, rfq: true } },
      events: { orderBy: { createdAt: "asc" } },
      invoice: { include: { payments: true } },
      review: true,
      messages: true,
    },
  });
  if (!o) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const allowed =
    user.role === "ADMIN" ||
    (user.role === "SALESMAN" && o.salesman.userId === user.id) ||
    (user.role === "COMPANY" && o.company.userId === user.id);
  if (!allowed) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  res.json(serializeOrder(o, user.role));
});

appRouter.post("/orders/:id/status", requireRole("SALESMAN"), async (req, res) => {
  const { user } = req as AuthedRequest;
  const body = z.object({ status: z.enum(["SENT_TO_FACTORY", "IN_PRODUCTION", "SHIPPED", "DELIVERED"]), note: z.string().max(500).optional() }).parse(req.body);
  const o = await prisma.order.findUnique({ where: { id: req.params.id }, include: { salesman: true } });
  if (!o || o.salesman.userId !== user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (o.status === "RECEIVED") {
    res.status(400).json({ error: "Order already received" });
    return;
  }
  const next = body.status as OrderStatus;
  const updated = await prisma.order.update({
    where: { id: o.id },
    data: {
      status: next,
      deliveredAt: next === "DELIVERED" ? new Date() : o.deliveredAt,
      events: { create: { status: next, note: body.note, actorId: user.id } },
    },
    include: { quote: { include: { lines: true } }, events: true },
  });
  res.json(serializeOrder(updated, user.role));
});

appRouter.post("/orders/:id/receive", requireRole("COMPANY"), async (req, res) => {
  const { user } = req as AuthedRequest;
  const o = await prisma.order.findUnique({ where: { id: req.params.id }, include: { company: true, salesman: true } });
  if (!o || o.company.userId !== user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (o.status !== "DELIVERED") {
    res.status(400).json({ error: "Confirm only after delivered" });
    return;
  }
  const updated = await prisma.order.update({
    where: { id: o.id },
    data: {
      status: "RECEIVED",
      receivedAt: new Date(),
      events: { create: { status: "RECEIVED", note: "Receipt confirmed", actorId: user.id } },
    },
    include: { quote: { include: { lines: true } } },
  });
  await recalcTrustScore(o.salesmanId);
  res.json(serializeOrder(updated, user.role));
});

appRouter.get("/invoices", async (req, res) => {
  const { user } = req as AuthedRequest;
  const where =
    user.role === "SALESMAN"
      ? { order: { salesman: { userId: user.id } } }
      : user.role === "COMPANY"
        ? { order: { company: { userId: user.id } } }
        : {};
  const rows = await prisma.invoice.findMany({
    where,
    include: { payments: true, order: { include: { company: true, salesman: true, quote: { include: { lines: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(rows.map((i) => ({ ...i, order: serializeOrder(i.order, user.role) })));
});

appRouter.post("/invoices/:id/pay", requireRole("SALESMAN"), async (req, res) => {
  const { user } = req as AuthedRequest;
  const body = z
    .object({
      amount: money,
      method: z.enum(["BANK_TRANSFER", "CASH", "CHEQUE"]),
      reference: z.string().max(80).optional(),
    })
    .parse(req.body);
  const inv = await prisma.invoice.findUnique({
    where: { id: req.params.id },
    include: { payments: true, order: { include: { salesman: true } } },
  });
  if (!inv || inv.order.salesman.userId !== user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const paid = inv.payments.reduce((s, p) => s + p.amount, 0) + body.amount;
  const status = paid >= inv.total - 0.01 ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID";
  await prisma.payment.create({
    data: { invoiceId: inv.id, amount: body.amount, method: body.method, reference: body.reference },
  });
  const updated = await prisma.invoice.update({
    where: { id: inv.id },
    data: { status },
    include: { payments: true },
  });
  res.json(updated);
});

appRouter.post("/reviews", requireRole("COMPANY"), async (req, res) => {
  const { user } = req as AuthedRequest;
  const body = z
    .object({
      orderId: z.string(),
      quality: z.number().int().min(1).max(5),
      deliverySpeed: z.number().int().min(1).max(5),
      professionalism: z.number().int().min(1).max(5),
      body: z.string().min(2).max(2000),
      wouldOrderAgain: z.boolean().default(true),
    })
    .parse(req.body);
  const o = await prisma.order.findUnique({
    where: { id: body.orderId },
    include: { company: true, review: true },
  });
  if (!o || o.company.userId !== user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (o.status !== "RECEIVED") {
    res.status(400).json({ error: "Review after receipt only" });
    return;
  }
  if (o.review) {
    res.status(409).json({ error: "Already reviewed" });
    return;
  }
  const review = await prisma.review.create({
    data: {
      orderId: o.id,
      salesmanId: o.salesmanId,
      authorId: user.id,
      quality: body.quality,
      deliverySpeed: body.deliverySpeed,
      professionalism: body.professionalism,
      body: stripHtml(body.body),
      wouldOrderAgain: body.wouldOrderAgain,
    },
  });
  await recalcTrustScore(o.salesmanId);
  res.status(201).json(review);
});

appRouter.get("/reviews", async (req, res) => {
  const { user } = req as AuthedRequest;
  const where =
    user.role === "SALESMAN"
      ? { salesman: { userId: user.id }, archived: false }
      : user.role === "COMPANY"
        ? { authorId: user.id }
        : {};
  const rows = await prisma.review.findMany({
    where,
    include: { order: { include: { company: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(rows);
});

appRouter.post("/messages", async (req, res) => {
  const { user } = req as AuthedRequest;
  const body = z
    .object({ orderId: z.string().optional(), rfqId: z.string().optional(), body: z.string().min(1).max(2000) })
    .parse(req.body);
  if (!body.orderId && !body.rfqId) {
    res.status(400).json({ error: "Thread required" });
    return;
  }
  if (body.orderId) {
    const o = await prisma.order.findUnique({
      where: { id: body.orderId },
      include: { salesman: true, company: true },
    });
    const ok =
      user.role === "ADMIN" ||
      (o && (o.salesman.userId === user.id || o.company.userId === user.id));
    if (!ok) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  }
  const msg = await prisma.message.create({
    data: { senderId: user.id, orderId: body.orderId, rfqId: body.rfqId, body: stripHtml(body.body) },
  });
  res.status(201).json(msg);
});

appRouter.post("/admin/credentials/:id", requireRole("ADMIN"), async (req, res) => {
  const body = z.object({ status: z.enum(["APPROVED", "REJECTED"]) }).parse(req.body);
  const cred = await prisma.credential.update({
    where: { id: req.params.id },
    data: { status: body.status, reviewedBy: (req as AuthedRequest).user.id },
  });
  const sm = await prisma.salesmanProfile.findUnique({ where: { userId: cred.userId } });
  if (sm) await recalcTrustScore(sm.id);
  res.json(cred);
});

appRouter.get("/export/orders.csv", async (req, res) => {
  const { user } = req as AuthedRequest;
  if (user.role !== "SALESMAN") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const rows = await prisma.order.findMany({
    where: { salesman: { userId: user.id } },
    include: { company: true, quote: { include: { lines: true } } },
  });
  const lines = ["id,company,status,createdAt,total"];
  for (const o of rows) {
    const t = quoteTotals(o.quote.lines, o.quote.discount);
    lines.push(`${o.id},${o.company.legalName},${o.status},${o.createdAt.toISOString()},${t.total}`);
  }
  res.setHeader("Content-Type", "text/csv");
  res.send(lines.join("\n"));
});
