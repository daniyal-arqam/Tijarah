import type { NextFunction, Request, Response } from "express";
import { verifyAccess } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";
import type { Role } from "@prisma/client";

export type AuthedRequest = Request & {
  user: { id: string; role: Role; email: string };
};

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.access as string | undefined;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = verifyAccess(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== "ACTIVE") {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    (req as AuthedRequest).user = { id: user.id, role: user.role, email: user.email };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthedRequest).user;
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
