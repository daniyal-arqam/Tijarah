# Tijarah (تجارة) — Product Requirements Document

**Status:** Step 3 frozen  
**Owner:** Middleman, Kingdom of Saudi Arabia  
**Last updated:** 14 August 2026  
**Currency:** SAR · **VAT:** 15%  
**Languages (all phases):** English + Arabic (RTL)  
**Build now:** Phase 1 only · **Apps now:** one product (Tijarah)

---

## 0. How to read this document

This PRD holds the **complete product idea** — everything you described, plus the real KSA workflow (visit companies → win order → factory makes it → you keep the markup).

We will **not** build everything at once. Features are split into phases. **Phase 1 is the only build scope until you say otherwise.** Every Phase 1 feature must actually work (responsive web app, no fake buttons). Later phases stay in this document so the idea is complete and the data model does not paint us into a corner.

| Phase | Name | When |
|---|---|---|
| **1** | Core marketplace (this build) | Now |
| **2** | Factory desk + cold emailing | After Phase 1 is live and you are using it |
| **3** | Payments, WhatsApp API, AI, mobile | After real orders exist |

Assignment note: the course asks for **two** live apps. Right now we build **one** (Tijarah). The second app is deferred until you ask for it (likely a small Factory portal split from Phase 2, or another product). Do not start it in Phase 1.

---

## 1. Product name and positioning

**Name:** Tijarah · **تجارة**  
**What it is:** A bilingual B2B platform where metal **salesmen / middlemen** in Saudi Arabia build a trusted public profile, get found by companies (or invite clients they already know), quote with a private factory cost + visible sell price, track the order, invoice in SAR + VAT, and collect reviews.

**Tagline (EN):** Trusted metal supply — without another site visit.  
**Tagline (AR):** توريد المعدن بثقة — بدون زيارة أخرى.

**Who you are in the product:** a salesman. You do not own the factory. You take a company order, place it with a factory, and earn the difference (example: factory 15,000 SAR → you quote 18,000 SAR).

---

## 2. Problem

Visiting many companies across KSA takes too much time. Some give the order; some refuse. There is no professional profile to leave behind, no structured quote history, no shared order status, and no proof of on-time delivery. Companies only know you if you walked in.

When an order is won, the job goes to a factory. Status lives in WhatsApp. Invoices are ad-hoc. Your commission is in your head.

**Who is hurt**

- **Salesman:** travel does not scale; no pipeline; hard to look established.
- **Company:** cannot compare middlemen on delivery record; risk of unknown suppliers.
- **Factory (Phase 2):** irregular jobs; no clean spec/status trail.

---

## 3. Complete vision (all phases — the full idea)

Tijarah becomes the operating system of a metal middleman in KSA:

1. **Trust profile** — photo, ID/CR verification, specialties, cities, certifications, portfolio, reviews, auto trust score.
2. **Discovery** — companies find salesmen; salesmen find / save companies; match score; later, high-volume filters and AI matching.
3. **Outreach** — Phase 1 = invite + in-app RFQ. Phase 2 = **cold emailing** (campaigns, templates EN/AR, schedule, open/click tracking, auto follow-up 3/7/14 days).
4. **Quote & negotiate** — line items, VAT, payment terms, version history, private factory cost.
5. **Order tracking** — Confirmed → factory → production → shipped → delivered → received.
6. **Factory (Phase 2)** — factory login, job accept, production photos; factory never sees sell price.
7. **Invoice & payment** — Phase 1 = PDF + manual bank/cash/cheque. Phase 3 = online pay / escrow.
8. **Reviews** — only after confirmed delivery.
9. **Dashboard** — revenue, margin (private), conversion, on-time %.
10. **Meetings, WhatsApp, calendar, native apps, logistics** — later phases.

You can earn from day one of Phase 1: invite a real company, send a real quote, record a real bank transfer. Cold emailing and factory logins make it scale; they are not required to take the first paid order.

---

## 4. Roles (RBAC)

### Phase 1 roles

