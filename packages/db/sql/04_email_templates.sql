create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  body_md text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
