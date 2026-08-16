# Tijarah · تجارة

**Bilingual B2B marketplace for metal salesmen and buying companies in Saudi Arabia.**

[Live app](https://tijarah-api-ca5g.vercel.app) · [API health](https://tijarah-zn2s.onrender.com/health) · [Product spec](docs/PRD-Tijarah.md)

> Where metal moves before the truck does.  
> المعدن يتحرك قبل أن تتحرك الشاحنة.

![Steel coils — Tijarah hero](apps/web/public/hero-coil.jpg)

Tijarah is the operating system of a metal **middleman** in KSA. You do not own the factory. You take a company order, place it with a mill, and keep the markup. Factory cost stays **private** — the company never sees it in the UI, in API JSON, or on invoices.

**Phase 1 is live.** Later phases (factory desk, real email campaigns, online payments, WhatsApp API, mobile) are planned below — not built yet.

---

## Why this exists

Visiting companies across the Kingdom does not scale. Some give the order; some refuse. There is no profile to leave on a desk, no quote history, no shared delivery status, and no proof of on-time work. Status lives in WhatsApp. Commission lives in your head.

| Who | Pain today | What Tijarah does |
|---|---|---|
| **Salesman** | Travel does not scale; hard to look established | Public trust profile, matched leads, private margin, VAT invoices |
| **Company** | Cannot compare suppliers on delivery record | Filters, match %, quotes, order trail, reviews tied to real orders |
| **Factory** | Irregular jobs, messy specs *(Phase 2)* | Own login, job timeline, **never** sees the sell price |

---

## Phase 1 — what is live now

One product, three roles, one deal loop that actually works.

### Roles

| Role | Can do | Cannot do |
|---|---|---|
| **Salesman** | Profile, leads, outreach templates, RFQs, quotes with private factory cost, orders, invoices, reviews | See another salesman’s costs |
| **Company** | Browse suppliers, send RFQ, accept / reject / counter, track orders, pay against invoice, review after receipt | See `factoryCostEstimate` or `margin` |
| **Admin** | Platform overview | Expose one user’s margin to another |

### Core loop

```
Invite a company  or  they find you by specialty + city
  → RFQ (product, qty, unit, destination, specs)
    → Quote (sell price visible + factory cost hidden)
      → optional counter
        → Accept → Order
          → Confirmed → factory → production → shipped → delivered
            → Company confirms received
              → Invoice · VAT 15% · SAR
                → Record bank / cash / cheque
                  → Review → trust score updates
```

Example: factory will make the job for **15,000 SAR**. You quote **18,000 SAR**. You keep **3,000 SAR**. The company JSON never includes the 15,000.

### What shipped in this repo

- English + Arabic UI, RTL, language and light/dark toggle
- Auth: signup by role, login, logout, password reset · JWT in **httpOnly** cookies
- Salesman dashboard: KPIs, revenue trend, orders by status
- Lead discovery with match %, filters, contact
- Outreach compose + campaign tracking (templates; sending is local until SMTP is wired)
- RFQ → quote builder (unit price, private factory cost, VAT 15%, payment terms)
- Orders with status timeline
- Tax invoices in SAR
- Reviews after a received order · server-side **trust score 0–100**
- Public salesman profile (`/p/[slug]`) for a business card
- Deployed: **Vercel** (web) + **Render** (API) + **Neon** (Postgres)

### Security (Phase 1)

- bcrypt passwords · access token 15m + refresh 7d in httpOnly cookies
- RBAC on every `/api` route · company payloads stripped of factory cost / margin
- Login rate limit (5 / 15 min) · Zod validation · helmet · CORS allowlist
- Secrets only in env vars — `.env` is gitignored

Full notes: [docs/STEP-8-SECURITY.md](docs/STEP-8-SECURITY.md)

---

## Live demo

| | |
|---|---|
| **Web** | https://tijarah-api-ca5g.vercel.app |
| **API** | https://tijarah-zn2s.onrender.com/health |
| **Password** (all demo users) | `Tijarah1!` |

| Role | Email |
|---|---|
| Salesman | `salesman@tijarah.sa` |
| Company | `company@tijarah.sa` |
| Admin | `admin@tijarah.sa` |

Public profile: [fahad-al-rashid](https://tijarah-api-ca5g.vercel.app/p/fahad-al-rashid)

First API hit on the free Render instance can take 30–60 seconds.

---

## Stack

| Layer | Choice |
|---|---|
| Web | Next.js 15, React 19, TypeScript, Tailwind |
| API | Node.js, Express, Zod |
| Data | PostgreSQL (Neon) + Prisma |
| Auth | JWT httpOnly cookies, bcrypt |
| Hosting | Vercel (web), Render (API), GitHub |

```
Browser  →  Vercel (apps/web)  →  rewrites /api and /auth
                                      ↓
                              Render (apps/api)
                                      ↓
                                 Neon Postgres
```

```
tijarah/
├── apps/web          Next.js app (landing + workspace)
├── apps/api          Express API + Prisma schema + seed
├── docs              PRD, design lock, security, deploy
├── render.yaml       Render service
└── vercel.json       Vercel build
```

---

## Run locally

Needs **Node 20+**. Copy env, then:

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

Use the same demo logins as production. Never commit `.env`.

---

## Roadmap — what to build next

Phase 1 is the floor: you can invite a real company, send a real quote, and record a real bank transfer. Everything below is **this same product**, not a rewrite.

### Phase 2 — scale the desk (next)

Build this after you have used Phase 1 with at least one real order.

1. **Factory role**  
   Factory signup / invite. Job board with spec, qty, due date, **factory price only**. Status: accepted → production → QC → ready → shipped + photos. Factory must never see sell price or invoices.

2. **Real outreach email**  
   Today’s Outreach screen is the UI. Wire SMTP (Resend or similar), send from a real domain, track opens/clicks, auto follow-up at 3 / 7 / 14 days, unsubscribe + PDPL-style consent. Throttle sending so the domain is not treated as spam.

3. **Hardening that buyers will notice**  
   Phone OTP (true Phone ✓), 2FA, admin ID/CR verification queue with document preview, broadcast RFQ to several salesmen and compare quotes side by side.

4. **Course “second app” (if required)**  
   Split the factory desk into its own small portal that talks to the same API — or keep it as a role inside Tijarah. Do not start a second product until Phase 1 has a real order.

### Phase 3 — platform

Only after real volume exists.

- Online pay (Mada / cards) and optional escrow + payouts  
- WhatsApp Business API + SMS  
- Native iOS/Android or a serious PWA with push  
- Logistics / live shipment tracking  
- Light ML: price suggest, best time to contact, fraud / duplicate accounts  
- Monetization: featured listing, then a take-rate when money moves on-platform  

### Suggested order for you

| Order | Do this | Why |
|---|---|---|
| 1 | Finish one paid order on the live site with a real company | Proves the loop; gives reviews and trust score |
| 2 | Put the public profile URL on your card / WhatsApp | `/p/your-slug` is the sales asset |
| 3 | Factory desk (Phase 2.1) | Stops status living in WhatsApp with the mill |
| 4 | SMTP + domain for outreach (Phase 2.2) | This is how you visit less |
| 5 | Verification + 2FA | Makes “Verified” mean something to a buyer |
| 6 | Payments / WhatsApp / apps (Phase 3) | After the desk is a habit, not before |

Do not start Phase 3 while the factory still gets jobs only by phone.

---

## Docs in this repo

| File | What it is |
|---|---|
| [docs/PRD-Tijarah.md](docs/PRD-Tijarah.md) | Full product requirements (all phases) |
| [docs/MASTER-PROMPT-Tijarah-Phase1.md](docs/MASTER-PROMPT-Tijarah-Phase1.md) | Phase 1 build prompt |
| [docs/DESIGN-LOCK-Tijarah.md](docs/DESIGN-LOCK-Tijarah.md) | Visual lock |
| [docs/STEP-8-SECURITY.md](docs/STEP-8-SECURITY.md) | Security checklist |
| [docs/STEP-9-DEPLOY.md](docs/STEP-9-DEPLOY.md) | Vercel + Render + Neon |

---

## Author

Built by [Daniyal Arqam](https://github.com/daniyal-arqam) for a metal middleman workflow in the Kingdom of Saudi Arabia.

Currency **SAR** · VAT **15%** · Languages **EN + AR**.
