import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { ZodError } from "zod";
import { env } from "./env.js";
import { startKeepAlive } from "./lib/keepAlive.js";
import { authRouter } from "./routes/auth.js";
import { appRouter } from "./routes/app.js";

const app = express();

if (env.nodeEnv === "production") {
  app.set("trust proxy", 1);
}

app.disable("x-powered-by");
app.use(
  helmet({
    hsts: env.nodeEnv === "production" ? { maxAge: 15552000, includeSubDomains: true } : false,
    contentSecurityPolicy: false,
  }),
);
app.use(
  cors({
    origin: env.frontendOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/", (req, res) => {
  const payload = {
    ok: true,
    service: "Tijarah API",
    health: "/health",
    app: env.frontendOrigin,
  };
  const wantsHtml = String(req.headers.accept ?? "").includes("text/html");
  if (!wantsHtml) {
    res.json(payload);
    return;
  }
  res.type("html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Tijarah API</title>
  <style>
    :root { color-scheme: dark; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center;
      font-family: system-ui, sans-serif; background: #16110e; color: #f3ece4; }
    main { width: min(440px, 92vw); border: 1px solid #3a322c; border-radius: 16px;
      padding: 28px; background: #1c1612; box-shadow: 0 20px 50px rgb(0 0 0 / .4); }
    h1 { margin: 0; font-size: 1.4rem; }
    p { margin: 10px 0 20px; color: #b5a89a; }
    a { color: #f07a2a; }
    .ok { display: inline-block; padding: 4px 10px; border-radius: 999px;
      background: #1f6b3a; color: #d9ffe6; font-size: 12px; }
  </style>
</head>
<body>
  <main>
    <span class="ok">Online</span>
    <h1>Tijarah API</h1>
    <p>This is the backend. Open the app to use Tijarah.</p>
    <p><a href="${env.frontendOrigin}">Open Tijarah</a> · <a href="/health">Health</a></p>
  </main>
</body>
</html>`);
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "api",
    ts: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  });
});

app.get("/public/salesmen/:slug", async (req, res) => {
  const { prisma } = await import("./lib/prisma.js");
  const s = await prisma.salesmanProfile.findUnique({
    where: { slug: String(req.params.slug) },
    include: { reviews: { where: { archived: false } } },
  });
  if (!s) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const parse = (raw: string) => {
    try {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  };
  res.json({
    displayName: s.displayName,
    slug: s.slug,
    bio: s.bio,
    yearsExperience: s.yearsExperience,
    cities: parse(s.cities),
    specialties: parse(s.specialties),
    trustScore: s.trustScore,
    waNumber: s.waNumber,
    photoUrl: s.photoUrl,
    reviews: s.reviews.map((r) => ({
      quality: r.quality,
      deliverySpeed: r.deliverySpeed,
      professionalism: r.professionalism,
      body: r.body,
      wouldOrderAgain: r.wouldOrderAgain,
      createdAt: r.createdAt,
    })),
  });
});

app.use("/auth", authRouter);
app.use("/api", appRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const status = typeof err === "object" && err && "status" in err ? Number((err as { status: number }).status) : 500;
  const expose = env.nodeEnv !== "production" && err instanceof Error ? err.message : "Server error";
  res.status(status >= 400 && status < 500 ? status : 500).json({ error: expose });
});

app.listen(env.port, () => {
  console.log(`Tijarah API on http://localhost:${env.port}`);
  startKeepAlive();
});
