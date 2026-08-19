import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { recalcTrustScore } from "../src/lib/trustScore.js";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("Tijarah1!", 12);

  await prisma.proposal.deleteMany();
  await prisma.factoryEstimate.deleteMany();
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
  await prisma.factoryProfile.deleteMany();
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

  const millUser = await prisma.user.create({
    data: {
      email: "factory@tijarah.sa",
      passwordHash: hash,
      role: "FACTORY",
      emailVerified: true,
      factory: {
        create: {
          legalName: "Eastern Plate & Coil Factory",
          tradeName: "EPCF",
          city: "Jubail",
          crNumber: "2050123456",
          vatNumber: "310987654300003",
          phone: "+966138470000",
          address: "1st Industrial City, Jubail",
          about: "Mill-direct plate, coil and rebar for KSA construction and oil & gas. Verified manufacturer on Tijarah.",
          specialties: JSON.stringify(["plate", "coil", "rebar", "steel_structure"]),
          capacityTons: 180000,
          verified: true,
        },
      },
    },
    include: { factory: true },
  });
  const mill = millUser.factory!;

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
          factoryId: mill.id,
          displayName: "Fahad Al-Rashid",
          slug: "fahad-al-rashid",
          title: "Regional mill representative",
          bio: "I cover Riyadh, Jeddah and Dammam — plate, coil, tanks and rebar with mill certs on every lot.",
          yearsExperience: 9,
          cities: JSON.stringify(["Riyadh", "Jeddah", "Dammam"]),
          specialties: JSON.stringify(["sheet_metal", "tanks", "rebar", "steel_structure"]),
          languages: JSON.stringify(["Arabic", "English"]),
          certifications: "SASO · mill certs on every heat",
          coverageNotes: "Same-week dispatch from Jubail to Riyadh / Dammam.",
          waNumber: "966501112233",
        },
      },
      credentials: {
        create: [
          { type: "ID", status: "APPROVED", reviewedBy: admin.id, note: "Iqama" },
          { type: "CR", status: "APPROVED", reviewedBy: admin.id, note: "Linked mill CR" },
        ],
      },
    },
    include: { salesman: true },
  });

  const salesman2 = await prisma.user.create({
    data: {
      email: "khalid@tijarah.sa",
      passwordHash: hash,
      role: "SALESMAN",
      emailVerified: true,
      phoneVerified: true,
      phone: "+966504445566",
      salesman: {
        create: {
          factoryId: mill.id,
          displayName: "Khalid Al-Mutairi",
          slug: "khalid-al-mutairi",
          title: "Eastern province desk",
          bio: "Eastern province desk — coil and plate allocations for fabricators, with mill certs on every heat.",
          yearsExperience: 6,
          cities: JSON.stringify(["Dammam", "Khobar", "Jubail"]),
          specialties: JSON.stringify(["plate", "coil", "steel_structure"]),
          languages: JSON.stringify(["Arabic", "English"]),
          waNumber: "966504445566",
        },
      },
      credentials: {
        create: [{ type: "ID", status: "APPROVED", reviewedBy: admin.id, note: "Iqama" }],
      },
    },
    include: { salesman: true },
  });

  const mill2User = await prisma.user.create({
    data: {
      email: "yanbu@tijarah.sa",
      passwordHash: hash,
      role: "FACTORY",
      emailVerified: true,
      factory: {
        create: {
          legalName: "Yanbu Rebar Works",
          tradeName: "YRW",
          city: "Yanbu",
          crNumber: "4030987654",
          vatNumber: "310111222300003",
          phone: "+966144800000",
          address: "Yanbu Industrial City",
          about: "Fast rebar and plate lots for Western and Central KSA.",
          specialties: JSON.stringify(["rebar", "plate", "coil"]),
          capacityTons: 90000,
          verified: true,
        },
      },
    },
    include: { factory: true },
  });
  const mill2 = mill2User.factory!;

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
  const sm2 = salesman2.salesman!;
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
      status: "AWARDED",
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
      factoryCostEstimate: 16500,
      lines: {
        create: [{ product: "Industrial Grade Sheet Metal Tank", quantity: 12, unitPrice: 1500 }],
      },
    },
  });

  const order = await prisma.order.create({
    data: {
      quoteId: quote.id,
      salesmanId: sm.id,
      companyId: co.id,
      factoryId: mill.id,
      factoryCost: 16500,
      factoryPaidAt: new Date("2026-09-26"),
      status: "RECEIVED",
      promisedDate: new Date("2026-09-30"),
      deliveredAt: new Date("2026-09-28"),
      receivedAt: new Date("2026-09-29"),
      events: {
        create: [
          { status: "CONFIRMED", note: "Accepted at 18,000 SAR (company)", actorId: company.id },
          { status: "SENT_TO_FACTORY", note: "Job placed with mill at 16,500 SAR", actorId: salesman.id },
          { status: "IN_PRODUCTION", note: "Fabrication started", actorId: salesman.id },
          { status: "SHIPPED", note: "Mill paid. On truck to company", actorId: salesman.id },
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
      authorRole: "COMPANY",
      quality: 5,
      deliverySpeed: 5,
      professionalism: 5,
      body: "Ready on time. Clear paperwork. Would order again.",
      wouldOrderAgain: true,
    },
  });

  await prisma.review.create({
    data: {
      orderId: order.id,
      salesmanId: sm.id,
      authorId: millUser.id,
      authorRole: "FACTORY",
      quality: 5,
      deliverySpeed: 5,
      professionalism: 5,
      body: "Paid the mill as soon as the tanks were ready. Clean job ticket.",
      wouldOrderAgain: true,
    },
  });

  const listing = await prisma.rfq.create({
    data: {
      companyId: co.id,
      title: "Rebar B500B 16mm — 40 tons",
      specialty: "rebar",
      specs: "Buy ready stock or customize cut length. Grade B500B, 16mm, mill certs.",
      quantity: 40,
      unit: "ton",
      destinationCity: "Riyadh",
      customize: false,
      status: "OPEN",
    },
  });

  await prisma.factoryEstimate.create({
    data: {
      rfqId: listing.id,
      factoryId: mill.id,
      salesmanId: sm.id,
      amount: 1100,
      readyBy: new Date("2026-09-12"),
      status: "QUOTED",
      notes: "Jubail mill — 12 days.",
    },
  });

  const cheap = await prisma.factoryEstimate.create({
    data: {
      rfqId: listing.id,
      factoryId: mill2.id,
      salesmanId: sm.id,
      amount: 1000,
      readyBy: new Date("2026-09-08"),
      status: "ACCEPTED",
      notes: "Cheapest and fastest mill.",
    },
  });

  await prisma.proposal.create({
    data: {
      salesmanId: sm.id,
      companyId: co.id,
      rfqId: listing.id,
      factoryId: mill2.id,
      factoryEstimateId: cheap.id,
      sellPrice: 1100,
      factoryCost: 1000,
      readyBy: new Date("2026-09-10"),
      subject: "Rebar B500B 16mm — ready at 1,100 SAR",
      body: "Faisal — I will ready 40 tons B500B 16mm and deliver to Riyadh at 1,100 SAR. Open my Tijarah profile for trust score and reviews from companies and mills.",
      trackingToken: "demo-open-fahad",
      status: "OPENED",
      openedAt: new Date(),
    },
  });

  await prisma.proposal.create({
    data: {
      salesmanId: sm2.id,
      companyId: co.id,
      rfqId: listing.id,
      sellPrice: 1250,
      factoryCost: 1080,
      readyBy: new Date("2026-09-14"),
      subject: "Rebar offer — 1,250 SAR delivered",
      body: "I can cover this listing at 1,250 SAR delivered to Riyadh. Compare my Tijarah profile — trust score and reviews — against other salesmen.",
      trackingToken: "demo-sent-khalid",
      status: "SENT",
    },
  });

  const openRfq = await prisma.rfq.create({
    data: {
      companyId: extra.company!.id,
      title: "Custom plate tanks — 8 units",
      specialty: "tanks",
      specs: "Customize 8 plate tanks, 5mm ASTM A36, with mill certs.",
      quantity: 8,
      unit: "pcs",
      destinationCity: "Jubail",
      customize: true,
      status: "OPEN",
    },
  });

  await prisma.quote.create({
    data: {
      rfqId: openRfq.id,
      salesmanId: sm.id,
      version: 1,
      status: "SENT",
      factoryCostEstimate: 9000,
      lines: { create: [{ product: "Custom plate tank", quantity: 8, unitPrice: 1300 }] },
    },
  });

  await prisma.notification.create({
    data: {
      userId: company.id,
      type: "PROPOSAL",
      title: "2 salesman rates on your rebar listing",
      body: "Fahad 1,100 SAR · trust 10/10. Khalid 1,250 SAR. Pick the best score and lowest rate.",
      link: "/app/inbox",
    },
  });

  await recalcTrustScore(sm.id);
  await recalcTrustScore(sm2.id);
  console.log("Seeded Tijarah demo users. Password: Tijarah1!");
  console.log("factory@tijarah.sa · yanbu@tijarah.sa · salesman@tijarah.sa · khalid@tijarah.sa · company@tijarah.sa");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
