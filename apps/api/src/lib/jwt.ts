import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { env, ACCESS_TTL, REFRESH_TTL_DAYS } from "../env.js";
import type { Role } from "@prisma/client";

export type AccessPayload = { sub: string; role: Role };

export function signAccess(payload: AccessPayload) {
  return jwt.sign(payload, env.jwtAccess, { expiresIn: ACCESS_TTL });
}

export function verifyAccess(token: string) {
  return jwt.verify(token, env.jwtAccess) as AccessPayload;
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
