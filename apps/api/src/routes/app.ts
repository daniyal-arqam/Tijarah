import { Router, type Request } from "express";
import { z } from "zod";
import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth.js";
import { serializeQuote, serializeOrder, quoteTotals, salesmanProfit } from "../lib/money.js";
import { recalcTrustScore, trustTen } from "../lib/trustScore.js";
import { publicUser } from "../lib/publicUser.js";
import { stripHtml } from "../lib/sanitize.js";
import { publicFactory, salesmanCard } from "../lib/factoryView.js";
import { notify } from "../lib/notify.js";
import { appOrigin, proposalEmail, sendMail } from "../lib/mail.js";
import { salesmanPublicPayload } from "../lib/salesmanPublic.js";
import type { OrderStatus, PaymentTerms, QuoteStatus } from "@prisma/client";

export const appRouter = Router();
appRouter.use(requireAuth);

const text = z.string().min(1).max(4000);
const money = z.number().nonnegative().max(1e9);
const LIST_CAP = 200;

function csvCell(value: string | number) {
  let s = String(value);
  if (/^[=+\-@|]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function routeParam(v: string | string[] | undefined) {
  const s = Array.isArray(v) ? v[0] : v;
  if (!s) {
    const err = new Error("Missing id") as Error & { status: number };
    err.status = 400;
    throw err;
  }
  return s;
}

function currentUser(req: Request) {
  return (req as unknown as AuthedRequest).user;
}

function parseJsonArr(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

appRouter.get("/me", async (req, res) => {
  const user = currentUser(req);
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    include: { salesman: { include: { factory: true } }, company: true, factory: true },
  });
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const base = publicUser(row) as Record<string, unknown>;
  if (row.salesman) {
    const { commissionPercent: _unused, ...sm } = row.salesman;
    base.salesman = {
      ...sm,
      trustScore: trustTen(row.salesman.trustScore),
      factory: user.role === "SALESMAN" || user.role === "ADMIN" ? publicFactory(row.salesman.factory) : null,
    };
  }
  if (row.factory) base.factory = publicFactory(row.factory);
  res.json(base);
});

appRouter.patch("/me", async (req, res) => {
  const user = currentUser(req);
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
      photoUrl: z.string().max(100_000).optional(),
      legalName: z.string().min(2).max(120).optional(),
      logoUrl: z.string().max(100_000).optional(),
      industry: z.string().max(80).optional(),
      size: z.string().max(40).optional(),
      city: z.string().max(40).optional(),
      crNumber: z.string().max(40).optional(),
      vatNumber: z.string().max(40).optional(),
      title: z.string().max(80).optional(),
      languages: z.array(z.string()).optional(),
      certifications: z.string().max(400).optional(),
      coverageNotes: z.string().max(1000).optional(),
      factoryId: z.string().optional(),
      about: z.string().max(2000).optional(),
      address: z.string().max(200).optional(),
      capacityTons: z.number().int().min(0).max(1e7).optional(),
      tradeName: z.string().max(120).optional(),
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
        title: body.title,
        languages: body.languages ? JSON.stringify(body.languages) : undefined,
        certifications: body.certifications,
        coverageNotes: body.coverageNotes,
        factoryId: body.factoryId === "" ? null : body.factoryId,
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
  if (user.role === "FACTORY") {
    await prisma.factoryProfile.update({
      where: { userId: user.id },
      data: {
        legalName: body.legalName,
        tradeName: body.tradeName,
        city: body.city,
        crNumber: body.crNumber,
        vatNumber: body.vatNumber,
        phone: body.phone,
        address: body.address,
        about: body.about,
        specialties: body.specialties ? JSON.stringify(body.specialties) : undefined,
        capacityTons: body.capacityTons,
        logoUrl: body.logoUrl,
      },
    });
  }
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    include: { salesman: { include: { factory: true } }, company: true, factory: true },
  });
  res.json(publicUser(row));
});

