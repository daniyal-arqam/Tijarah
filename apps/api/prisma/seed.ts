import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { recalcTrustScore } from "../src/lib/trustScore.js";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("Tijarah1!", 12);

  await prisma.payment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.orderEvent.deleteMany();
  await prisma.order.deleteMany();
  await prisma.quoteLine.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.rfq.deleteMany();
  await prisma.leadListItem.deleteMany();
  await prisma.leadList.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.credential.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.salesmanProfile.deleteMany();
  await prisma.companyProfile.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      email: "admin@tijarah.sa",
      passwordHash: hash,
      role: "ADMIN",
      emailVerified: true,
    },
  });

  const salesman = await prisma.user.create({
    data: {
      email: "salesman@tijarah.sa",
      passwordHash: hash,
      role: "SALESMAN",
      emailVerified: true,
      phoneVerified: true,
      phone: "+966501112233",
      salesman: {
        create: {
          displayName: "Fahad Al-Rashid",
          slug: "fahad-al-rashid",
          bio: "KSA metal middleman — sheet metal, tanks, rebar.",
          yearsExperience: 9,
          cities: JSON.stringify(["Riyadh", "Jeddah", "Dammam"]),
          specialties: JSON.stringify(["sheet_metal", "tanks", "rebar", "steel_structure"]),
          waNumber: "966501112233",
        },
      },
      credentials: {
        create: [
          { type: "ID", status: "APPROVED", reviewedBy: admin.id, note: "Iqama" },
          { type: "CR", status: "APPROVED", reviewedBy: admin.id, note: "CR" },
        ],
      },
    },
    include: { salesman: true },
  });

  const company = await prisma.user.create({
    data: {
      email: "company@tijarah.sa",
      passwordHash: hash,
      role: "COMPANY",
      emailVerified: true,
      company: {
        create: {
          legalName: "Al-Najd Trading Co.",
          industry: "Construction",
          size: "Mid-size",
          city: "Riyadh",
          crNumber: "1010123456",
          vatNumber: "300123456700003",
          contactName: "Faisal Al-Harbi",
        },
      },
    },
    include: { company: true },
  });

  const extra = await prisma.user.create({
    data: {
      email: "jubail@tijarah.sa",
      passwordHash: hash,
      role: "COMPANY",
      emailVerified: true,
      company: {
        create: {
          legalName: "Jubail Alloy Systems",
          industry: "Manufacturing",
          size: "Enterprise",
          city: "Jubail",
        },
      },
    },
    include: { company: true },
  });

  const sm = salesman.salesman!;
  const co = company.company!;

  const rfq = await prisma.rfq.create({
    data: {
      companyId: co.id,
      salesmanId: sm.id,
      title: "Sheet metal tanks x12",
      specialty: "tanks",
      specs: "Industrial grade sheet metal tanks, ASTM A36, 5mm.",
      quantity: 12,
      unit: "pcs",
      destinationCity: "Riyadh",
      neededBy: new Date("2026-09-30"),
    },
  });

  const quote = await prisma.quote.create({
    data: {
      rfqId: rfq.id,
      salesmanId: sm.id,
      version: 1,
      status: "ACCEPTED",
      paymentTerms: "NET_30",
      deliveryDate: new Date("2026-09-30"),
      factoryCostEstimate: 15000,
      lines: {
        create: [{ product: "Industrial Grade Sheet Metal Tank", quantity: 12, unitPrice: 1500 }],
      },
    },
    include: { lines: true },
  });

  const order = await prisma.order.create({
    data: {
      quoteId: quote.id,
      salesmanId: sm.id,
      companyId: co.id,
      status: "RECEIVED",
      promisedDate: new Date("2026-09-30"),
      deliveredAt: new Date("2026-09-28"),
      receivedAt: new Date("2026-09-29"),
      events: {
        create: [
          { status: "CONFIRMED", note: "Accepted", actorId: company.id },
          { status: "SENT_TO_FACTORY", note: "Job placed", actorId: salesman.id },
          { status: "IN_PRODUCTION", note: "Fabrication started", actorId: salesman.id },
          { status: "SHIPPED", note: "On truck to Riyadh", actorId: salesman.id },
          { status: "DELIVERED", note: "Photos attached", actorId: salesman.id },
          { status: "RECEIVED", note: "Confirmed", actorId: company.id },
        ],
      },
    },
  });

  await prisma.invoice.create({
    data: {
      orderId: order.id,
      number: "INV-2026-0001",
      subtotal: 18000,
      vat: 2700,
      total: 20700,
      dueDate: new Date("2026-10-28"),
      status: "PAID",
      payments: {
        create: { amount: 20700, method: "BANK_TRANSFER", reference: "NCB-9921" },
      },
    },
  });

  await prisma.review.create({
    data: {
      orderId: order.id,
      salesmanId: sm.id,
      authorId: company.id,
      quality: 5,
      deliverySpeed: 5,
      professionalism: 4,
      body: "Tanks arrived two days early. Clean paperwork.",
      wouldOrderAgain: true,
    },
  });

  const openRfq = await prisma.rfq.create({
    data: {
      companyId: extra.company!.id,
      salesmanId: sm.id,
      title: "Rebar B500B 16mm",
      specialty: "rebar",
      specs: "1200 MT Grade 60 rebar",
      quantity: 1200,
      unit: "MT",
      destinationCity: "Riyadh",
      status: "OPEN",
    },
  });

  await prisma.quote.create({
    data: {
      rfqId: openRfq.id,
      salesmanId: sm.id,
      version: 1,
      status: "SENT",
      factoryCostEstimate: 170000,
      lines: { create: [{ product: "Rebar B500B 16mm", quantity: 1200, unitPrice: 155 }] },
    },
  });

  await recalcTrustScore(sm.id);
  console.log("Seeded Tijarah demo users. Password: Tijarah1!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
