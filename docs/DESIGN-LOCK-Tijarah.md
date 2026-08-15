# Tijarah — visual lock (65% light / 35% dark + dark theme)

Stitch screens ka **mood rakhna** (gold serif, cream offer paper, copper buttons, lock on factory cost).  
**Invert the ratio:** default theme is LIGHT. Dark is a toggle, not the only look.

---

## Keep (yeh already acha hai)

- Wordmark **Tijarah** gold serif + **تجارة**
- EN | ع toggle
- Cream “paper” for quote / invoice / invite / RFQ
- Factory cost **locked drawer** (salesman only)
- Salesman / Company tiles on signup
- Copper/bronze primary buttons
- Mobile: trust 78, 62,400 SAR, private margin 9,100 SAR, Needs Action RFQ
- Order stepper: Confirmed → Factory → Production → Shipped → Delivered → Received
- Bilingual tax invoice

## Change

- Screens ~90% black hain → **65% cream/ivory, 35% charcoal/gold**
- Nav **Markets / Assets / Logistics / Vault / New Trade** hatao — Tijarah yeh nahi
- Copy: “Transmit decree”, “Department of Industrial Procurement”, “Aurum Industrial”, USD/crypto — hatao
- Mobile app: bottom tabs, cream canvas, dark sirf header + tab bar

---

## Theme tokens

### Light (default — 65/35)

| Use | Hex |
|---|---|
| Page canvas | `#F6F0E6` warm ivory |
| Cards / paper | `#FFFaf3` |
| Sidebar / top bar / tab bar (the 35%) | `#1C1916` charcoal |
| Text | `#1C1916` |
| Muted | `#6B645C` |
| Gold | `#C4A35A` |
| Copper CTA | `#C45C26` |
| Lock/private strip | charcoal inset on cream paper |

### Dark (toggle)

Invert: canvas `#12110F`, paper `#1C1916`, text `#F6F0E6`, same gold/copper. Same layout, not a new product.

Header always has **sun/moon** next to EN | ع.

---

## Correct app nav (dono themes)

**Salesman:** Dashboard · Companies · RFQs · Quotes · Orders · Invoices · Messages  
**Company:** Dashboard · Find salesmen · RFQs · Orders · Invoices · Messages  
**Public landing:** How it works · For salesmen · For companies · Log in · Get started  

Not: Markets, Assets, Logistics, Institutional, Vault, Commodities, Trade Now.

---

# Stitch — pehle yeh GLOBAL prompt (har screen pe, ek ek karke)

Existing screen select karo, yeh paste:

```
Restyle THIS screen only. Do not change the information or the layout structure.

Default theme = LIGHT, ratio 65% light / 35% dark.
- Main background: warm ivory #F6F0E6
- Documents, cards, forms: cream paper #FFFAF3
- Keep ONLY header, sidebar (or mobile tab bar), and primary copper buttons as dark charcoal #1C1916 + gold #C4A35A
- Body text dark ink on cream, not white on black
- Keep gold serif “Tijarah”, copper CTAs, cream quote/invoice paper, factory-cost lock if present
- Add a small sun/moon theme toggle next to EN | ع
- Attractive, premium Gulf metal house — not a flat white Bootstrap site, not an all-black crypto terminal
- Mobile: large tap targets, cream canvas, dark bottom tab bar
```

Phir **alagsa** (second message):

```
Also generate the DARK theme version of this same screen: charcoal canvas, cream text, same gold and copper, identical layout. Keep the theme toggle visible.
```

---

# Landing — light-first (naya generate agar restyle kamzor ho)

```
Desktop landing for Tijarah, LIGHT-first 65/35.

Canvas warm ivory. Top bar is the dark 35%: charcoal header, gold serif Tijarah, links: How it works, For salesmen, For companies, EN|ع, sun/moon, copper LOG IN.

Hero on ivory: huge ink serif TIJARAH, gold تجارة, “Metal, without another site visit.”
Two CTAs: copper “I sell metal”, charcoal outline “My company buys”.
Right: tilted cream quotation paper with gold ribbon lock “Factory cost — only you”. Industrial photo is a SMALL strip or one image, not a full black page.

Process: three cream cards on ivory, gold numbers 01 Profile 02 Quote 03 Deliver. One dark charcoal band only behind the middle step.

Footer charcoal (the remaining dark 35%). Cities Riyadh Jeddah Dammam.

Premium, attractive, works on mobile stacked. No Markets/Assets/Logistics. No all-black page.
```

---

# Mobile home — light-first

```
Mobile 390 Tijarah salesman home, LIGHT 65/35.

Ivory canvas. Dark charcoal top bar: avatar, gold TIJARAH, bell, sun/moon.
Cream cards: Trust 78, Paid 62,400 SAR, Private margin 9,100 SAR with lock “only you”.
Needs Action on cream tickets, copper REVIEW.
Dark charcoal BOTTOM tab bar (Home RFQs Orders More) with gold active glow.

Not a black phone UI. Not USD. Not Deposit/Liquidate.
```

---

# Quote — already close; sirf chrome light karo

```
Keep the cream Tijarah Offer certificate exactly. Change the surrounding app chrome to ivory canvas. Sidebar and top bar stay charcoal (35% dark). Add sun/moon. Salesman version keeps factory cost lock. Company version has no lock. Nav: Dashboard, Quotes, Orders — not Trade Desk / Vault.
```