| Role | Can do | Cannot do |
|---|---|---|
| **Salesman** | Own profile, invite companies, search/save companies, receive/send RFQs & quotes, set factory cost (private), manage orders, invoices, payments, see own margin, reply to reviews | See other salesmen’s costs; approve verifications; mark another user’s order received |
| **Company** | Own profile, browse salesmen, RFQ, accept/reject/counter quotes, track orders, view invoices, confirm receipt, review | See `factoryCost` / `margin`; update production status; review without a received order |
| **Admin** | Approve/reject ID & CR, suspend users, archive reviews, platform stats | Hard-delete reviews; expose one salesman’s margin to another |

### Phase 2 adds

| Role | Can do | Cannot do |
|---|---|---|
| **Factory** | Own factory profile, accept/reject jobs, update production, upload photos | See sell price, margin, company invoice totals |

Every API checks **JWT + role + ownership**. Money fields are stripped on the server (not hidden in CSS). Example: company `GET /quotes/:id` never includes `factoryCost` or `margin`.

---

## 5. Official lists (EN + AR)

### Metal specialties (salesman multi-select)

| Key | English | العربية |
|---|---|---|
| steel_structure | Steel structure | الهياكل الفولاذية |
| sheet_metal | Sheet metal | تشكيل الصفائح المعدنية |
| tanks | Tanks | الخزانات |
| pipes | Pipes | الأنابيب |
| cnc | CNC machining | التشغيل الرقمي CNC |
| stainless | Stainless steel | الستانلس ستيل |
| aluminum | Aluminum | الألمنيوم |
| gates_fences | Gates & fences | البوابات والأسوار |
| rebar | Rebar | حديد التسليح |
| custom | Custom fabrication | تصنيع حسب الطلب |

### Company industries

Steel / الصلب · Manufacturing / التصنيع · Trading / التجارة · F&B / الأغذية والمشروبات · Construction / الإنشاءات · Oil & Gas / النفط والغاز · HVAC / التكييف · Automotive / السيارات · Infrastructure / البنية التحتية

### Cities (coverage + filters)

Riyadh / الرياض · Jeddah / جدة · Dammam / الدمام · Khobar / الخبر · Jubail / الجبيل · Yanbu / ينبع · Makkah / مكة المكرمة · Madinah / المدينة المنورة · Qassim / القصيم · Abha / أبها · Tabuk / تبوك · Jazan / جازان · Other / أخرى

### Company size

SMB / منشأة صغيرة · Mid-size / متوسطة · Enterprise / كبيرة

### Payment terms

Advance 50/50 · Net 15 · Net 30 · Net 45 · COD (cash on delivery)

### Payment methods (recording)

Bank transfer / تحويل بنكي · Cash / نقداً · Cheque / شيك

---

## 6. Phase 1 — Core (BUILD THIS)

If it is not in this section, it is **not** in the current build.

### 6.1 Auth and security

- Sign up / login / logout / forgot-reset password.
- Role at signup: **Salesman** or **Company** (locked; admin can change).
- Optional **Google** OAuth. No GitHub.
- Email verification before RFQ/quote send.
- Passwords: bcrypt cost ≥ 10. JWT access 15 min + refresh 7 days in **httpOnly** cookies. No tokens in `localStorage`.
- Language preference: `en` | `ar`, stored on user, toggle in header, `<html dir="rtl" lang="ar">` when Arabic.
- Rate limit: login 5 / 15 min / IP; also signup and password reset.
- Zod validation on every write. Prisma parameterized queries. helmet. CORS = frontend origin only.
- Secrets in env vars only. HTTPS in production (Vercel + Render).
- File upload: PDF/JPG/PNG, max 10 MB, MIME check, signed URLs.

### 6.2 Bilingual UI

- Every Phase 1 screen has EN and AR strings.
- Invoice PDF: **bilingual** (KSA commercial habit) — Arabic + English on one document.
- Dates: Gregorian; numbers can stay Western digits for money (common in KSA invoices) with `SAR` / `ر.س`.

