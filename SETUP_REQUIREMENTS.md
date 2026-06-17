# Social Hub — What You Need to Provide

The app **runs right now with zero setup** (mock APIs + in-memory data + demo
login bypass). The items below are only needed to make each part *real*.

Legend: 🟢 works in mock mode now · 🔑 needs your credentials · 🗄️ needs database

---

## 1. Core secrets (needed for real login)

| Variable | Where to get it | Required? |
|----------|-----------------|-----------|
| `AUTH_SECRET` | Run `npx auth secret` (or `openssl rand -base64 32`) | ✅ for login |
| `AUTH_URL` | `http://localhost:3000` locally; auto on Vercel | Optional |
| `AUTH_TRUST_HOST` | `"true"` (required on Vercel) | ✅ on deploy |

> Login is currently **bypassed** (demo mode). To turn real auth back on, see
> "Re-enable login" at the bottom.

---

## 2. Social login (OAuth) — 5 providers 🔑

Each provider needs a Client ID + Secret. Add the **callback URL**
`https://YOUR_DOMAIN/api/auth/callback/<provider>` in each provider's console.

| Provider | Env vars | Console URL | Notes |
|----------|----------|-------------|-------|
| Google | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | console.cloud.google.com/apis/credentials | Easiest |
| GitHub | `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | github.com/settings/developers | Fastest to set up |
| Facebook | `AUTH_FACEBOOK_ID`, `AUTH_FACEBOOK_SECRET` | developers.facebook.com/apps | Needs app review for some scopes |
| LinkedIn | `AUTH_LINKEDIN_ID`, `AUTH_LINKEDIN_SECRET` | linkedin.com/developers/apps | |
| TikTok | `AUTH_TIKTOK_ID`, `AUTH_TIKTOK_SECRET` | developers.tiktok.com/apps | Approval required |

> Add at least **one** (GitHub recommended) to test real login. Providers
> without credentials are simply not shown / error gracefully.

---

## 3. Supabase database 🗄️ (needed for persistence)

Without this, data lives in memory and resets on server restart.

| Step | What to do |
|------|-----------|
| 1 | Create a project at supabase.com |
| 2 | Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor |
| 3 | Set `NEXT_PUBLIC_SUPABASE_URL` |
| 4 | Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| 5 | Set `SUPABASE_SERVICE_ROLE_KEY` (server-only secret) |
| 6 | Swap the mock calls in [`src/lib/data.ts`](src/lib/data.ts) for Supabase queries (signatures are 1:1) |

---

## 4. Supabase Storage 🗄️ (needed for real media upload)

| Step | What to do |
|------|-----------|
| 1 | In Supabase → Storage, create a **public** bucket named `media` |
| 2 | Done — `/api/upload` auto-uses it once Supabase keys are set |

> In mock mode, uploads return a placeholder image URL instead.

---

## 5. Real publishing APIs 🔑 (needed to actually post)

Currently publishing is **mocked** (`src/lib/mock/platforms.ts`). To post for
real, set `NEXT_PUBLIC_USE_MOCK_APIS="false"` and implement each platform's API
inside `mockConnect` / `mockPublish` (call sites stay the same):

| Platform | API needed | Approval |
|----------|-----------|----------|
| Facebook Pages | Graph API + Pages permissions | App review |
| Instagram Business | Instagram Content Publishing API | App review + IG Business acct |
| YouTube | YouTube Data API v3 (OAuth) | Google Cloud project |
| TikTok | TikTok Content Posting API | TikTok dev approval |
| LinkedIn | LinkedIn Marketing / Share API | LinkedIn app review |

---

## 6. Optional integrations 🟢

| Feature | What you provide | Status |
|---------|------------------|--------|
| Webhooks | A URL (Zapier/Make/your own) — added in Settings UI | 🟢 works now (fires real POST) |
| Email notifications | An email provider (not wired to send yet) | flag only |
| Rate limiting at scale | Redis/Upstash (in-memory now) | 🟢 works single-instance |

---

## 7. Deploy to Vercel

| Step | What to do |
|------|-----------|
| 1 | Push repo to GitHub, import in Vercel |
| 2 | Add **all** vars from `.env.example` in Project → Settings → Env Vars |
| 3 | Set `AUTH_TRUST_HOST="true"` |
| 4 | Update every OAuth callback URL to your prod domain |
| 5 | Deploy (no extra config) |

---

## Re-enable login (currently bypassed for demo)

1. `src/middleware.ts` → restore `export { auth as middleware }` line, remove the no-op.
2. `src/app/(app)/layout.tsx` → add back the `auth()` + `redirect("/login")` guard.
3. `src/lib/demo-session.ts` already falls back to the real session when present —
   no change needed there.

---

## Summary: minimum to go from demo → real

```
1. npx auth secret                    → AUTH_SECRET
2. One OAuth provider (GitHub)        → AUTH_GITHUB_ID / SECRET
3. Supabase project + schema.sql      → 3 Supabase env vars
4. Supabase "media" bucket            → real uploads
5. (later) Platform publish APIs      → real posting
```
