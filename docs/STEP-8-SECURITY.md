# Step 8 — Secure everything (Tijarah Phase 1)

Pipeline Step 8 is applied in code. HTTPS on Vercel/Render is confirmed at deploy (Step 9).

## Access
- bcrypt cost 12; passwords never returned (`publicUser` strips `passwordHash`)
- JWT access 15m + refresh 7d in **httpOnly** cookies (not localStorage)
- RBAC middleware on `/api`; company cannot create quotes or list all companies
- Factory cost / margin stripped in JSON for `COMPANY` role (server-side)
- Zod on writes; HTML tags stripped from RFQ/quote notes/reviews/messages

## Data protection
- Secrets only in `.env` / host dashboards — `.gitignore` includes `.env`
- `.env.example` has empty placeholders
- Production errors do not leak stack traces
- `x-powered-by` disabled

## Traffic
- Login/signup: **5 attempts / 15 min / IP** (successful logins skipped)
- JSON body max 1mb
- Render: `trust proxy` so rate-limit sees real IP

## Network
- CORS allowlist = `FRONTEND_ORIGIN` only, credentials on
- Helmet + HSTS when `NODE_ENV=production`
- Next headers: nosniff, DENY iframe, Referrer-Policy, Permissions-Policy
- Production cookies: `Secure` (HTTPS)

## HTTPS (Step 9)
Vercel and Render terminate TLS. After deploy, confirm:
- [ ] Frontend URL starts with `https://`
- [ ] API URL starts with `https://`
- [ ] Browser padlock, no mixed content
- [ ] `COOKIE_SECURE=true` and `NODE_ENV=production` on Render