### 6.3 Salesman profile and trust

- Edit: name, photo, years of experience, bio (EN/AR optional fields or one field), specialties, coverage cities, certifications (name + file), portfolio (max 12 images).
- Public `wa.me` link if phone exists (not WhatsApp API).
- **Auto stats from real orders only:** delivered count, on-time %, average delivery days, average rating.
- **Trust score 0–100** (server):

  | Signal | Points |
  |---|---|
  | Email verified | 10 |
  | Phone verified (admin in Phase 1) | 10 |
  | ID (Iqama / National ID) approved | 15 |
  | Business (CR) approved | 15 |
  | Completed orders | min(20, count × 2) |
  | On-time % | up to 15 |
  | Average rating | up to 15 (rating/5 × 15) |

- Badges on profile: Email ✓ Phone ✓ ID ✓ Business ✓  
- Disclaimer: verification = admin reviewed a document, not a government API.

### 6.4 Company profile

- Legal name, trade name, industry, size, city, CR, VAT number, contact person, phone, logo.
- Salesmen see: name, industry, city, size, completed-order count on Tijarah — **not** other suppliers’ prices.

### 6.5 Invite (required — empty marketplace)

- Salesman: Invite company → company name, email, city, industry (optional).
- Email (EN+AR) with signup link; role locked to Company; linked to that salesman.
- After accept, salesman can RFQ/quote immediately.
- Salesman may also **create a quote request toward an invited company** once they have an account.
- Invite reminder: one follow-up email after 3 days if not accepted (simple; not a campaign engine).

### 6.6 Discovery

**Company → salesmen:** filter specialty, city, min trust, min rating, verified-only. Sort: trust, rating, on-time, newest.  
**Match score (rule-based):** +40 specialty overlap, +30 same city, +15 trust, +15 rating. “Top matches” = top 10 for that company.  
**Salesman → companies:** filter industry, city, size. Save to lists: Hot / Follow-up / Not interested + custom list names.

### 6.7 RFQ → quote → negotiate → order

- Company sends RFQ to **one** salesman: title, specialty, specs, qty, unit, destination city, needed-by, optional drawing.
- Salesman quote: line items, auto totals, discount, payment terms, delivery date, notes.
- **Private:** `factoryCostEstimate`, `margin` = sell − cost. Company JSON omits these. UI label: “Factory cost — only you can see this” / “تكلفة المصنع — تظهر لك فقط”.
- Status: draft → sent → viewed → countered → accepted | rejected | expired (7 days default).
- Counter: company proposes total and/or date; salesman accepts or sends new version (v1, v2, …).
- Accept → order created.

### 6.8 Orders

Pipeline: `Confirmed` → `Sent to factory` → `In production` → `Shipped` → `Delivered` → `Received` (company confirm).

Phase 1: salesman updates factory-related statuses **manually** (they still WhatsApp the factory). Photos + notes per update. Company sees pipeline + photos. No bulk complete. Filters: status, dates.

### 6.9 Invoices and payment

- Auto invoice from accepted order: Tijarah invoice number, salesman identity, company identity, CR/VAT if present, line items, subtotal, VAT 15%, total SAR.
- Download bilingual PDF; email PDF to company.
- Salesman records payment: amount, date, method, reference. unpaid / partial / paid.
- One overdue email after due date.
- Company cannot mark paid.

### 6.10 Reviews

- Only when status = `Received`.
- Quality, delivery speed, professionalism (1–5) + text + would-order-again.
- Public on salesman profile. One salesman response. No delete; admin archive. Recalculate trust score.

### 6.11 Dashboards

- **Salesman:** trust, orders this month, paid revenue, open quotes, pending deliveries, on-time %, rating, monthly chart, top products, **private margin total**.
- **Company:** spend this month, in-progress orders, open RFQs, invoices.
- **Admin:** pending verifications, user/order counts, GMV. No public salesman revenue leaderboard.

### 6.12 Communication