appRouter.get("/dashboard", async (req, res) => {
  const user = currentUser(req);
  if (user.role === "SALESMAN") {
    const sm = await prisma.salesmanProfile.findUnique({
      where: { userId: user.id },
      include: { factory: true },
    });
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
    const profitEarned = quotes
      .filter((q) => q.status === "ACCEPTED")
      .reduce((s, q) => s + salesmanProfit(quoteTotals(q.lines, q.discount).subtotal, q.factoryCostEstimate), 0);
    const openNeeds = await prisma.rfq.count({ where: { status: "OPEN", salesmanId: null } });
    res.json({
      trustScore: trustTen(sm.trustScore),
      paidRevenue: paid,
      ordersThisMonth: ordersMonth,
      openQuotes: quotes.filter((q) => ["SENT", "VIEWED", "COUNTERED"].includes(q.status)).length,
      pendingDeliveries: orders.filter((o) => !["RECEIVED"].includes(o.status)).length,
      onTimePct: Math.round(onTime * 100),
      profitEarned,
      millName: sm.factory?.legalName ?? null,
      openRfqs: rfqs.length + openNeeds,
      openNeeds,
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
      openProposals: await prisma.proposal.count({ where: { companyId: co.id, status: { in: ["SENT", "OPENED"] } } }),
      orders: orders.map((o) => serializeOrder(o, user.role)),
      invoices,
    });
    return;
  }
  if (user.role === "FACTORY") {
    const mill = await prisma.factoryProfile.findUnique({
      where: { userId: user.id },
      include: { salesmen: { include: { orders: true } } },
    });
    if (!mill) {
      res.status(404).json({ error: "No profile" });
      return;
    }
    const jobs = await prisma.order.findMany({
      where: { factoryId: mill.id },
      include: { salesman: true, quote: { include: { lines: true, rfq: true } } },
      orderBy: { createdAt: "desc" },
    });
    const pendingEstimates = await prisma.factoryEstimate.count({
      where: { factoryId: mill.id, status: "REQUESTED" },
    });
    const unpaid = jobs.filter((j) => !j.factoryPaidAt).reduce((s, j) => s + j.factoryCost, 0);
    const paidMill = jobs.filter((j) => j.factoryPaidAt).reduce((s, j) => s + j.factoryCost, 0);
    res.json({
      mill: publicFactory(mill),
      pendingEstimates,
      openJobs: jobs.filter((j) => j.status !== "RECEIVED").length,
      unpaidMill: unpaid,
      paidMill,
      recentJobs: jobs.slice(0, 8).map((o) => serializeOrder(o, user.role)),
      salesmen: mill.salesmen.map((s) => ({
        ...salesmanCard(s),
        orders: s.orders.filter((o) => o.factoryId === mill.id).length || s.orders.length,
      })),
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
  const user = currentUser(req);
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
    where: { listId_companyId: { listId: list.id, companyId: routeParam(req.params.companyId) } },
    create: { listId: list.id, companyId: routeParam(req.params.companyId) },
    update: {},
  });
  res.json(item);
});

appRouter.get("/leads", requireRole("SALESMAN"), async (req, res) => {
  const user = currentUser(req);
  const sm = await prisma.salesmanProfile.findUnique({ where: { userId: user.id } });
  const lists = await prisma.leadList.findMany({
    where: { salesmanId: sm!.id },
    include: { items: { include: { company: true } } },
  });
  res.json(lists);
});

appRouter.post("/invites", requireRole("SALESMAN"), async (req, res) => {
  const user = currentUser(req);
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
  const user = currentUser(req);
  const co = await prisma.companyProfile.findUnique({ where: { userId: user.id } });
  const specialty = String(req.query.specialty ?? "");
  const city = String(req.query.city ?? "");
  const rows = await prisma.salesmanProfile.findMany({
    include: {
      reviews: { where: { archived: false } },
      user: { select: { emailVerified: true, phoneVerified: true } },
    },
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
      match += Math.round((trustTen(s.trustScore) / 10) * 15);
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
        bio: s.bio,
        photoUrl: s.photoUrl,
        yearsExperience: s.yearsExperience,
        cities,
        specialties: specs,
        trustScore: trustTen(s.trustScore),
        match: Math.min(100, match),
        rating: Math.round(avg * 10) / 10,
        reviewCount: s.reviews.length,
      };
    })
    .sort((a, b) => b.match - a.match);
  res.json(mapped);
});

appRouter.get("/salesmen/public/:slug", async (req, res) => {
  const s = await salesmanPublicPayload(routeParam(req.params.slug));
  if (!s) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(s);
});

const rfqSchema = z.object({
  salesmanId: z.string().optional(),
  title: text,
  specialty: z.string().min(1),
  specs: text,
  quantity: money,
  unit: z.string().max(20).default("pcs"),
  destinationCity: z.string().min(1),
  neededBy: z.string().optional(),
  customize: z.boolean().optional(),
});

appRouter.post("/rfqs", requireRole("COMPANY"), async (req, res) => {
  const user = currentUser(req);
  const body = rfqSchema.parse(req.body);
  const co = await prisma.companyProfile.findUnique({ where: { userId: user.id } });
  const rfq = await prisma.rfq.create({
    data: {
      companyId: co!.id,
      salesmanId: body.salesmanId || null,
      title: stripHtml(body.title),
      specialty: body.specialty,
      specs: stripHtml(body.specs),
      quantity: body.quantity,
      unit: body.unit,
      destinationCity: body.destinationCity,
      neededBy: body.neededBy ? new Date(body.neededBy) : undefined,
      customize: body.customize ?? false,
    },
  });
  const salesmen = await prisma.salesmanProfile.findMany({
    select: { userId: true },
    take: 40,
    orderBy: { trustScore: "desc" },
  });
  await Promise.all(
    salesmen.map((s) =>
      notify(s.userId, "NEED", `New need: ${rfq.title}`, `${co!.legalName} listed a product. Get mill estimates, then send your rate.`, "/app/rfqs"),
    ),
  );
  res.status(201).json(rfq);
});

