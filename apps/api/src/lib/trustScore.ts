import { prisma } from "./prisma.js";

/** Trust is stored and shown as 0–10. A verified mill salesman with on-time work can hit 10/10. */
export function trustTen(score: number) {
  const n = score > 10 ? Math.round(score / 10) : score;
  return Math.max(0, Math.min(10, Math.round(n)));
}

export async function recalcTrustScore(salesmanId: string) {
  const salesman = await prisma.salesmanProfile.findUnique({
    where: { id: salesmanId },
    include: {
      user: { include: { credentials: true } },
      factory: true,
      orders: true,
      reviews: { where: { archived: false } },
    },
  });
  if (!salesman) return 0;

  let score = 0;
  if (salesman.user.emailVerified) score += 1;
  if (salesman.user.phoneVerified) score += 1;
  if (salesman.user.credentials.some((c) => c.type === "ID" && c.status === "APPROVED")) score += 2;
  if (salesman.user.credentials.some((c) => c.type === "CR" && c.status === "APPROVED")) score += 1;
  if (salesman.factory?.verified) score += 2;

  const delivered = salesman.orders.filter((o) => o.status === "RECEIVED" || o.status === "DELIVERED");
  if (delivered.length) score += 1;

  const withPromise = delivered.filter((o) => o.promisedDate && o.deliveredAt);
  if (withPromise.length) {
    const onTime = withPromise.filter((o) => o.deliveredAt! <= o.promisedDate!).length;
    if (onTime / withPromise.length >= 0.9) score += 1;
  }

  if (salesman.reviews.length) {
    const avg =
      salesman.reviews.reduce((s, r) => s + (r.quality + r.deliverySpeed + r.professionalism) / 3, 0) /
      salesman.reviews.length;
    if (avg >= 4) score += 1;
  }

  score = Math.min(10, score);
  await prisma.salesmanProfile.update({ where: { id: salesmanId }, data: { trustScore: score } });
  return score;
}
