import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { ZodError } from "zod";
import { env } from "./env.js";
import { startKeepAlive } from "./lib/keepAlive.js";
import { remindStaleProposals } from "./lib/followUp.js";
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
  const { salesmanPublicPayload } = await import("./lib/salesmanPublic.js");
  const s = await salesmanPublicPayload(String(req.params.slug));
  if (!s) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(s);
});

app.get("/track/open/:token", async (req, res) => {
  const { prisma } = await import("./lib/prisma.js");
  const { notify } = await import("./lib/notify.js");
  const p = await prisma.proposal.findUnique({
    where: { trackingToken: String(req.params.token) },
    include: { salesman: true, company: true },
  });
  if (p && !p.openedAt) {
    await prisma.proposal.update({
      where: { id: p.id },
      data: { openedAt: new Date(), status: p.status === "SENT" ? "OPENED" : p.status },
    });
    await notify(
      p.salesman.userId,
      "EMAIL_OPEN",
      "Proposal opened",
      `${p.company.legalName} opened your email.`,
      "/app/outreach",
    );
  }
  const gif = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
  res.setHeader("Content-Type", "image/gif");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.send(gif);
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
  const tick = () => {
    void remindStaleProposals().catch((err) =>
      console.warn("Follow-up check failed:", err instanceof Error ? err.message : err),
    );
  };
  setTimeout(tick, 15_000);
  setInterval(tick, 5 * 60 * 1000);
});