appRouter.get("/rfqs", async (req, res) => {
  const user = currentUser(req);
  if (user.role === "FACTORY") {
    res.json([]);
    return;
  }
  const sm = user.role === "SALESMAN" ? await prisma.salesmanProfile.findUnique({ where: { userId: user.id } }) : null;
  const where =
    user.role === "SALESMAN"
      ? {
          OR: [{ status: "OPEN" }, { salesmanId: sm!.id }, { quotes: { some: { salesmanId: sm!.id } } }],
        }
      : user.role === "COMPANY"
        ? { company: { userId: user.id } }
        : {};
  const rows = await prisma.rfq.findMany({
    where,
    include: {
      company: true,
      salesman: true,
      quotes: { include: { lines: true } },
      estimates: { include: { factory: true } },
      proposals: { include: { salesman: true } },
    },
    orderBy: { createdAt: "desc" },
    take: LIST_CAP,
  });
  res.json(
    rows.map((r) => {
      const estimates =
        user.role === "SALESMAN"
          ? r.estimates
              .filter((e) => e.salesmanId === sm!.id)
              .map((e) => ({
                ...e,
                factory: publicFactory(e.factory),
              }))
          : [];
      return {
        ...r,
        salesman: r.salesman ? salesmanCard(r.salesman) : null,
        company: user.role === "COMPANY" ? { legalName: r.company.legalName } : r.company,
        quotes: r.quotes.map((q) => serializeQuote(q, user.role)),
        estimates,
        proposalCount: r.proposals.length,
        proposals:
          user.role === "COMPANY"
            ? r.proposals.map((p) => ({
                id: p.id,
                status: p.status,
                sellPrice: p.sellPrice,
                salesman: salesmanCard(p.salesman),
              }))
            : undefined,
      };
    }),
  );
});

const quoteSchema = z.object({
  rfqId: z.string(),
  paymentTerms: z.enum(["ADVANCE_50", "NET_15", "NET_30", "NET_45", "COD"]).default("NET_30"),
  deliveryDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
  factoryCostEstimate: money.optional(),
  discount: money.optional(),
  lines: z.array(z.object({ product: text, quantity: money, unitPrice: money })).min(1),
});

appRouter.post("/quotes", requireRole("SALESMAN"), async (req, res) => {
  const user = currentUser(req);
  const body = quoteSchema.parse(req.body);
  const sm = await prisma.salesmanProfile.findUnique({ where: { userId: user.id } });
  const rfq = await prisma.rfq.findUnique({ where: { id: body.rfqId } });
  const openBoard = rfq && (rfq.salesmanId == null || rfq.salesmanId === sm!.id);
  if (!rfq || !openBoard) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const last = await prisma.quote.findFirst({ where: { rfqId: rfq.id, salesmanId: sm!.id }, orderBy: { version: "desc" } });
  const quote = await prisma.quote.create({
    data: {
      rfqId: rfq.id,
      salesmanId: sm!.id,
      version: (last?.version ?? 0) + 1,
      status: "SENT",
      paymentTerms: body.paymentTerms as PaymentTerms,
      deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : undefined,
      notes: body.notes ? stripHtml(body.notes) : undefined,
      factoryCostEstimate: body.factoryCostEstimate ?? 0,
      discount: body.discount ?? 0,
      lines: { create: body.lines },
    },
    include: { lines: true, rfq: true },
  });
  res.status(201).json(serializeQuote(quote, user.role));
});

appRouter.get("/quotes", async (req, res) => {
  const user = currentUser(req);
  if (user.role === "FACTORY") {
    res.json([]);
    return;
  }
  const where =
    user.role === "SALESMAN"
      ? { salesman: { userId: user.id } }
      : user.role === "COMPANY"
        ? { rfq: { company: { userId: user.id } } }
        : {};
  const rows = await prisma.quote.findMany({
    where,
    include: { lines: true, salesman: true, rfq: { include: { company: true } } },
    orderBy: { createdAt: "desc" },
    take: LIST_CAP,
  });
  res.json(rows.map((q) => serializeQuote(q, user.role)));
});

