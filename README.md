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
1. **Intall** npm (`brew install npm` on mac, `sudo apt update; sudo install npm` on WSL)
2. **Install** pnpm (`npm i -g pnpm`)
3. **Install deps**: `pnpm install`
4. **Configure env**:
   - Copy `.env.example` to `apps/web/.env.local` and fill values (see msg channel)
5. **Run dev**: `pnpm dev` → http://localhost:3000

## Supabase
- Project URL: https://dniwjfwwilpctcxyxpdm.supabase.co
- Uses Supabase Auth (email/password) + a simple `user_roles` table.

## CSV columns
`name, company, property, city, email, source`

## Contributing
- 3 pairs. Use feature branches (any naming is fine).
- PMs review PRs.
