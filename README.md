# Suvichaar · Content Pipeline Admin

> **Yeh sirf UI / frontend hai.** Backend (FastAPI) alag repository mein hai
> aur Azure App Service pe deploy hai.

Internal admin dashboard for managing AI‑generated Suvichaar stories — browse
the library, preview slides, publish to live targets, and create new stories.

Built with **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind +
shadcn/ui + TanStack Query + react-hook-form + Zod**.

---

## What this app does

- **Login** — JWT-based, single admin user (configured server-side).
- **Library** — list, filter, search, and preview all stories from both
  the News and Curious engines in one view.
- **Publish** — push a story to "Suvichaar Live" or a custom webhook
  endpoint. Records the action in the backend `publishes` table.
- **Create** — kick off a new story (URL, text, attachments → AI slide
  generation → AMP HTML rendering) and poll until done.
- **Dark / Light mode** — full theme support, dark by default.

---

## Architecture

```
┌───────────────────────────────────────────┐
│  SuvichaarAdmin  (this repo · Next.js 16) │
└────────────────┬──────────────────────────┘
                 │ HTTPS + JWT
        ┌────────┴────────┐
        ▼                 ▼
News backend (FastAPI)   Curious backend (FastAPI)
engine-service           curious-engine-service
  .azurewebsites.net       .azurewebsites.net
        └────────┬────────┘
                 ▼
       Azure Postgres (`stories`, `publishes`)
```

The two backends share a single Azure Postgres DB. A single JWT issued by
either service is accepted by both (same `JWT_SECRET`).

---

## Quick start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env.local
# edit .env.local — point to live backends or localhost during dev

# 3. Run
npm run dev          # http://localhost:3000
```

### Environment variables

| Name | Required | Example |
| --- | --- | --- |
| `NEXT_PUBLIC_NEWS_API_BASE_URL` | yes | `https://engine-service.azurewebsites.net` |
| `NEXT_PUBLIC_CURIOUS_API_BASE_URL` | yes | `https://curious-engine-service.azurewebsites.net` |
| `NEXT_PUBLIC_DEFAULT_LOGIN_EMAIL` | no | `admin@suvichaar.org` (pre-fills login form) |

---

## Project layout

```
SuvichaarAdmin/
├── app/
│   ├── layout.tsx          # root layout + theme + query provider + toaster
│   ├── page.tsx            # auth gate → AppShell or LoginForm
│   └── globals.css         # Tailwind + design tokens (dark + light)
├── components/
│   ├── ui/                 # shadcn primitives (button, dialog, sheet, …)
│   ├── auth/               # login-form
│   ├── dashboard/          # navbar, stats, filters, table, preview, publish
│   ├── create/             # create-form + sub-components
│   ├── app-shell.tsx       # Library / Create section switcher
│   ├── theme-provider.tsx
│   └── theme-toggle.tsx
├── hooks/                  # use-auth, use-stories, use-create-story
├── lib/
│   ├── api/                # client (JWT-aware), stories, create
│   ├── auth/store.ts       # localStorage token + observable
│   ├── create-constants.ts # templates / categories / voice engines per mode
│   ├── labels.ts           # human labels + story URL helper
│   ├── types.ts
│   ├── validation.ts       # Zod schemas
│   └── utils.ts            # cn() helper
├── components.json         # shadcn CLI config
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start dev server (Turbopack) on `:3000` |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` strict typecheck |

---

## Deploy

Recommended: **Vercel** (Next.js 16 native).

1. Create a Vercel project → import this repo.
2. Set the three env vars (see table above).
3. Done — Vercel handles build + edge runtime.

Alternative: Netlify (use `@netlify/plugin-nextjs`) or any Node host.
