# Whippe

AIT's internal intern management and operations platform.

## Applications

| App | Path | Port | Purpose |
|---|---|---|---|
| `api` | `apps/api` | 4000 | Shared Express + MongoDB backend |
| `web` | `apps/web` | 3000 | HR/Supervisor desktop-first web app |
| `intern-pwa` | `apps/intern-pwa` | 3001 | Intern mobile-first PWA |

## Stack

- **Monorepo**: pnpm workspaces
- **Backend**: Node.js, TypeScript, Express, Mongoose, MongoDB Atlas, Zod
- **Web**: Next.js, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query
- **Intern PWA**: Next.js, TypeScript, Tailwind CSS, TanStack Query, PWA

## Getting Started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9

### Install

```bash
pnpm install
```

### Environment

Copy `.env.example` to `.env` inside each `apps/*` directory and fill in values.

### Development

```bash
# Start backend
pnpm dev:api

# Start web app
pnpm dev:web

# Start intern PWA
pnpm dev:pwa
```

### Health check

```
GET http://localhost:4000/health
```

## Project Structure

```
whippe/
├── apps/
│   ├── api/          Express backend
│   ├── web/          HR + Supervisor web app
│   └── intern-pwa/   Intern mobile PWA
├── packages/
│   └── shared/       Shared TypeScript types, schemas, constants
└── docs/             Architecture documentation
```

See `docs/` for full architecture documentation.
