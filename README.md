# Tijarah · تجارة

**Bilingual B2B marketplace for metal salesmen, buying companies, and mills in Saudi Arabia.**

[Live app](https://tijarah-api-ca5g.vercel.app) · [API health](https://tijarah-zn2s.onrender.com/health) · [Product spec](docs/PRD-Tijarah.md)

> Where metal moves before the truck does.  
> المعدن يتحرك قبل أن تتحرك الشاحنة.

![Steel coils — Tijarah hero](apps/web/public/hero-coil.jpg)

Tijarah is the desk of a metal **middleman** in KSA. The salesman does not own the factory. A company lists what it needs; salesmen take mill estimates, then send their own rate. The company picks the best trust score and the lowest rate. The salesman pays the mill when the job is ready, delivers to the company, and collects from the company. Mill cost stays **private**. The mill never sees the buying company.

---

## Why this exists

Visiting companies across the Kingdom does not scale. Some give the order; some refuse. There is no profile to leave on a desk, no quote history, no shared delivery status, and no proof of on-time work. Status lives in WhatsApp. Profit lives in your head.

| Who | Pain today | What Tijarah does |
|---|---|---|
| **Salesman** | Travel does not scale; hard to look established | Public trust profile, open needs, mill estimates, private profit |
| **Company** | Cannot compare suppliers on delivery record | List a need, compare salesman rates + trust, order trail, reviews |
| **Factory** | Irregular jobs, messy specs | Estimate board and mill jobs — **never** sees the company or sell price |

---

## What is live now

One product, three desks, one money loop.

### Roles

| Role | Can do | Cannot do |
|---|---|---|
| **Salesman** | See open company needs, ask mills for estimates, send a rate, pay the mill, deliver, invoice the company | Show mill identity or mill price to the company |
| **Company** | List a product to buy or customize, compare salesman trust + rates, accept, track delivery, pay the salesman, review | See mill name, mill cost, or salesman profit |
| **Factory** | Quote price + ready date, receive mill jobs, get paid by the salesman, review the salesman | See the buying company or the sell price |
| **Admin** | Platform overview | Expose one side’s numbers to the other |

### Core loop

```
Company lists a need (buy ready or customize)
  → Salesmen request mill estimates (price + ready date)
    → Salesman picks cheapest / fastest mill
      → Outreach to that company with his rate
        → Company picks best trust score + lowest rate
          → Order confirmed
            → Salesman places the job with the mill
              → Mill ready → salesman pays the mill
                → Deliver to company → company pays the salesman
                  → Company and mill both review the salesman
                    → Trust score updates
```

Example: mill estimate **1,000 SAR**. Salesman tells the company **1,100 SAR**. Profit is **100 SAR**, visible only to the salesman.

### What shipped in this repo

- English + Arabic UI, RTL, language and light/dark toggle
- Auth: signup by role, login, logout, password reset · JWT in **httpOnly** cookies
- Company need listings and salesman open-need board
- Mill estimates (price + ready date); salesman picks cheapest/fastest
- Proposals to company inbox with rate; sorted by trust then price
- Quotes and orders with private mill cost and salesman profit
- Salesman pays mill, then collects from the company (VAT 15%, SAR)
- Reviews from **both** company and mill on the salesman
- Public salesman profile (`/p/[slug]`)
- Deployed: **Vercel** (web) + **Render** (API) + **Neon** (Postgres)

### Security

- bcrypt passwords · access token 15m + refresh 7d in httpOnly cookies
- RBAC on every `/api` route · company payloads stripped of mill cost / profit
- Factory payloads stripped of buyer identity
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
| Salesman | `khalid@tijarah.sa` |
| Factory | `factory@tijarah.sa` |
| Factory | `yanbu@tijarah.sa` |
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
