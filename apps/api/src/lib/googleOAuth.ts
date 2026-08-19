import jwt from "jsonwebtoken";
import { env } from "../env.js";

export type GoogleProfile = {
  sub: string;
  email: string;
  name: string;
  picture?: string;
};

export type GooglePending = {
  email: string;
  name: string;
  picture?: string;
};

export function googleConfigured() {
  return Boolean(env.googleClientId && env.googleClientSecret);
}

export function frontendUrl(path: string) {
  return `${env.frontendOrigin.replace(/\/$/, "")}${path}`;
}

export function googleRedirectUri() {
  return frontendUrl("/auth/google/callback");
}

export function googleAuthUrl(state: string) {
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", env.googleClientId);
  u.searchParams.set("redirect_uri", googleRedirectUri());
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "openid email profile");
  u.searchParams.set("state", state);
  u.searchParams.set("prompt", "select_account");
  return u.toString();
}

export async function exchangeGoogleCode(code: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      redirect_uri: googleRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Google token exchange failed ${res.status} ${text}`.slice(0, 300));
  }
  return (await res.json()) as { access_token: string };
}

export async function fetchGoogleProfile(accessToken: string): Promise<GoogleProfile> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Google profile failed");
  const raw = (await res.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean | string;
    name?: string;
    picture?: string;
  };
  const email = raw.email?.trim().toLowerCase();
  const verified = raw.email_verified === true || raw.email_verified === "true";
  if (!raw.sub || !email || !verified) throw new Error("Google email is not verified");
  return {
    sub: raw.sub,
    email,
    name: (raw.name || email.split("@")[0] || "Tijarah user").slice(0, 80),
    picture: raw.picture,
  };
}

export function signOAuthState(role = "") {
  return jwt.sign({ r: role }, env.jwtAccess, { expiresIn: "10m" });
}

export function verifyOAuthState(state: string) {
  const p = jwt.verify(state, env.jwtAccess) as { r?: string };
  return p.r === "SALESMAN" || p.r === "COMPANY" ? p.r : "";
}

export function signGooglePending(profile: GooglePending) {
  return jwt.sign(profile, env.jwtAccess, { expiresIn: "10m" });
}

export function verifyGooglePending(token: string): GooglePending {
  const p = jwt.verify(token, env.jwtAccess) as GooglePending;
  if (!p.email || !p.name) throw new Error("Invalid pending Google profile");
  return p;
}