appRouter.get("/quotes/:id", async (req, res) => {
  const user = currentUser(req);
  const q = await prisma.quote.findUnique({
    where: { id: routeParam(req.params.id) },
    include: { lines: true, salesman: true, rfq: { include: { company: true, salesman: true } } },
  });
  if (!q) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const allowed =
    user.role === "ADMIN" ||
    (user.role === "SALESMAN" && q.salesman.userId === user.id) ||
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
  const user = currentUser(req);
  const body = z.object({ total: money, date: z.string().optional() }).parse(req.body);
  const q = await prisma.quote.findUnique({
    where: { id: routeParam(req.params.id) },
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
  const user = currentUser(req);
  const body = z.object({ accept: z.boolean() }).parse(req.body);
  const q = await prisma.quote.findUnique({
    where: { id: routeParam(req.params.id) },
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
        factoryId: q.salesman.factoryId,
        factoryCost: q.factoryCostEstimate,
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
  const user = currentUser(req);
  const mill = user.role === "FACTORY" ? await prisma.factoryProfile.findUnique({ where: { userId: user.id } }) : null;
  const where =
    user.role === "SALESMAN"
      ? { salesman: { userId: user.id } }
      : user.role === "COMPANY"
        ? { company: { userId: user.id } }
        : user.role === "FACTORY"
          ? { factoryId: mill!.id }
          : {};
  const rows = await prisma.order.findMany({
    where,
    include: {
      company: true,
      salesman: true,
      factory: true,
      quote: { include: { lines: true, rfq: true } },
      events: { orderBy: { createdAt: "asc" } },
      invoice: true,
      reviews: true,
    },
    orderBy: { createdAt: "desc" },
    take: LIST_CAP,
  });
  res.json(rows.map((o) => serializeOrder(o, user.role)));
});

appRouter.get("/orders/:id", async (req, res) => {
  const user = currentUser(req);
  const o = await prisma.order.findUnique({
    where: { id: routeParam(req.params.id) },
    include: {
      company: true,
      salesman: true,
      factory: true,
      quote: { include: { lines: true, rfq: true } },
      events: { orderBy: { createdAt: "asc" } },
      invoice: { include: { payments: true } },
      reviews: true,
      messages: true,
    },
  });
  if (!o) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const mill = user.role === "FACTORY" ? await prisma.factoryProfile.findUnique({ where: { userId: user.id } }) : null;
  const allowed =
    user.role === "ADMIN" ||
    (user.role === "SALESMAN" && o.salesman.userId === user.id) ||
    (user.role === "COMPANY" && o.company.userId === user.id) ||
    (user.role === "FACTORY" && mill && o.factoryId === mill.id);
  if (!allowed) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  res.json(serializeOrder(o, user.role));
});

appRouter.post("/orders/:id/status", requireRole("SALESMAN"), async (req, res) => {
  const user = currentUser(req);
  const body = z
    .object({
      status: z.enum(["SENT_TO_FACTORY", "IN_PRODUCTION", "SHIPPED", "DELIVERED"]),
      note: z.string().max(500).optional(),
      factoryId: z.string().optional(),
      factoryCost: money.optional(),
    })
    .parse(req.body);
  const o = await prisma.order.findUnique({ where: { id: routeParam(req.params.id) }, include: { salesman: true } });
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
      factoryId: body.factoryId ?? o.factoryId,
      factoryCost: body.factoryCost ?? o.factoryCost,
      deliveredAt: next === "DELIVERED" ? new Date() : o.deliveredAt,
      events: { create: { status: next, note: body.note, actorId: user.id } },
    },
    include: { quote: { include: { lines: true } }, events: true, salesman: true, factory: true },
  });
  if (next === "SENT_TO_FACTORY" && updated.factoryId) {
    const mill = await prisma.factoryProfile.findUnique({ where: { id: updated.factoryId } });
    if (mill) {
      await notify(
        mill.userId,
        "JOB",
        "New mill job from a salesman",
        `${o.salesman.displayName} placed a job at ${updated.factoryCost} SAR.`,
        "/app/orders",
      );
    }
  }
  res.json(serializeOrder(updated, user.role));
});

appRouter.post("/orders/:id/pay-factory", requireRole("SALESMAN"), async (req, res) => {
  const user = currentUser(req);
  const o = await prisma.order.findUnique({
    where: { id: routeParam(req.params.id) },
    include: { salesman: true, factory: true, quote: { include: { lines: true } } },
  });
  if (!o || o.salesman.userId !== user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (!o.factoryId || o.factoryCost <= 0) {
    res.status(400).json({ error: "Pick a mill and factory cost first" });
    return;
  }
  if (o.factoryPaidAt) {
    res.status(409).json({ error: "Factory already paid" });
    return;
  }
  const updated = await prisma.order.update({
    where: { id: o.id },
    data: {
      factoryPaidAt: new Date(),
      events: { create: { status: o.status, note: `Paid mill ${o.factoryCost} SAR`, actorId: user.id } },
    },
    include: { quote: { include: { lines: true } }, salesman: true, factory: true, events: true },
  });
  if (o.factory) {
    await notify(
      o.factory.userId,
      "MILL_PAID",
      "Salesman paid this job",
      `${o.salesman.displayName} paid ${o.factoryCost} SAR for a mill job.`,
      "/app/orders",
    );
  }
  res.json(serializeOrder(updated, user.role));
});

appRouter.post("/orders/:id/receive", requireRole("COMPANY"), async (req, res) => {
  const user = currentUser(req);
  const o = await prisma.order.findUnique({ where: { id: routeParam(req.params.id) }, include: { company: true, salesman: true } });
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
  const user = currentUser(req);
  if (user.role === "FACTORY") {
    res.json([]);
    return;
  }
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
    take: LIST_CAP,
  });
  res.json(rows.map((i) => ({ ...i, order: serializeOrder(i.order, user.role) })));
});

