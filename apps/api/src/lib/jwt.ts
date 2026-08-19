import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { env, ACCESS_TTL, REFRESH_TTL_DAYS } from "../env.js";
import type { Role } from "@prisma/client";

const ALG = "HS256" as const;

export type AccessPayload = { sub: string; role: Role };

export function signAccess(payload: AccessPayload) {
  return jwt.sign(payload, env.jwtAccess, { expiresIn: ACCESS_TTL, algorithm: ALG });
}

export function verifyAccess(token: string) {
  const decoded = jwt.verify(token, env.jwtAccess, { algorithms: [ALG] });
  if (typeof decoded === "string" || !decoded.sub || !decoded.role) {
    throw new Error("Invalid token");
  }
  return decoded as AccessPayload;
}

export function newRefreshToken() {
  return crypto.randomBytes(48).toString("hex");
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function refreshExpiry() {
  const d = new Date();
  d.setDate(d.getDate() + REFRESH_TTL_DAYS);
  return d;
}