- Message thread per RFQ/order (plain text, sanitized).
- Transactional email: verify, reset, invite, RFQ, quote sent/accepted, status, invoice, review request, meeting reminder.
- In-app bell + email. No SMS, no push, no WhatsApp Business API.
- Meeting: datetime, type (phone / in-person / video), pasted location or link, accept/decline, email 1 hour before.

### 6.13 Tools

- CSV export of own orders and saved companies.
- Margin calculator on quote form.

### 6.14 Admin

- Queue of ID/CR/cert files: approve / reject.
- Suspend user.
- Archive review.

---

## 7. Phase 2 — After Phase 1 is live

Do not implement now. Keep in schema thinking only where noted.

### 7.1 Factory desk (same Tijarah product, new role)

- Factory signup / invite by salesman.
- Factory profile: processes (same specialty list), city, CR, capacity.
- Job from an order: spec, qty, due date, **factory price only**.
- Factory: accept/reject; `Accepted` → `In production` → `QC` → `Ready` → `Shipped`; photos.
- Factory **never** sees sell price or invoices.
- Optional: job status syncs Market order status.

### 7.2 Cold emailing (outreach automation)

This is the “visit less” scaler once profiles exist.

- Pick companies from lists (or filters) → campaign.
- Templates EN/AR, personalization (name, city, specialty), edit before send.
- Send from platform; schedule send time.
- Track opens, link clicks, profile views.
- Auto follow-up: 3, 7, 14 days if no reply.
- Campaign analytics.
- Respect unsubscribe + KSA/PDPL-style consent later (legal copy required before turning this on).
- Rate-limit sending so the domain is not treated as spam.

Phase 1 already creates **lead lists** so this has somewhere to attach.

### 7.3 Other Phase 2

- Phone OTP (true Phone ✓).
- Broadcast RFQ to multiple salesmen; side-by-side quote compare.
- 2FA.
- WhatsApp click-to-chat templates (still not full Business API unless approved).
- Google Calendar / Meet link paste improvements.
- Preferred-supplier and volume filters (when enough data exists).

---

## 8. Phase 3 — Scale

- Stripe / 2Checkout / Mada-style online pay; escrow; automatic payouts.
- WhatsApp Business API + SMS.
- Native iOS/Android; PWA push.
- ML: churn, price suggest, demand forecast, “best time to contact”.
- Competitor intel, leaderboards, referrals, community.
- Logistics partners, live shipment tracking.
- Redis cache, advanced monitoring.
- Background checks, duplicate-account fraud models.
- Full contract templates, subscriptions for other salesmen (platform take-rate or featured listing).

---

## 9. Core loop (Phase 1)

```
Salesman invites company  OR  company signs up and finds salesman
  → Company RFQ (product, qty, city, date, drawing)
    → Salesman Quote (sell 18,000 + private factory cost 15,000)
      → optional counter → new version
        → Accept → Order
          → Salesman updates: Sent to factory → In production → Shipped → Delivered
            → Company confirms Received
              → Bilingual invoice + VAT 15%
                → Record bank transfer
                  → Review → trust score updates
```

---

## 10. User flows (Phase 1)

**A — Company finds you:** signup (AR or EN) → verify email → filters “Sheet metal” + “Riyadh” → profile (trust, reviews) → RFQ → you quote 18,000 (cost 15,000 hidden) → accept → you update status → they confirm → invoice → pay → review.

**B — You already have the client:** Invite by email → they join → you send quote → same path. This is how you earn before the marketplace is full.

**C — Admin:** salesman uploads Iqama + CR → admin approves → badges + trust jump.

**D — Attacks to block:** company cannot read `factoryCost`; cannot open another company’s quote (403); 6th login in 15 min = 429; `<script>` in notes is escaped; files are not executable.

---

## 11. Data model (Phase 1 tables)

`User` `SalesmanProfile` `CompanyProfile` `Credential` `LeadList` `LeadListItem` `Invite` `Rfq` `Quote` `QuoteLine` `Order` `OrderEvent` `Invoice` `Payment` `Review` `Message` `Meeting` `Notification` `RefreshToken`