appRouter.post("/invoices/:id/pay", requireRole("SALESMAN", "COMPANY"), async (req, res) => {
  const user = currentUser(req);
  const body = z
    .object({
      amount: money,
      method: z.enum(["BANK_TRANSFER", "CASH", "CHEQUE"]),
      reference: z.string().max(80).optional(),
    })
    .parse(req.body);
  const inv = await prisma.invoice.findUnique({
    where: { id: routeParam(req.params.id) },
    include: { payments: true, order: { include: { salesman: true, company: true } } },
  });
  const ok =
    inv &&
    ((user.role === "SALESMAN" && inv.order.salesman.userId === user.id) ||
      (user.role === "COMPANY" && inv.order.company.userId === user.id));
  if (!inv || !ok) {
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

appRouter.post("/reviews", requireRole("COMPANY", "FACTORY"), async (req, res) => {
  const user = currentUser(req);
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
    include: { company: true, factory: true, reviews: true },
  });
  if (!o) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const asCompany = user.role === "COMPANY" && o.company.userId === user.id;
  const asFactory = user.role === "FACTORY" && o.factory?.userId === user.id;
  if (!asCompany && !asFactory) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (asCompany && o.status !== "RECEIVED") {
    res.status(400).json({ error: "Review after receipt only" });
    return;
  }
  if (asFactory && !o.factoryPaidAt) {
    res.status(400).json({ error: "Review after mill payment only" });
    return;
  }
  if (o.reviews.some((r) => r.authorId === user.id)) {
    res.status(409).json({ error: "Already reviewed" });
    return;
  }
  const review = await prisma.review.create({
    data: {
      orderId: o.id,
      salesmanId: o.salesmanId,
      authorId: user.id,
      authorRole: user.role,
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
  const user = currentUser(req);
  const where =
    user.role === "SALESMAN"
      ? { salesman: { userId: user.id }, archived: false }
      : user.role === "COMPANY"
        ? { authorId: user.id }
        : user.role === "FACTORY"
          ? { authorId: user.id }
          : {};
  const rows = await prisma.review.findMany({
    where,
    include: { order: { include: { company: true, factory: true } } },
    orderBy: { createdAt: "desc" },
    take: LIST_CAP,
  });
  res.json(
    rows.map((r) => ({
      ...r,
      from: r.authorRole,
      order:
        user.role === "FACTORY"
          ? { id: r.order.id, millJob: true }
          : user.role === "COMPANY"
            ? { id: r.order.id }
            : {
                id: r.order.id,
                company: r.authorRole === "COMPANY" ? { legalName: r.order.company.legalName } : undefined,
                factory: r.authorRole === "FACTORY" && r.order.factory ? { legalName: r.order.factory.legalName } : undefined,
              },
    })),
  );
});

appRouter.post("/messages", async (req, res) => {
  const user = currentUser(req);
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
      include: { salesman: true, company: true, factory: true },
    });
    const ok =
      user.role === "ADMIN" ||
      (o &&
        (o.salesman.userId === user.id ||
          o.company.userId === user.id ||
          o.factory?.userId === user.id));
    if (!ok) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  }
  if (body.rfqId) {
    const rfq = await prisma.rfq.findUnique({
      where: { id: body.rfqId },
      include: { company: true, salesman: true },
    });
    const ok =
      user.role === "ADMIN" ||
      (rfq &&
        (rfq.company.userId === user.id ||
          rfq.salesman?.userId === user.id ||
          (user.role === "SALESMAN" && rfq.status === "OPEN")));
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
    where: { id: routeParam(req.params.id) },
    data: { status: body.status, reviewedBy: currentUser(req).id },
  });
  const sm = await prisma.salesmanProfile.findUnique({ where: { userId: cred.userId } });
  if (sm) await recalcTrustScore(sm.id);
  res.json(cred);
});

appRouter.get("/factories", requireRole("SALESMAN", "ADMIN"), async (_req, res) => {
  const rows = await prisma.factoryProfile.findMany({ take: LIST_CAP });
  res.json(rows.map(publicFactory));
});

appRouter.get("/notifications", async (req, res) => {
  const user = currentUser(req);
  const rows = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  res.json(rows);
});

appRouter.post("/notifications/:id/read", async (req, res) => {
  const user = currentUser(req);
  const row = await prisma.notification.updateMany({
    where: { id: routeParam(req.params.id), userId: user.id },
    data: { read: true },
  });
  res.json({ ok: row.count > 0 });
});

function mapEstimate(
  e: {
    id: string;
    status: string;
    amount: number | null;
    readyBy: Date | null;
    notes: string | null;
    createdAt: Date;
    rfq: { id: string; title: string; specs: string; quantity: number; unit: string; destinationCity: string; customize: boolean };
    factory: Parameters<typeof publicFactory>[0];
    salesman: Parameters<typeof salesmanCard>[0];
  },
  role: string,
) {
  return {
    id: e.id,
    status: e.status,
    amount: e.amount,
    readyBy: e.readyBy,
    notes: e.notes,
    createdAt: e.createdAt,
    rfq: e.rfq,
    factory: role === "COMPANY" ? undefined : publicFactory(e.factory),
    salesman: salesmanCard(e.salesman),
  };
}

appRouter.get("/estimates", requireRole("SALESMAN", "FACTORY", "ADMIN"), async (req, res) => {
  const user = currentUser(req);
  const include = { rfq: true, factory: true, salesman: true } as const;
  if (user.role === "SALESMAN") {
    const sm = await prisma.salesmanProfile.findUnique({ where: { userId: user.id } });
    const rows = await prisma.factoryEstimate.findMany({
      where: { salesmanId: sm!.id },
      include,
      orderBy: [{ amount: "asc" }, { readyBy: "asc" }, { createdAt: "desc" }],
    });
    res.json(rows.map((e) => mapEstimate(e, user.role)));
    return;
  }
  if (user.role === "FACTORY") {
    const mill = await prisma.factoryProfile.findUnique({ where: { userId: user.id } });
    const rows = await prisma.factoryEstimate.findMany({
      where: { factoryId: mill!.id },
      include,
      orderBy: { createdAt: "desc" },
    });
    res.json(rows.map((e) => mapEstimate(e, user.role)));
    return;
  }
  const rows = await prisma.factoryEstimate.findMany({ include, orderBy: { createdAt: "desc" } });
  res.json(rows.map((e) => mapEstimate(e, user.role)));
});

