import "dotenv/config";

function req(name: string, min = 1) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  if (v.length < min) throw new Error(`${name} must be at least ${min} characters`);
  return v;
}

export const env = {
  databaseUrl: req("DATABASE_URL"),
  jwtAccess: req("JWT_ACCESS_SECRET", 32),
  jwtRefresh: req("JWT_REFRESH_SECRET", 32),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",
  port: Number(process.env.PORT ?? process.env.API_PORT ?? 4000),
  cookieSecure: process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production",
  nodeEnv: process.env.NODE_ENV ?? "development",
  googleClientId: process.env.GOOGLE_CLIENT_ID?.trim() ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "",
};

export const ACCESS_TTL = "15m" as const;
export const REFRESH_TTL_DAYS = 7;
