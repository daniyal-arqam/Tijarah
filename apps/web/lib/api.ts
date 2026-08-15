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
  role: "SALESMAN" | "COMPANY" | "ADMIN";
  locale?: string;
  salesman?: { id: string; displayName: string; slug: string; trustScore: number } | null;
  company?: { id: string; legalName: string; city?: string } | null;
};