appRouter.post("/estimates", requireRole("SALESMAN"), async (req, res) => {
  const user = currentUser(req);
  const body = z.object({ rfqId: z.string(), factoryId: z.string().optional(), factoryIds: z.array(z.string()).optional() }).parse(req.body);
  const ids = body.factoryIds?.length ? body.factoryIds : body.factoryId ? [body.factoryId] : [];
  if (!ids.length) {
    res.status(400).json({ error: "Pick at least one factory" });
    return;
  }
  const sm = await prisma.salesmanProfile.findUnique({ where: { userId: user.id } });
  const rfq = await prisma.rfq.findUnique({ where: { id: body.rfqId } });
  if (!sm || !rfq) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const created = [];
  for (const factoryId of ids) {
    const mill = await prisma.factoryProfile.findUnique({ where: { id: factoryId } });
    if (!mill) continue;
    const existing = await prisma.factoryEstimate.findFirst({
      where: { rfqId: rfq.id, factoryId: mill.id, salesmanId: sm.id, status: { in: ["REQUESTED", "QUOTED"] } },
    });
    if (existing) {
      created.push(existing);
      continue;
    }
    const row = await prisma.factoryEstimate.create({
      data: { rfqId: rfq.id, factoryId: mill.id, salesmanId: sm.id },
      include: { rfq: true, factory: true, salesman: true },
    });
    await notify(
      mill.userId,
      "ESTIMATE",
      "Estimate request",
      `${sm.displayName} needs a mill price and ready date for ${rfq.title}.`,
      "/app/estimates",
    );
    created.push(mapEstimate(row, user.role));
  }
  res.status(201).json({ count: created.length, estimates: created });
});

