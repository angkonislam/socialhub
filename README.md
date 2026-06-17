# Social Hub

A modern SaaS dashboard to connect multiple social media accounts and publish
content everywhere from one place.

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**,
**Supabase**, and **Auth.js (NextAuth v5)**. Vercel-deployment ready.

> The app ships with **mock platform APIs** for Facebook, Instagram, YouTube,
> and TikTok, plus an in-memory data store, so it runs fully end-to-end with
> **zero external credentials**. Swap in real keys when ready.

---

## Features

| Area | What's included |
|------|-----------------|
| **Auth** | Social login (Google, Facebook, LinkedIn, TikTok, GitHub), profile page, logout, route protection |
| **Connections** | Connect Facebook Pages, Instagram Business, YouTube, TikTok, LinkedIn; list & disconnect |
| **Composer** | Text editor, image/video upload, hashtag detection, emoji, live character counter |
| **Publishing** | Multi-platform select, one-click publish, schedule, save draft, per-target status tracking |
| **Dashboard** | Connected accounts, published/scheduled/draft counts, recent posts, activity feed |
| **UI** | Modern SaaS design, responsive, sidebar nav, dark mode, landing page |
| **Security** | Secrets in env vars, OAuth structure, auth-guarded API routes & middleware |

---

## Project structure

```
src/
├─ app/
│  ├─ page.tsx                 # Landing page
│  ├─ login/                   # Social sign-in
│  ├─ (app)/                   # Authenticated shell (sidebar layout)
│  │  ├─ dashboard/
│  │  ├─ accounts/
│  │  ├─ compose/
│  │  ├─ posts/
│  │  └─ profile/
│  └─ api/
│     ├─ auth/[...nextauth]/   # Auth.js handlers
│     ├─ accounts/             # Connect / list / disconnect
│     ├─ posts/                # Create draft/scheduled, list
│     └─ publish/              # Fan-out publish to platforms
├─ components/                 # UI + feature components
├─ lib/
│  ├─ auth.ts                  # Auth.js config
│  ├─ data.ts                  # Data access layer (swap to Supabase)
│  ├─ types.ts                 # Domain types
│  ├─ utils.ts                 # Helpers, limits, hashtag parsing
│  ├─ supabase/                # Browser + server clients
│  └─ mock/                    # Mock platform APIs + in-memory store
├─ middleware.ts               # Route protection
supabase/
└─ schema.sql                  # Tables, views, RLS policies
```

---

## Getting started

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

The app runs immediately with `NEXT_PUBLIC_USE_MOCK_APIS="true"`. To enable
login you need at least one OAuth provider plus an `AUTH_SECRET`:

```bash
npx auth secret   # writes AUTH_SECRET
```

Add a provider's client id/secret (e.g. GitHub is the quickest to set up) and
its callback URL: `http://localhost:3000/api/auth/callback/<provider>`.

### 3. Run

```bash
npm run dev
```

Open <http://localhost:3000>.

---

## Connecting Supabase (optional, for persistence)

1. Create a project at [supabase.com](https://supabase.com).
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor.
3. Fill `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.
4. Replace the in-memory calls in [`src/lib/data.ts`](src/lib/data.ts) with
   Supabase queries via `createServiceClient()`. The function signatures are
   designed for a 1:1 swap.

---

## Going live with real platform APIs

Set `NEXT_PUBLIC_USE_MOCK_APIS="false"` and replace the two mock functions in
[`src/lib/mock/platforms.ts`](src/lib/mock/platforms.ts):

- `mockConnect` → real OAuth connection flow per platform
- `mockPublish` → real publish call (Facebook Graph, Instagram Content
  Publishing, YouTube Data API, TikTok Content Posting API)

The API route call sites do not change.

---

## Deploy to Vercel

1. Push to GitHub and import the repo in Vercel.
2. Add every variable from `.env.example` in **Project → Settings → Environment
   Variables** (set `AUTH_TRUST_HOST=true`).
3. Update each OAuth app's callback URL to your production domain.
4. Deploy. Next.js 15 builds with zero extra config.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |

---

## Security notes

- All secrets live in environment variables; nothing is committed.
- `SUPABASE_SERVICE_ROLE_KEY` is used server-side only.
- API routes verify the Auth.js session before any read/write.
- Supabase Row Level Security scopes every row to its owner.
- `middleware.ts` blocks unauthenticated access to the dashboard.
