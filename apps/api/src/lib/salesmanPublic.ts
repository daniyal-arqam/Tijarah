import { prisma } from "./prisma.js";
import { salesmanCard } from "./factoryView.js";

function parse(raw: string) {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** Public card: salesman only. Mill and buying company stay hidden from each other. */
export async function salesmanPublicPayload(slug: string) {
  const s = await prisma.salesmanProfile.findUnique({
    where: { slug },
    include: {
      reviews: { where: { archived: false } },
      factory: true,
      user: {
        select: {
          emailVerified: true,
          phoneVerified: true,
          credentials: { where: { status: "APPROVED" }, select: { type: true } },
        },
      },
    },
  });
  if (!s) return null;
  const n = s.reviews.length;
  const avg = (key: "quality" | "deliverySpeed" | "professionalism") =>
    n === 0 ? 0 : Math.round((s.reviews.reduce((a, r) => a + r[key], 0) / n) * 10) / 10;
  return {
    ...salesmanCard(s),
    languages: parse(s.languages),
    certifications: s.certifications,
    coverageNotes: s.coverageNotes,
    emailVerified: s.user.emailVerified,
    phoneVerified: s.user.phoneVerified,
    verifiedDocs: [...new Set(s.user.credentials.map((c) => c.type))],
    reviewCount: n,
    rating: n === 0 ? 0 : Math.round(((avg("quality") + avg("deliverySpeed") + avg("professionalism")) / 3) * 10) / 10,
    avgQuality: avg("quality"),
    avgSpeed: avg("deliverySpeed"),
    avgProfessionalism: avg("professionalism"),
    reviews: s.reviews.map((r) => ({
      quality: r.quality,
      deliverySpeed: r.deliverySpeed,
      professionalism: r.professionalism,
      body: r.body,
      wouldOrderAgain: r.wouldOrderAgain,
      createdAt: r.createdAt,
      from: r.authorRole === "FACTORY" ? "FACTORY" : "COMPANY",
    })),
  };
}
