# Neptune — GTM (MVP)

This repo hosts the **Neptune** MVP: a monorepo with a single Next.js app (UI + server routes),
a shared TypeScript package, and SQL migrations for Supabase. Deployed on Vercel.

## Structure
```
.
├─ apps/
│  └─ web/                 # Next.js (App Router) — UI + server routes
├─ packages/
│  ├─ shared/              # Shared types, template merge, email adapter
│  └─ db/                  # SQL migrations for Supabase
├─ pnpm-workspace.yaml
├─ package.json
├─ turbo.json
└─ .env.example
```

## Quickstart
1. **Install** Node 18+ and pnpm (`npm i -g pnpm`)
2. **Install deps**: `pnpm install`
3. **Configure env**:
   - Copy `.env.example` to `apps/web/.env.local` and fill values
4. **Run dev**: `pnpm dev` → http://localhost:3000

## Supabase
- Project URL: _paste the client's URL here_
- Run the SQL in `packages/db/sql/00_all.sql` in the Supabase SQL editor (or each individual file).
- Uses Supabase Auth (email/password) + a simple `user_roles` table.
- RLS is permissive for dev; we’ll tighten after auth wiring.

## CSV columns
`name, company, property, city, email, source`

## Contributing
- 3 pairs. Use feature branches (any naming is fine).
- PMs review PRs.
