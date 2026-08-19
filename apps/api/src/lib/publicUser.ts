import type { CompanyProfile, FactoryProfile, SalesmanProfile, User } from "@prisma/client";

type SalesmanRow = SalesmanProfile & { factory?: FactoryProfile | null; commissionPercent?: unknown };
type UserRow = User & {
  salesman?: SalesmanRow | null;
  company?: CompanyProfile | null;
  factory?: FactoryProfile | null;
};

export function publicSalesman<T extends SalesmanRow>(row: T) {
  const { commissionPercent: _c, ...rest } = row;
  return rest;
}

export function publicUser(row: UserRow | null) {
  if (!row) return null;
  const { passwordHash: _pw, passwordResetHash: _r, passwordResetExpires: _e, salesman, ...rest } = row;
  return {
    ...rest,
    salesman: salesman ? publicSalesman(salesman) : salesman,
  };
}
