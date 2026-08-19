import type { FactoryProfile, SalesmanProfile } from "@prisma/client";
import { trustTen } from "./trustScore.js";

function parseJsonArr(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export function publicFactory(factory: FactoryProfile | null | undefined) {
  if (!factory) return null;
  return {
    id: factory.id,
    legalName: factory.legalName,
    tradeName: factory.tradeName,
    city: factory.city,
    crNumber: factory.crNumber,
    vatNumber: factory.vatNumber,
    phone: factory.phone,
    address: factory.address,
    about: factory.about,
    specialties: parseJsonArr(factory.specialties),
    capacityTons: factory.capacityTons,
    logoUrl: factory.logoUrl,
    verified: factory.verified,
  };
}

export function salesmanCard(
  s: Pick<
    SalesmanProfile,
    "id" | "displayName" | "slug" | "photoUrl" | "bio" | "title" | "yearsExperience" | "cities" | "specialties" | "trustScore" | "waNumber"
  >,
) {
  return {
    id: s.id,
    displayName: s.displayName,
    slug: s.slug,
    photoUrl: s.photoUrl,
    bio: s.bio,
    title: s.title,
    yearsExperience: s.yearsExperience,
    cities: parseJsonArr(s.cities),
    specialties: parseJsonArr(s.specialties),
    trustScore: trustTen(s.trustScore),
    waNumber: s.waNumber,
  };
}

/** Buying company never sees mill identity. Selling mill never sees buyer identity. */
export function hideMillFromBuyer<T extends Record<string, unknown>>(row: T): T {
  const next: Record<string, unknown> = { ...row };
  delete next.factory;
  delete next.millName;
  delete next.millVerified;
  delete next.teammates;
  delete next.factoryId;
  delete next.factoryCost;
  delete next.factoryCostEstimate;
  delete next.factoryPaidAt;
  delete next.profit;
  if (next.salesman && typeof next.salesman === "object") {
    next.salesman = salesmanCard(next.salesman as Parameters<typeof salesmanCard>[0]);
  }
  return next as T;
}

export function hideBuyerFromMill<T extends Record<string, unknown>>(row: T): T {
  const next: Record<string, unknown> = { ...row };
  delete next.company;
  delete next.companyId;
  delete next.companyName;
  if (next.quote && typeof next.quote === "object") {
    const q = { ...(next.quote as Record<string, unknown>) };
    if (q.rfq && typeof q.rfq === "object") {
      const rfq = { ...(q.rfq as Record<string, unknown>) };
      delete rfq.company;
      delete rfq.companyId;
      q.rfq = rfq;
    }
    next.quote = q;
  }
  if (next.rfq && typeof next.rfq === "object") {
    const rfq = { ...(next.rfq as Record<string, unknown>) };
    delete rfq.company;
    delete rfq.companyId;
    next.rfq = rfq;
  }
  if (next.order && typeof next.order === "object") {
    next.order = hideBuyerFromMill(next.order as Record<string, unknown>);
  }
  return next as T;
}
