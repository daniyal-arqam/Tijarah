import { Router } from "express";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma.js";
import { env } from "../env.js";
import { hashToken, newRefreshToken, refreshExpiry, signAccess } from "../lib/jwt.js";
import { recalcTrustScore } from "../lib/trustScore.js";
import type { Role } from "@prisma/client";

export const authRouter = Router();

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.cookieSecure,
  path: "/",
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, try in 15 minutes" },
});

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "salesman"
  );
}

async function uniqueSlug(name: string) {
  const base = slugify(name);
  let slug = base;
  let n = 1;
  while (await prisma.salesmanProfile.findUnique({ where: { slug } })) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

function setAuthCookies(res: Parameters<typeof authRouter.post>[1] extends never ? never : import("express").Response, userId: string, role: Role) {
  const access = signAccess({ sub: userId, role });
  res.cookie("access", access, { ...cookieOpts, maxAge: 15 * 60 * 1000 });
}

async function issueRefresh(res: import("express").Response, userId: string, role: Role) {
  setAuthCookies(res, userId, role);
  const raw = newRefreshToken();
  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashToken(raw), expiresAt: refreshExpiry() },
  });
  res.cookie("refresh", raw, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

const signupSchema = z.object({
  email: z.string().email().max(120),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
  role: z.enum(["SALESMAN", "COMPANY"]),
  name: z.string().min(2).max(80),
});

authRouter.post("/signup", loginLimiter, async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const { email, password, role, name } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (exists) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      role,
      emailVerified: true,
      salesman:
        role === "SALESMAN"
          ? { create: { displayName: name, slug: await uniqueSlug(name) } }
          : undefined,
      company: role === "COMPANY" ? { create: { legalName: name } } : undefined,
    },
    include: { salesman: true, company: true },
  });
  if (user.salesman) await recalcTrustScore(user.salesman.id);
  await issueRefresh(res, user.id, user.role);
  res.status(201).json({
    id: user.id,
    email: user.email,
    role: user.role,
    salesman: user.salesman,
    company: user.company,
  });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/login", loginLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    include: { salesman: true, company: true },
  });
  if (!user || user.status !== "ACTIVE") {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  await issueRefresh(res, user.id, user.role);
  res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    locale: user.locale,
    salesman: user.salesman,
    company: user.company,
  });
});

authRouter.post("/logout", async (req, res) => {
  const raw = req.cookies?.refresh as string | undefined;
  if (raw) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(raw) },
      data: { revoked: true },
    });
  }
  res.clearCookie("access", { path: "/" });
  res.clearCookie("refresh", { path: "/" });
  res.json({ ok: true });
});

authRouter.post("/refresh", async (req, res) => {
  const raw = req.cookies?.refresh as string | undefined;
  if (!raw) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const row = await prisma.refreshToken.findFirst({
    where: { tokenHash: hashToken(raw), revoked: false, expiresAt: { gt: new Date() } },
    include: { user: true },
  });
  if (!row || row.user.status !== "ACTIVE") {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  await prisma.refreshToken.update({ where: { id: row.id }, data: { revoked: true } });
  await issueRefresh(res, row.user.id, row.user.role);
  res.json({ ok: true, role: row.user.role });
});

authRouter.post("/forgot-password", loginLimiter, async (req, res) => {
  const parsed = z.object({ email: z.string().email() }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (user && user.status === "ACTIVE") {
    const raw = randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetHash: hashToken(raw),
        passwordResetExpires: new Date(Date.now() + 30 * 60 * 1000),
      },
    });
    res.cookie("reset_ticket", raw, { ...cookieOpts, maxAge: 30 * 60 * 1000 });
  }
  res.json({ ok: true });
});

authRouter.post("/reset-password", loginLimiter, async (req, res) => {
  const parsed = z
    .object({
      password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const raw = req.cookies?.reset_ticket as string | undefined;
  if (!raw) {
    res.status(400).json({ error: "Reset link expired. Request a new one." });
    return;
  }
  const user = await prisma.user.findFirst({
    where: {
      passwordResetHash: hashToken(raw),
      passwordResetExpires: { gt: new Date() },
      status: "ACTIVE",
    },
  });
  if (!user) {
    res.status(400).json({ error: "Reset link expired. Request a new one." });
    return;
  }
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      passwordResetHash: null,
      passwordResetExpires: null,
    },
  });
  res.clearCookie("reset_ticket", { path: "/" });
  res.json({ ok: true });
});

authRouter.get("/me", async (req, res) => {
  const token = req.cookies?.access as string | undefined;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const { verifyAccess } = await import("../lib/jwt.js");
    const payload = verifyAccess(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { salesman: true, company: true },
    });
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      locale: user.locale,
      salesman: user.salesman,
      company: user.company,
    });
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
});