Phase 2 adds `FactoryProfile` `Job` `JobEvent` `EmailCampaign` `CampaignRecipient` `EmailEvent` (open/click). Do not build those tables until Phase 2.

Serializers are role-aware. Never persist secrets in git.

---

## 12. Tech scope (Phase 1)

| Layer | Choice |
|---|---|
| Frontend | Next.js App Router, TypeScript, Tailwind, shadcn/ui, next-intl (en/ar + RTL) |
| Backend | Node.js, Express, TypeScript (separate API on Render) |
| DB | PostgreSQL (Supabase or Neon) + Prisma |
| Auth | JWT httpOnly cookies, bcrypt, optional Google |
| Validation | Zod client + server |
| Files | Supabase Storage or S3-compatible, signed URLs |
| Email | Resend or SMTP (env) |
| PDF | Backend PDF (bilingual invoice) |
| Security | helmet, cors allowlist, express-rate-limit |
| Deploy | Frontend **Vercel**, API **Render**, HTTPS on both |
| Secrets | `.env` / host dashboards; `.env.example` empty |

---

## 13. UX principles

- Mobile first (field use, ~390px). Primary actions thumb-reachable.
- Industrial KSA look: ink, sand, steel — not generic purple AI SaaS. Human-crafted, not “vibe coded”.
- Proper Arabic: RTL, Tajawal or IBM Plex Sans Arabic + a Latin pair. No broken mixed alignment.
- Trust before chat. Price privacy is a product feature.
- Status replaces WhatsApp for the company-facing trail.
- Invite works when the directory is empty.

---

## 14. Success criteria (Phase 1)

- Live: Vercel frontend + Render API + Postgres. HTTPS confirmed.
- GitHub repo. Demo accounts: Admin / Salesman / Company with a completed order + review in both languages.
- Auth, hashed passwords, RBAC, validation, rate-limited login, env secrets, IDOR-safe quotes.
- You can invite one real company and finish one paid order on Tijarah.
- Invoice PDF is sendable. Profile URL is business-card worthy.
- Language toggle works on all Phase 1 screens.

---

## 15. Monetization

- **You (now):** markup (15k vs 18k) recorded privately; money still via bank transfer.
- **Platform (later):** featured salesman listing, verified fast-track fee, then take-rate when escrow exists.
- Phase 1 does not charge cards.

---

## 16. Feature map (complete idea → phase)

| Feature | Phase |
|---|---|
| Auth, RBAC, bilingual, profiles, badges, trust score, portfolio | 1 |
| Invite company, discovery, match %, lead lists | 1 |
| RFQ, quote versions, private margin, orders, photos | 1 |
| Invoice PDF + VAT, payment record, reviews, dashboards | 1 |
| In-app messages, transactional email, simple meetings, CSV | 1 |
| Admin verification | 1 |
| **Cold emailing campaigns, open/click, auto 3/7/14 follow-up** | **2** |
| Factory role, job timeline, factory price isolation | 2 |
| Multi-salesman RFQ broadcast, 2FA, phone OTP | 2 |
| WhatsApp/SMS APIs, Stripe/escrow, native apps, ML, logistics | 3 |

---

## 17. Risks

- Empty marketplace → invite flow is the mitigation.
- Companies skip the platform on repeat orders → reviews + history are lock-in, not a legal wall.
- “Verified” must not claim government confirmation.
- Cold email in Phase 2 can burn domain reputation if unthrottled.
- Scope creep: if it is not in §6, it is not Phase 1.

---

## 18. Pipeline

| Step | Status |
|---|---|
| 1 Idea | Done |
| 2 Research | Done |
| **3 PRD** | **Frozen (this file)** |
| **4 Master Prompt** | Phase 1 prompt next |
| 5 UI/UX | After you accept the master prompt |
| 6–10 | Build, test, secure, deploy, live |

Phase 1 only until you explicitly start Phase 2.
