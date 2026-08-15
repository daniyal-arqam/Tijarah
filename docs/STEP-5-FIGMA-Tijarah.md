# Step 5 — Tijarah UI/UX for Figma

**Goal:** a Figma file that looks like a Gulf industrial trade desk, not a purple AI dashboard.  
**Phase 1 screens only.**  
**You design in Figma. Then we match code to those frames in Step 6.**

---

## How to actually do this (follow in order)

Figma AI and Google Stitch **cannot** swallow the whole master prompt in one go. They produce generic SaaS if you dump everything. Do **one screen per prompt**, always prepend the **Style lock** below.

### Path A — recommended (pipeline: Stitch → Figma)

1. Open [Google Stitch](https://stitch.withgoogle.com) (Google account).
2. New project. Mode: **Web app**. Theme: custom (paste Style lock).
3. Generate **one screen**. Download / **Export to Figma** (Stitch has a Figma export).
4. Repeat for the next screen. Same style lock every time.
5. In Figma: clean names, shared components, fix spacing, make Arabic RTL frames.

### Path B — Figma only (Figma Make / AI)

1. [figma.com](https://www.figma.com) → New design file → name it `Tijarah — Phase 1`.
2. Page 0: `00 Foundations` (colors, type, components).
3. Use **Figma Make** or the AI prompt box on a frame:
   - First message = Style lock + “create a component sheet only”.
   - Next messages = one screen from the list below.
4. Duplicate the English frame, set layout to RTL, switch copy to Arabic for the four RTL must-haves.

### After AI (mandatory — this is what the pipeline means by “human-crafted”)

Spend time here or the UI will look AI-generated:

- Delete drop shadows and gradients.
- Replace Inter / purple / rounded-full pills.
- Use **hairline 1px** borders (`#D4C9B8`), not shadows.
- SAR amounts in a tabular/mono style.
- Quote page should look like a **commercial offer sheet**, not a Stripe checkout.
- Empty states: one sentence + one button (“Invite a company you already work with”) — no cute illustrations.
- Mobile 390px: primary button full-width, tables become stacked cards.

When that polish is done, tell me **Step 5 confirmed** and share the Figma link (view access). Then Step 6.

---

## File structure in Figma

```
Tijarah — Phase 1
  00 Foundations     tokens, type, components
  01 Public          landing EN/AR, login, signup, public profile
  02 Salesman        dashboard, invite, RFQ, quote, orders, invoices
  03 Company         dashboard, find salesmen, RFQ, order, review
  04 Admin           verification queue
  05 Mobile          390px of the same critical screens
```

Frame sizes: **Desktop 1440 × 1024** (or auto-height). **Mobile 390 × 844**.

---

## Style lock (paste at the TOP of every Stitch / Figma prompt)

```
Product: Tijarah (تجارة). KSA B2B metal middleman platform. Serious Gulf trade desk.

LOOK: industrial spec sheet, not SaaS. Warm paper background #F4EFE6. Chrome/header #1A2320 (dark ink-green). Cards white #FFFdf8 with 1px hairline border #D4C9B8. NO drop shadows. NO gradients. NO purple. NO Inter. NO pill-everything.

Color:
- Ink text #1A2320
- Muted #5C675E
- Accent copper #B8612E (primary buttons and trust badges ONLY)
- Steel teal #3D5C57 (links, match %, secondary)
- Success #4C7A52
- Danger #A33B2B
- Private/secret field tint: very light copper wash #F8EDE4 + lock icon (factory cost — salesman only)

Type:
- Headings: Barlow Condensed, uppercase, tracking 0.04em for section labels
- Body: IBM Plex Sans
- Arabic: IBM Plex Sans Arabic or Tajawal
- IDs, SAR, order numbers: IBM Plex Mono

Radius 8px. Buttons: copper fill, 8px radius, not fully rounded.
Language toggle EN | ع in the header of every screen.
Currency SAR. VAT 15%.

Signature motifs:
- Small L-shaped corner brackets on the quote paper and invoice (like a technical drawing)
- Order status as a HORIZONTAL STEPPER (gauge), not a rounded progress bar
- Verification badges look like ink stamps, not colorful chips
- Factory cost field labeled “Only you can see this” / “تظهر لك فقط”

Forbidden: generic dashboard stat tiles with gradients, fake AI insights, illustrations, GitHub login, WhatsApp campaign UI, factory-user screens, Stripe checkout.
```

---

## Foundations first (Prompt 0 — do this before any page)

```
Using the Tijarah style lock, design a Figma component sheet only (no app screens):

1. Color swatches with hex labels
2. Type scale (label / body / h3 / h2 / h1) in English and one Arabic sample line
3. Buttons: primary copper, secondary outline, ghost, disabled, danger
4. Inputs: default, focus, error, textarea, select, file dropzone
5. Badges: Email ✓ Phone ✓ ID ✓ Business ✓  and unverified
6. Status pills: draft, sent, viewed, countered, accepted, rejected, and order stages
7. Horizontal order stepper: Confirmed → Sent to factory → In production → Shipped → Delivered → Received
8. Data table row + mobile stacked card version of the same row
9. Trust score ring 0–100
10. Empty state block (icon mark + one line + one copper button)

1440 wide. Hairline borders. No shadows.
```

---

## Screen prompts (one at a time)

Always: **Style lock + this screen’s prompt.**

### 1. Landing — desktop EN

```
Desktop 1440 landing page for Tijarah.

Header: wordmark “Tijarah” + “تجارة” small beside it, EN|ع toggle, Log in, copper “Get started”.

Hero (split, not centered generic): LEFT a short headline “Trusted metal supply — without another site visit.” Sub: for salesmen who take factory jobs to companies in KSA. RIGHT a fake quote-paper mock (line items, total 18,000 SAR, a blurred/locked row labeled Factory cost). Two CTAs: “I sell metal” / “My company buys metal”.

Below: 3 steps How it works (Profile → Quote → Deliver). Trust row: badges + on-time %. Footer with Riyadh, SAR, VAT note.

Paper background. No illustrations of smiling people. No purple.
```

### 2. Landing — desktop AR (RTL)

```
Same landing as English but FULL RTL Arabic.
Headline: توريد المعدن بثقة — بدون زيارة أخرى
CTAs: أبيع المعدن / شركتي تشتري المعدن
Header toggle shows ع as active. dir=rtl. Do not leave English body copy. Keep copper/paper/steel system.
```

### 3. Signup

```
Centered auth card on paper background. Tijarah wordmark.
Fields: email, password, confirm password.
Role picker as TWO large selectable cards (not a tiny dropdown): Salesman / وسيط  and Company / شركة. One selected with copper hairline.
Google button as secondary outline. NO GitHub.
Link to login. Language toggle top-right (or top-left in RTL).
Mobile 390 version: stacked, large tap targets.
```

### 4. Login + forgot password

```
Login: email, password, submit copper, forgot link, Google outline.
Forgot: email only.
Error state: “Too many attempts, try in 15 minutes” (rate limit) in muted red, not a huge banner.
```

### 5. Salesman dashboard

```
App shell: dark ink-green left sidebar (desktop) — Dashboard, Companies, RFQs, Quotes, Orders, Invoices, Messages, Settings. Header: language toggle, bell, avatar.

Main: NOT six rainbow stat tiles. Instead a dense top strip: Trust 78, Orders this month 4, Paid 62,400 SAR, Open quotes 2, Pending deliveries 1, On-time 92%, Private margin 9,100 SAR (copper-tinted, lock icon, caption “Only you”).

Below: two columns — left “Needs action” list (RFQ from Al-Najd Trading, counter on quote Q-1042), right small orders/revenue sparkline in steel teal, no 3D chart.

Empty state if no data: “Invite a company you already work with” + copper button Invite.

Also design mobile: bottom tab bar Dashboard / RFQs / Orders / More.
```

### 6. Invite company (critical for empty marketplace)

```
Simple sheet/modal or page: Company name, email, city select (Riyadh, Jeddah, Dammam…), industry select.
Helper text: they get an English+Arabic email. Role will be Company.
Primary: Send invite. Secondary: Cancel.
Success: “Invite sent to fatima@… Reminder in 3 days if they don’t join.”
```

### 7. Quote builder (most important screen)

```
Looks like a commercial offer on paper, not a form wizard.

Top: Quote Q-1042 · Version 1 · For Al-Najd Trading · City Riyadh.
RFQ summary strip: Sheet metal tanks, qty 12, needed 30 Sep 2026.

Numbered spec-sheet fields:
01 Line items table: product, qty, unit price SAR, line total. Add line.
02 Discount
03 Payment terms chips: Advance 50/50, Net 15, Net 30, Net 45, COD
04 Delivery date
05 Notes

PRIVATE BLOCK (visually distinct copper wash, lock): Factory cost estimate 15,000 SAR. Live margin 3,000 SAR. Caption EN+AR: Only you can see this / تظهر لك فقط. This block must be obvious so developers never put it on the company view.

Totals: Subtotal, VAT 15%, Total 18,000 SAR in IBM Plex Mono.

Actions: Save draft, Send quote.

Desktop 1440 AND mobile 390 (table becomes stacked line-item cards).
```

### 8. Company view of the SAME quote

```
Same quote Q-1042 but the factory cost / margin block is GONE. No lock, no 15,000, no 3,000.
Show 18,000 SAR + VAT. Actions: Accept, Reject, Counter (propose new total and/or date).
This pair of frames is the product’s security UX — keep them side by side in Figma named
“Quote — salesman” and “Quote — company”.
```

### 9. Public salesman profile (business card URL)

```
Shareable profile. Photo, name, cities, specialty tags, stamp badges, trust ring 78, stats (12 delivered, 92% on-time, 4.8 rating), portfolio 6 photos grid, reviews list.
Primary: Request quote. Secondary: wa.me if phone.
NO revenue, NO margin, NO factory cost.
Desktop + mobile.
```

### 10. Company — find salesmen

```
Filter bar: specialty, city, min trust, verified only.
Results as list (not Instagram grid): avatar, name, specialties, city, trust, match 82%, on-time %.
Right or top: “Top matches for you today” 3 people.
Save icon on each row.
```

### 11. Order detail + stepper

```
Order ORD-889. Horizontal stepper:
Confirmed → Sent to factory → In production → Shipped → Delivered → Received
Current = In production (copper), past = filled steel, future = outline.

Timeline below with dates, notes, delivery photo thumbnails.
Salesman: dropdown to advance status + upload photos + note.
Company: no status dropdown; if Delivered, big “Confirm receipt” copper button.
```

### 12. Invoice (bilingual paper)

```
A4-like white sheet on paper background. Looks like a KSA tax invoice.
Header: Tijarah + salesman name, CR/VAT placeholders.
Bilingual labels (AR right, EN left) or stacked AR then EN per field.
Line items, Subtotal, VAT 15%, Total SAR.
Payment terms Net 30. Status: Unpaid / Partial / Paid.
Salesman extra: “Record payment” (amount, date, Bank transfer/Cash/Cheque, reference).
Company: Download PDF only — no record payment.
```

### 13. Company dashboard

```
Spend this month, orders in progress, open RFQs, latest invoices. Quiet, dense, same shell with company nav: Dashboard, Find salesmen, RFQs, Orders, Invoices, Messages.
```

### 14. RFQ form (company)

```
Spec sheet numbered: title, specialty, specs/notes, qty, unit, destination city, needed-by date, file drop PDF/JPG/PNG 10MB. Send to this salesman (shows who).
```

### 15. Review form

```
Only available after Received. Three 1–5 ratings: quality, delivery speed, professionalism. Text area. Would order again toggle. Submit.
Locked state: “Available after you confirm receipt.”
```

### 16. Admin verification queue

```
Table: user, type (Iqama / CR), submitted date, thumbnail, Approve (steel) Reject (oxide). Document preview panel on the right (desktop).
```

### 17. Messages thread

```
Simple two-pane: list of RFQ/order threads | chat. Plain text, timestamp, file chip. No emoji picker, no GIF. Composer + send.
```

---

## Priority if you have limited time

Do **at least** these before Step 6 (code can copy them):

1. Foundations  
2. Landing EN + AR  
3. Signup  
4. Salesman dashboard  
5. Quote salesman + Quote company (pair)  
6. Order detail stepper  
7. Invoice  
8. Public profile  
9. Invite  
10. Mobile of quote + order + dashboard  

The rest can be variations of the same shell.

---

## Done checklist (Step 5 complete when)

- [ ] Figma file has Foundations + the 10 priority screens  
- [ ] Quote salesman vs company: factory cost only on salesman  
- [ ] Arabic landing (or dashboard) is real RTL, not mirrored English  
- [ ] Mobile 390 for dashboard, quote, order  
- [ ] No purple, no shadows, no Inter, no fake AI widgets  
- [ ] You can share a **view link**

Paste the Figma link here and say **Step 5 confirmed** when the checklist is true.
