import { prisma } from "./prisma.js";
import { notify } from "./notify.js";

const HOURS_72 = 72 * 60 * 60 * 1000;

export async function remindStaleProposals() {
  const cutoff = new Date(Date.now() - HOURS_72);
  const stale = await prisma.proposal.findMany({
    where: {
      openedAt: null,
      followUpNotifiedAt: null,
      sentAt: { lte: cutoff },
      status: { in: ["SENT"] },
    },
    include: { salesman: true, company: true },
  });
  for (const p of stale) {
    await notify(
      p.salesman.userId,
      "FOLLOW_UP",
      "Follow-up reminder",
      `${p.company.legalName} has not opened your proposal in 72 hours. Send a follow-up.`,
      "/app/outreach",
    );
    await prisma.proposal.update({
      where: { id: p.id },
      data: { followUpNotifiedAt: new Date() },
    });
  }
  return stale.length;
}
