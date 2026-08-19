import { env } from "../env.js";

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendMail(opts: { to: string; subject: string; text: string; html: string }) {
  const host = process.env.SMTP_HOST?.trim();
  if (!host) {
    if (env.nodeEnv !== "production") {
      console.log(`[mail] ${opts.to}: ${opts.subject}`);
    }
    return { delivered: false };
  }
  try {
    const nodemailer = await import("nodemailer");
    const createTransport = nodemailer.createTransport ?? nodemailer.default.createTransport;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const transporter = createTransport({
      host,
      port,
      secure: port === 465,
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM?.trim() || "Tijarah <noreply@tijarah.sa>",
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    return { delivered: true };
  } catch (err) {
    console.warn("SMTP send failed:", err instanceof Error ? err.message : err);
    return { delivered: false };
  }
}

export function proposalEmail(opts: {
  companyName: string;
  salesmanName: string;
  millName?: string;
  subject: string;
  body: string;
  profileUrl: string;
  trackUrl: string;
}) {
  const mill = opts.millName ? ` representing ${escapeHtml(opts.millName)}` : "";
  const text = `${opts.body}\n\nView my Tijarah profile: ${opts.profileUrl}\n`;
  const html = `<!doctype html>
<html><body style="font-family:system-ui,sans-serif;background:#16110e;color:#f3ece4;padding:24px">
  <div style="max-width:560px;margin:auto;background:#1c1612;border:1px solid #3a322c;border-radius:16px;padding:28px">
    <p style="color:#c4a35a;letter-spacing:.16em;text-transform:uppercase;font-size:11px;margin:0 0 12px">Tijarah proposal</p>
    <h1 style="margin:0 0 8px;font-size:22px">${escapeHtml(opts.subject)}</h1>
    <p style="color:#b5a89a">From ${escapeHtml(opts.salesmanName)}${mill} to ${escapeHtml(opts.companyName)}</p>
    <pre style="white-space:pre-wrap;font-family:inherit;line-height:1.5">${escapeHtml(opts.body)}</pre>
    <p><a href="${escapeHtml(opts.profileUrl)}" style="color:#f07a2a">View salesman profile on Tijarah</a></p>
  </div>
  <img src="${escapeHtml(opts.trackUrl)}" width="1" height="1" alt="" />
</body></html>`;
  return { text, html };
}

export function appOrigin() {
  return env.frontendOrigin.replace(/\/$/, "");
}
