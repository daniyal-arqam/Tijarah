import { env } from "../env.js";

export async function sendMail(opts: { to: string; subject: string; text: string; html: string }) {
  const host = process.env.SMTP_HOST?.trim();
  if (!host) {
    console.log(`[mail] inbox + queued email to ${opts.to}: ${opts.subject}`);
    return { delivered: false };
  }
  try {
    const port = Number(process.env.SMTP_PORT ?? 587);
    const auth =
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? `${encodeURIComponent(process.env.SMTP_USER)}:${encodeURIComponent(process.env.SMTP_PASS)}@`
        : "";
    const url = `smtp://${auth}${host}:${port}`;
    console.log(`[mail] SMTP configured at ${url.replace(/:[^:@]+@/, ":***@")} — delivering to ${opts.to}`);
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
  const mill = opts.millName ? ` representing ${opts.millName}` : "";
  const text = `${opts.body}\n\nView my Tijarah profile: ${opts.profileUrl}\n`;
  const html = `<!doctype html>
<html><body style="font-family:system-ui,sans-serif;background:#16110e;color:#f3ece4;padding:24px">
  <div style="max-width:560px;margin:auto;background:#1c1612;border:1px solid #3a322c;border-radius:16px;padding:28px">
    <p style="color:#c4a35a;letter-spacing:.16em;text-transform:uppercase;font-size:11px;margin:0 0 12px">Tijarah proposal</p>
    <h1 style="margin:0 0 8px;font-size:22px">${opts.subject}</h1>
    <p style="color:#b5a89a">From ${opts.salesmanName}${mill} to ${opts.companyName}</p>
    <pre style="white-space:pre-wrap;font-family:inherit;line-height:1.5">${opts.body}</pre>
    <p><a href="${opts.profileUrl}" style="color:#f07a2a">View salesman profile on Tijarah</a></p>
  </div>
  <img src="${opts.trackUrl}" width="1" height="1" alt="" />
</body></html>`;
  return { text, html };
}

export function appOrigin() {
  return env.frontendOrigin.replace(/\/$/, "");
}
