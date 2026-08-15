# Tijarah (تجارة)

Bilingual B2B metal middleman platform for Saudi Arabia. Phase 1: auth, RBAC, quotes with **private factory cost**, orders, VAT invoices, reviews.

## Stack

- **Web:** Next.js (Vercel) — `apps/web`
- **API:** Express + Prisma (Render) — `apps/api`
- **DB:** SQLite locally (`apps/api/prisma/dev.db`). Postgres on deploy (change `DATABASE_URL` + Prisma provider).

## Local run

```bash
copy .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev:api
npm run dev:web
```

- App: http://localhost:3000
- API: http://localhost:4000/health

### Demo logins (password `Tijarah1!`)

| Role | Email |
|---|---|
| Salesman | salesman@tijarah.sa |
| Company | company@tijarah.sa |
| Admin | admin@tijarah.sa |

Public profile: http://localhost:3000/p/fahad-al-rashid

Light/dark toggle and EN | ع are in the header.

## Security (Phase 1)

- bcrypt password hashing
- JWT access (15m) + refresh (7d) in **httpOnly** cookies
- Login rate limit: 5 / 15 min
- RBAC on every `/api` route
- Company responses **never** include `factoryCostEstimate` or `margin`
- Zod validation, helmet, CORS allowlist, parameterized Prisma queries
- Secrets only in `.env` (not committed)
