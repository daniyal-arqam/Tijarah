import type { CompanyProfile, SalesmanProfile, User } from "@prisma/client";

type UserRow = User & { salesman?: SalesmanProfile | null; company?: CompanyProfile | null };

export function publicUser(row: UserRow | null) {
  if (!row) return null;
    const { passwordHash: _pw, passwordResetHash: _r, passwordResetExpires: _e, ...rest } = row;
  return rest;
}
