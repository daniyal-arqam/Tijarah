# Tijarah Phase 1 — Master Prompt

**Use:** seed for Step 5 (UI/UX: Stitch / Figma) and Step 6 (frontend + backend + database).  
**Do not implement Phase 2 or Phase 3.**  
**Source of truth:** `docs/PRD-Tijarah.md`

Copy everything below the line into a design tool or a coding agent.

---

You are designing and specifying a production web product named **Tijarah (تجارة)**.

Tijarah is a bilingual (English + Arabic, full RTL) B2B web app for the Kingdom of Saudi Arabia. It serves metal **salesmen / middlemen** who visit factories and buying companies. The salesman does not own the factory. He takes an order from a company, places it with a factory, and earns a markup. Example: factory will make the job for 15,000 SAR; he quotes the company 18,000 SAR; he keeps 3,000 SAR. Factory cost and margin are **secrets**. The company must never see them — not in the UI, not in API JSON, not in PDFs.

The product replaces cold in-person visits with a trusted public profile, structured quotes, order tracking, bilingual VAT invoices, and reviews.

This prompt is **Phase 1 only**. Do not design screens or APIs for: cold-email campaigns, open/click tracking, factory login, WhatsApp Business API, Stripe/escrow, native apps, AI/ML, Google Meet APIs, Redis, leaderboards.

## Brand

- Name: Tijarah / تجارة
- Tagline EN: Trusted metal supply — without another site visit.
- Tagline AR: توريد المعدن بثقة — بدون زيارة أخرى.
- Tone: serious Gulf B2B. Calm, precise, trustworthy. Not playful, not neon SaaS, not generic purple “AI dashboard”, not stock crypto-fintech.
- Visual world: steel, sand, ink. Warm off-white canvas, charcoal text, oxidized-steel or copper used sparingly for CTAs and trust badges. High contrast for outdoor mobile use.
- Typography: IBM Plex Sans Arabic or Tajawal for Arabic; a paired grotesque for Latin (e.g. IBM Plex Sans). Never a font that breaks Arabic joining.
- Radius: modest (8–12px). Dense professional tables on desktop; stacked cards on mobile.
- Direction: `dir="rtl"` when `lang="ar"`. Language toggle in the header on every page. Persist preference on the user.
- Currency: SAR. VAT 15%. Cities and specialties are official enums from the PRD (steel structure, sheet metal, tanks, pipes, CNC, stainless, aluminum, gates & fences, rebar, custom fabrication) with Arabic labels.
- Verification disclaimer: badges mean an admin reviewed a document, not a government API.

## Users (Phase 1)

1. **Salesman** — profile, invite companies, search/save leads, quotes with private factory cost, orders, invoices, payments, reviews response, private margin on dashboard.
2. **Company** — profile, browse salesmen, RFQ, accept/counter/reject, track orders, invoices, confirm receipt, review.
3. **Admin** — approve/reject Iqama/National ID and CR files, suspend users, archive reviews, stats.

Role is chosen at signup and locked.

## Core loop to design end-to-end (must work on a 390px phone)

Invite or discover → RFQ → Quote (18,000 visible, 15,000 hidden) → optional counter → Order statuses Confirmed → Sent to factory → In production → Shipped → Delivered → Company Received → bilingual invoice PDF → record bank/cash/cheque → review → trust score updates.

## Information architecture (screens)

### Public
- Landing (EN/AR): two paths — For salesmen / For companies. How it works. Trust. CTA signup.
- Login, signup (role picker), forgot password, reset, email-verify waiting.
- Public salesman profile by slug (shareable on a business card): photo, badges, specialties, cities, trust score, stats, portfolio, reviews. No cost/margin.

### Salesman
- Onboarding: profile completeness checklist (photo, cities, specialties, ID upload).
- Dashboard: trust, orders this month, paid revenue, open quotes, pending deliveries, on-time %, rating sparkline, private margin.
- Profile editor + portfolio + certification uploads.
- Companies: search filters (industry, city, size) + lists Hot / Follow-up / Not interested / custom.
- Invite company (name, email, city, industry).
- RFQs inbox.
- Quote builder: line items, discount, terms (Advance 50/50, Net 15/30/45, COD), delivery date, **factory cost field marked private**, live margin, send.
- Quote versions + counter handling.
- Orders board (kanban + table) + order detail with timeline, photo upload, status change.
- Invoices list + invoice detail + record payment.
- Messages per RFQ/order.
- Meetings: request/accept, type phone/in-person/video, pasted link or address.
- CSV export.
- Settings: language, password, notification email on/off.

### Company
- Onboarding: CR, VAT, city, industry, size, logo.
- Dashboard: spend this month, in-progress, open RFQs.
- Find salesmen: filters + match % + top matches.
- Salesman profile → Request quote.
- My RFQs / quotes (compare versions, counter, accept/reject).
- Orders + confirm receipt + delivery photos.
- Invoices (download PDF). Cannot mark paid.
- Review form unlocked only after Received.
- Messages, meetings, settings.

### Admin
- Verification queue (document preview, approve/reject).
- Users (suspend).
- Reviews (archive).
- Simple counts: users, orders, GMV.

## Trust score (display + calculate on server)

Email 10 + phone 10 + ID 15 + CR 15 + min(20, delivered×2) + on-time up to 15 + (avgRating/5×15). Cap 100. Stats come from real orders, never from salesman-typed numbers.

## Security (must be visible in UX copy where useful, and mandatory in backend)

- bcrypt passwords; JWT in httpOnly cookies; no localStorage tokens.
- RBAC on every route. IDOR: 403 on other people’s quotes/orders/invoices/files.
- Company serializer strips `factoryCost` and `margin`.
- Rate limit login 5/15 min/IP.
- Zod on all writes. Sanitize message/RFQ/review text (no HTML).
- CORS allowlist. Helmet. Env secrets. HTTPS.
- Files: PDF/JPG/PNG ≤ 10MB.

## Tech (for implementation, not for Figma)

Frontend Next.js App Router + TS + Tailwind + shadcn/ui + next-intl on **Vercel**.  
Backend Express + TS on **Render**.  
Postgres + Prisma. Optional Google OAuth. Email via Resend/SMTP. PDF on the server, bilingual.

## Design quality bar

Layouts must look like a Gulf industrial trade desk: bilingual header, clear SAR amounts, stamp-like verification badges, timeline for orders, quote paper that resembles a commercial offer. Avoid identical card grids, Inter+purple, fake charts, and placeholder “AI insights”. Empty states teach the invite flow (“Invite a company you already work with”).

## Out of scope (do not draw, do not code)

Cold email campaigns, factory user, WhatsApp API, Stripe, Meet/Calendar OAuth, SMS, PWA, ML, leaderboards, bulk-mark-delivered, GitHub login.

## Deliverable depending on the tool

- **If design tool:** desktop + mobile frames for every screen above, RTL Arabic versions of landing, quote, invoice, and dashboard, plus a small component sheet (buttons, badges, inputs, tables, timeline).
- **If coding agent:** implement Phase 1 full-stack against this prompt and the PRD, with seed users Admin / Salesman / Company, one completed order, one review, both locales working.

Build only Phase 1. Make every Phase 1 control work.
