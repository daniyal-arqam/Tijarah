export async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export type Me = {
  id: string;
  email: string;
  role: "SALESMAN" | "COMPANY" | "FACTORY" | "ADMIN";
  locale?: string;
  salesman?: {
    id: string;
    displayName: string;
    slug: string;
    trustScore: number;
    photoUrl?: string | null;
    bio?: string;
    title?: string;
    firmName?: string;
    specialties?: string;
    cities?: string;
    yearsExperience?: number;
    waNumber?: string | null;
    factory?: { id: string; legalName: string; verified?: boolean } | null;
    factoryId?: string | null;
    languages?: string;
    certifications?: string | null;
    coverageNotes?: string | null;
  } | null;
  company?: { id: string; legalName: string; city?: string; logoUrl?: string | null; contactName?: string } | null;
  factory?: { id: string; legalName: string; city?: string | null; verified?: boolean } | null;
};
