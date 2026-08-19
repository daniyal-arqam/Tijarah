import "dotenv/config";

function req(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

export const env = {
  databaseUrl: req("DATABASE_URL"),
  jwtAccess: req("JWT_ACCESS_SECRET"),
  jwtRefresh: req("JWT_REFRESH_SECRET"),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",
  port: Number(process.env.PORT ?? process.env.API_PORT ?? 4000),
  cookieSecure: process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production",
  nodeEnv: process.env.NODE_ENV ?? "development",
  googleClientId: process.env.GOOGLE_CLIENT_ID?.trim() ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "",
};

export const ACCESS_TTL = "15m" as const;
export const REFRESH_TTL_DAYS = 7;