appRouter.patch("/estimates/:id", requireRole("FACTORY"), async (req, res) => {
  const user = currentUser(req);
  const body = z
    .object({
      amount: money,
      readyBy: z.string().optional(),
      notes: z.string().max(1000).optional(),
      decline: z.boolean().optional(),
    })
    .parse(req.body);
  const mill = await prisma.factoryProfile.findUnique({ where: { userId: user.id } });
  const row = await prisma.factoryEstimate.findUnique({
    where: { id: routeParam(req.params.id) },
    include: { salesman: true, rfq: true },
  });
  if (!mill || !row || row.factoryId !== mill.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const updated = await prisma.factoryEstimate.update({
    where: { id: row.id },
    data: body.decline
      ? { status: "DECLINED", notes: body.notes ? stripHtml(body.notes) : row.notes }
      : {
          status: "QUOTED",
          amount: body.amount,
          readyBy: body.readyBy ? new Date(body.readyBy) : undefined,
          notes: body.notes ? stripHtml(body.notes) : undefined,
        },
    include: { rfq: true, factory: true, salesman: true },
  });
  await notify(
    row.salesman.userId,
    "ESTIMATE",
    body.decline ? "Mill declined estimate" : "Mill estimate in",
    body.decline
      ? `${mill.legalName} declined ${row.rfq.title}.`
      : `${mill.legalName} quoted ${body.amount} SAR for ${row.rfq.title}.`,
    "/app/rfqs",
  );
  res.json(mapEstimate(updated, user.role));
});

appRouter.post("/estimates/:id/accept", requireRole("SALESMAN"), async (req, res) => {
  const user = currentUser(req);
  const sm = await prisma.salesmanProfile.findUnique({ where: { userId: user.id } });
  const row = await prisma.factoryEstimate.findUnique({
    where: { id: routeParam(req.params.id) },
    include: { rfq: true, factory: true, salesman: true },
  });
  if (!sm || !row || row.salesmanId !== sm.id || row.status !== "QUOTED") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  await prisma.factoryEstimate.updateMany({
    where: { rfqId: row.rfqId, salesmanId: sm.id, id: { not: row.id }, status: { in: ["REQUESTED", "QUOTED"] } },
    data: { status: "DECLINED" },
  });
  const updated = await prisma.factoryEstimate.update({
    where: { id: row.id },
    data: { status: "ACCEPTED" },
    include: { rfq: true, factory: true, salesman: true },
  });
  await notify(
    row.factory.userId,
    "ESTIMATE",
    "Your mill was picked",
    `${sm.displayName} picked your estimate for ${row.rfq.title}.`,
    "/app/estimates",
  );
  res.json(mapEstimate(updated, user.role));
});

function mapProposal(
  p: {
    id: string;
    subject: string;
    body: string;
    status: string;
    sentAt: Date;
    openedAt: Date | null;
    selectedAt: Date | null;
    followUpNotifiedAt: Date | null;
    sellPrice: number | null;
    factoryCost: number | null;
    readyBy: Date | null;
    rfqId: string | null;
    rfq?: { id: string; title: string } | null;
    salesman: {
      id: string;
      displayName: string;
      slug: string;
      photoUrl: string | null;
      bio: string | null;
      title: string | null;
      yearsExperience: number;
      cities: string;
      specialties: string;
      trustScore: number;
      waNumber: string | null;
      factory: Parameters<typeof publicFactory>[0];
    };
    company: { id: string; legalName: string; city: string | null; contactName: string | null };
  },
  role: string,
) {
  const sell = p.sellPrice;
  return {
    id: p.id,
    subject: p.subject,
    body: p.body,
    status: p.status,
    sentAt: p.sentAt,
    openedAt: p.openedAt,
    selectedAt: p.selectedAt,
    followUpDue: Boolean(p.followUpNotifiedAt),
    sellPrice: sell,
    readyBy: p.readyBy,
    rfqId: p.rfqId,
    rfqTitle: p.rfq?.title,
    factoryCost: role === "COMPANY" ? undefined : p.factoryCost,
    profit: role === "COMPANY" || sell == null || p.factoryCost == null ? undefined : salesmanProfit(sell, p.factoryCost),
    salesman: salesmanCard(p.salesman),
    company: role === "SALESMAN" || role === "ADMIN" ? p.company : undefined,
    companyName: role === "SALESMAN" || role === "ADMIN" ? p.company.legalName : undefined,
    profileUrl: `${appOrigin()}/p/${p.salesman.slug}`,
  };
}

appRouter.get("/proposals", async (req, res) => {
  const user = currentUser(req);
  if (user.role === "FACTORY") {
    res.json([]);
    return;
  }
  const include = { salesman: { include: { factory: true } }, company: true, rfq: true } as const;
  if (user.role === "SALESMAN") {
    const sm = await prisma.salesmanProfile.findUnique({ where: { userId: user.id } });
    const rows = await prisma.proposal.findMany({
      where: { salesmanId: sm!.id },
      include,
      orderBy: { sentAt: "desc" },
      take: LIST_CAP,
    });
    res.json(rows.map((p) => mapProposal(p, user.role)));
    return;
  }
  if (user.role === "COMPANY") {
    const co = await prisma.companyProfile.findUnique({ where: { userId: user.id } });
    const rows = await prisma.proposal.findMany({
      where: { companyId: co!.id },
      include,
      orderBy: [{ sentAt: "desc" }],
      take: LIST_CAP,
    });
    const mapped = rows.map((p) => mapProposal(p, user.role));
    mapped.sort((a, b) => {
      const trust = (b.salesman.trustScore ?? 0) - (a.salesman.trustScore ?? 0);
      if (trust) return trust;
      return (a.sellPrice ?? 1e15) - (b.sellPrice ?? 1e15);
    });
    res.json(mapped);
    return;
  }
  const rows = await prisma.proposal.findMany({ include, orderBy: { sentAt: "desc" }, take: LIST_CAP });
  res.json(rows.map((p) => mapProposal(p, user.role)));
});

appRouter.post("/proposals", requireRole("SALESMAN"), async (req, res) => {
  const user = currentUser(req);
  const body = z
    .object({
      companyId: z.string().optional(),
      companyIds: z.array(z.string()).optional(),
      rfqId: z.string().optional(),
      factoryEstimateId: z.string().optional(),
      sellPrice: money.optional(),
      factoryCost: money.optional(),
      readyBy: z.string().optional(),
      subject: z.string().min(3).max(160),
      body: z.string().min(8).max(8000),
    })
    .parse(req.body);
  const sm = await prisma.salesmanProfile.findUnique({
    where: { userId: user.id },
    include: { factory: true },
  });
  if (!sm) {
    res.status(404).json({ error: "No profile" });
    return;
  }
  let rfq = body.rfqId ? await prisma.rfq.findUnique({ where: { id: body.rfqId } }) : null;
  let estimate = body.factoryEstimateId
    ? await prisma.factoryEstimate.findUnique({ where: { id: body.factoryEstimateId } })
    : rfq
      ? await prisma.factoryEstimate.findFirst({ where: { rfqId: rfq.id, salesmanId: sm.id, status: "ACCEPTED" } })
      : null;
  const ids = body.companyIds?.length ? body.companyIds : body.companyId ? [body.companyId] : rfq ? [rfq.companyId] : [];
  if (!ids.length) {
    res.status(400).json({ error: "Pick at least one company" });
    return;
  }
  const created = [];
  for (const companyId of ids) {
    const co = await prisma.companyProfile.findUnique({
      where: { id: companyId },
      include: { user: true },
    });
    if (!co) continue;
    const trackingToken = crypto.randomBytes(24).toString("hex");
    const profileUrl = `${appOrigin()}/p/${sm.slug}`;
    const trackUrl = `${appOrigin()}/track/open/${trackingToken}`;
    const rateLine = body.sellPrice != null ? `\n\nMy rate to ready and deliver: ${body.sellPrice} SAR.` : "";
    const mail = proposalEmail({
      companyName: co.legalName,
      salesmanName: sm.displayName,
      subject: stripHtml(body.subject),
      body: stripHtml(body.body) + rateLine,
      profileUrl,
      trackUrl,
    });
    const proposal = await prisma.proposal.create({
      data: {
        salesmanId: sm.id,
        companyId: co.id,
        rfqId: rfq?.id,
        factoryId: estimate?.factoryId,
        factoryEstimateId: estimate?.id,
        subject: stripHtml(body.subject),
        body: stripHtml(body.body),
        sellPrice: body.sellPrice,
        factoryCost: body.factoryCost ?? estimate?.amount ?? undefined,
        readyBy: body.readyBy ? new Date(body.readyBy) : estimate?.readyBy ?? undefined,
        trackingToken,
      },
      include: { salesman: { include: { factory: true } }, company: true, rfq: true },
    });
    await notify(
      co.userId,
      "PROPOSAL",
      `Proposal from ${sm.displayName}`,
      body.sellPrice != null
        ? `${stripHtml(body.subject)} · ${body.sellPrice} SAR — compare trust score and rate.`
        : `${stripHtml(body.subject)} — open inbox to compare salesmen.`,
      "/app/inbox",
    );
    await sendMail({
      to: co.user.email,
      subject: stripHtml(body.subject),
      text: `${mail.text}\nTijarah inbox: ${appOrigin()}/app/inbox`,
      html: mail.html,
    });
    created.push(mapProposal(proposal, user.role));
  }
  res.status(201).json({ count: created.length, proposals: created });
});

appRouter.post("/proposals/:id/open", requireRole("COMPANY"), async (req, res) => {
  const user = currentUser(req);
  const co = await prisma.companyProfile.findUnique({ where: { userId: user.id } });
  const p = await prisma.proposal.findUnique({
    where: { id: routeParam(req.params.id) },
    include: { salesman: true, company: true },
  });
  if (!p || !co || p.companyId !== co.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (!p.openedAt) {
    await prisma.proposal.update({
      where: { id: p.id },
      data: { openedAt: new Date(), status: p.status === "SENT" ? "OPENED" : p.status },
    });
    await notify(
      p.salesman.userId,
      "EMAIL_OPEN",
      "Proposal opened",
      `${p.company.legalName} opened your proposal in Tijarah.`,
      "/app/outreach",
    );
  }
  res.json({ ok: true });
});

appRouter.post("/proposals/:id/select", requireRole("COMPANY"), async (req, res) => {
  const user = currentUser(req);
  const co = await prisma.companyProfile.findUnique({ where: { userId: user.id } });
  const p = await prisma.proposal.findUnique({
    where: { id: routeParam(req.params.id) },
    include: { salesman: { include: { factory: true } }, company: true, rfq: true },
  });
  if (!p || !co || p.companyId !== co.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const updated = await prisma.proposal.update({
    where: { id: p.id },
    data: { status: "SELECTED", selectedAt: new Date() },
    include: { salesman: { include: { factory: true } }, company: true, rfq: true },
  });
  if (p.rfqId) {
    await prisma.proposal.updateMany({
      where: { rfqId: p.rfqId, id: { not: p.id }, status: { in: ["SENT", "OPENED"] } },
      data: { status: "DECLINED" },
    });
  }
  let orderId: string | undefined;
  if (p.sellPrice && p.sellPrice > 0) {
    const rfq =
      p.rfq ??
      (await prisma.rfq.create({
        data: {
          companyId: co.id,
          salesmanId: p.salesmanId,
          title: p.subject.slice(0, 80),
          specialty: "steel",
          specs: p.body.slice(0, 400),
          quantity: 1,
          unit: "lot",
          destinationCity: co.city || "Riyadh",
        },
      }));
    const last = await prisma.quote.findFirst({ where: { rfqId: rfq.id, salesmanId: p.salesmanId }, orderBy: { version: "desc" } });
    const factoryCost = p.factoryCost ?? 0;
    const result = await prisma.$transaction(async (tx) => {
      const quote = await tx.quote.create({
        data: {
          rfqId: rfq.id,
          salesmanId: p.salesmanId,
          version: (last?.version ?? 0) + 1,
          status: "ACCEPTED",
          factoryCostEstimate: factoryCost,
          deliveryDate: p.readyBy ?? undefined,
          lines: { create: [{ product: rfq.title, quantity: rfq.quantity || 1, unitPrice: p.sellPrice! / Math.max(1, rfq.quantity || 1) }] },
        },
        include: { lines: true },
      });
      const totals = quoteTotals(quote.lines, quote.discount);
      const order = await tx.order.create({
        data: {
          quoteId: quote.id,
          salesmanId: p.salesmanId,
          companyId: co.id,
          factoryId: p.factoryId,
          factoryCost,
          promisedDate: p.readyBy,
          events: { create: { status: "CONFIRMED", note: "Company selected this salesman", actorId: user.id } },
        },
      });
      const count = await tx.invoice.count();
      const due = new Date();
      due.setDate(due.getDate() + 30);
      await tx.invoice.create({
        data: {
          orderId: order.id,
          number: `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`,
          subtotal: totals.subtotal,
          vat: totals.vat,
          total: totals.total,
          dueDate: due,
        },
      });
      await tx.rfq.update({ where: { id: rfq.id }, data: { status: "AWARDED", salesmanId: p.salesmanId } });
      return order.id;
    });
    orderId = result;
  }
  await notify(
    p.salesman.userId,
    "SELECTED",
    "You were selected",
    orderId
      ? `${co.legalName} selected your rate. Place the job with the cheapest/fastest mill, pay them when ready, then deliver.`
      : `${co.legalName} selected you.`,
    orderId ? "/app/orders" : "/app/rfqs",
  );
  res.json({ ...mapProposal(updated, user.role), orderId });
});

appRouter.get("/export/orders.csv", async (req, res) => {
  const user = currentUser(req);
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
    lines.push(
      [o.id, csvCell(o.company.legalName), o.status, o.createdAt.toISOString(), t.total].join(","),
    );
  }
  res.setHeader("Content-Type", "text/csv");
  res.send(lines.join("\n"));
});
