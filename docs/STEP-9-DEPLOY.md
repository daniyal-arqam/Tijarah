# Step 9 — Deploy Tijarah (Vercel + Render + Neon)

Local SQLite hata kar production **PostgreSQL** use hota hai. Schema ab `postgresql` hai.

Order: **GitHub → Neon → Render (API) → Vercel (web)**. Render URL ke baghair Vercel rewrite nahi chalega.

---

## 0. GitHub repo

Terminal (project folder):

```bash
git init
git add .
git commit -m "Tijarah Phase 1 — full-stack metal marketplace"
```

GitHub.com → New repository `tijarah` (public) → **bina** README ke.

```bash
git remote add origin https://github.com/YOUR_USER/tijarah.git
git branch -M main
git push -u origin main
```

`.env` push **nahi** hota (gitignore).

---

## 1. Neon Postgres (free)

1. [neon.tech](https://neon.tech) → Sign up  
2. New project: **tijarah**  
3. Connection string copy (URI). Example:

`postgresql://USER:PASS@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require`

Yeh `DATABASE_URL` hai. **Pooled** string bhi chal sakti hai Prisma ke sath; agar migrate fail ho to **direct** (non-pooler) use karo.

---

## 2. Render — API

1. [render.com](https://render.com) → New → **Web Service** → GitHub `tijarah`  
2. Settings:

| Field | Value |
|---|---|
| Runtime | Node |
| Build | `npm install && npx prisma generate --schema=apps/api/prisma/schema.prisma` |
| Start | `npm run start -w @tijarah/api` |
| Instance | Free |

3. **Environment** (Environment tab):

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `COOKIE_SECURE` | `true` |
| `DATABASE_URL` | Neon URI |
| `JWT_ACCESS_SECRET` | long random (32+ chars) |
| `JWT_REFRESH_SECRET` | **different** long random |
| `FRONTEND_ORIGIN` | `https://YOUR-APP.vercel.app` (pehle placeholder `http://localhost:3000`, Vercel ke baad update) |

4. Deploy. Logs mein: `Tijarah API on http://localhost:PORT`  
5. Open `https://tijarah-api-XXXX.onrender.com/health` → `{"ok":true}`  
   Free tier pe **pehli request 30–60s** so sakti hai.

6. Shell (Render → Shell) ya local with Neon URL:

```bash
npx prisma db push --schema=apps/api/prisma/schema.prisma
npx tsx apps/api/prisma/seed.ts
```

(Working directory repo root; `DATABASE_URL` Neon hona chahiye.)

Render service URL save karo: `https://tijarah-api-xxxx.onrender.com`

---

## 3. Vercel — frontend

1. [vercel.com](https://vercel.com) → Add New → Project → `tijarah`  
2. **Root Directory:** leave **.** (repo root, not `apps/web`)  
3. Framework: Next.js (auto)  
4. Build: `npm run build -w @tijarah/web`  
5. Env vars:

| Key | Value |
|---|---|
| `API_URL` | `https://tijarah-api-xxxx.onrender.com` (no trailing slash) |

`API_URL` **server** rewrite ke liye hai — browser Render ko directly nahi, Vercel `/auth` aur `/api` ko proxy karta hai. Cookies same-site rehti hain.

6. Deploy. URL: `https://tijarah-xxx.vercel.app`  
7. Wapas **Render** → `FRONTEND_ORIGIN` = yeh Vercel URL (https, no slash) → Redeploy API.

---

## 4. HTTPS check (assignment)

Browser:

- [ ] Vercel URL `https://` + padlock  
- [ ] `https://YOUR-API.onrender.com/health` padlock  
- [ ] Login works on Vercel (not mixed content)

---

## Demo logins (after seed)

Password: `Tijarah1!`  
`salesman@tijarah.sa` · `company@tijarah.sa` · `admin@tijarah.sa`

---

## Agar build fail ho

- **Prisma sqlite error:** `schema.prisma` mein `provider = "postgresql"` hona chahiye.  
- **Vercel cannot find Next:** root directory `.` + `npm install` at repo root.  
- **CORS / login loop:** `FRONTEND_ORIGIN` exact Vercel origin, `API_URL` exact Render origin.  
- **Render crash:** `DATABASE_URL` missing or sqlite file URL.

Jab dono live URLs mil jayen, **Step 9 done** likho + URLs paste karo. Phir Step 10: GitHub polish + LinkedIn post.
