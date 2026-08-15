import { prisma } from "./prisma.js";

export async function recalcTrustScore(salesmanId: string) {
  const salesman = await prisma.salesmanProfile.findUnique({
    where: { id: salesmanId },
    include: {
      user: { include: { credentials: true } },
      orders: true,
      reviews: { where: { archived: false } },
    },
  });
  if (!salesman) return 0;

  let score = 0;
  if (salesman.user.emailVerified) score += 10;
  if (salesman.user.phoneVerified) score += 10;
  if (salesman.user.credentials.some((c) => c.type === "ID" && c.status === "APPROVED")) score += 15;
  if (salesman.user.credentials.some((c) => c.type === "CR" && c.status === "APPROVED")) score += 15;

  const delivered = salesman.orders.filter((o) => o.status === "RECEIVED" || o.status === "DELIVERED");
  score += Math.min(20, delivered.length * 2);

  const withPromise = delivered.filter((o) => o.promisedDate && o.deliveredAt);
  if (withPromise.length) {
    const onTime = withPromise.filter((o) => o.deliveredAt! <= o.promisedDate!).length;
    score += Math.round((onTime / withPromise.length) * 15);
  }

  if (salesman.reviews.length) {
    const avg =
      salesman.reviews.reduce((s, r) => s + (r.quality + r.deliverySpeed + r.professionalism) / 3, 0) /
      salesman.reviews.length;
    score += Math.round((avg / 5) * 15);
  }

  score = Math.min(100, score);
  await prisma.salesmanProfile.update({ where: { id: salesmanId }, data: { trustScore: score } });
  return score;
}
