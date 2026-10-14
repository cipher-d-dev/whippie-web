# Whippie Web

The HR and Supervisor web application for Whippe — DAAR Communications' intern management platform.

Desktop-first. Consumes the shared **whippie-api** backend.

---

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- react-hook-form + zod

---

## Prerequisites

- Node.js 20+
- npm
- `whippie-api` running locally (default port 5000)

---

## Getting started

**1. Install dependencies**

```bash
npm install
```

**2. Set up environment**

```bash
copy .env.example .env.local
```

Open `.env.local` and confirm the API URL matches the port your API is running on:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**3. Start the development server**

```bash
npm run dev
```

The web app starts on `http://localhost:3000`.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Start production build |
| `npm run typecheck` | Type-check without building |
| `npm run lint` | Run ESLint |

---

## Authentication

Uses JWT tokens — matching the API's auth strategy:

- Access token (15min) stored in memory (JS module variable) — never localStorage
- Refresh token lives in an HTTP-only cookie — browser sends it automatically
- On page load, a silent `POST /auth/refresh` restores the session from the cookie
- On 401, the client silently retries after refreshing — redirects to `/login` if refresh fails

---

## Project structure

```
app/
├── (auth)/
│   └── login/          Login page
├── (dashboard)/
│   ├── layout.tsx      Auth guard — redirects to /login if unauthenticated
│   ├── dashboard/      Dashboard home
│   ├── interns/
│   ├── onboarding/
│   ├── attendance/
│   ├── tasks/
│   ├── reports/
│   ├── supervisors/
│   ├── documents/
│   ├── evaluations/
│   └── exit/
├── layout.tsx
└── page.tsx            Redirects to /dashboard

components/
├── layout/
│   ├── AppShell.tsx    Sidebar + Header wrapper
│   ├── Sidebar.tsx     Role-aware nav (HR vs Supervisor), logout
│   └── Header.tsx      Page title, role badge, notifications bell, avatar
├── ui/                 shadcn/ui components
└── shared/
    └── Providers.tsx   TanStack Query + AuthProvider + Toaster

lib/
├── api/
│   └── client.ts       API client with Bearer token, auto-refresh on 401
├── auth/
│   └── context.tsx     AuthProvider + useAuth hook
└── utils/
    └── cn.ts           Tailwind class merger

features/               Feature-specific components, hooks, API calls (populated per phase)
hooks/                  Shared hooks
types/                  Cross-cutting TypeScript types
```

---

## API

All data comes from `whippie-api`. See [`../whippie-api/docs/API-CONTRACT.md`](../whippie-api/docs/API-CONTRACT.md) for the full contract.

---

## Implementation phases

| Phase | Description | Status |
|---|---|---|
| 0 | Scaffold — Next.js, Tailwind, TanStack Query, app shell | ✅ Done |
| 1 | Authentication — login, auth context, route protection, shadcn/ui | ✅ Done |
| 2 | Intern records — list, create, detail, edit | ✅ Done |
| 3 | Departments, supervisors & assignments | ✅ Done |
| 4 | Onboarding & documents | ✅ Done |
| 5 | Supervisor workspace | ✅ Done |
| 6 | Tasks & submissions | ✅ Done |
| 7 | Reports & evaluations | ✅ Done |
| 8 | Attendance monitoring | ✅ Done |
| 9 | Internship exit & completion | 🔜 Next |
| 10 | Document generation | — |
| 11 | Notifications | — |
| 12 | Security & hardening | — |
| 13 | HR dashboard refinement | — |
| 14 | Optional AI | — |
