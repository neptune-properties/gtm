create table if not exists public.targets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  owner_name text,
  company text,
  property text,
  city text,
  email text,
  source text,
  status text not null default 'new'
    check (status in ('new','emailed','replied','called','converted'))
);
create index if not exists idx_targets_status on public.targets(status);
create index if not exists idx_targets_city on public.targets(city);
