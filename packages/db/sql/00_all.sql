create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','member'))
);


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


create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);


create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  body_md text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);


create table if not exists public.email_sends (
  id uuid primary key default gen_random_uuid(),
  target_id uuid not null references public.targets(id) on delete cascade,
  campaign_id uuid references public.campaigns(id),
  template_id uuid references public.email_templates(id),
  sent_at timestamptz,
  open_count int default 0,
  last_open_at timestamptz,
  reply_detected boolean default false,
  reply_at timestamptz,
  provider_message_id text
);
create index if not exists idx_email_sends_target on public.email_sends(target_id);


alter table public.targets enable row level security;
alter table public.campaigns enable row level security;
alter table public.email_templates enable row level security;
alter table public.email_sends enable row level security;

-- Dev-friendly: allow all authenticated users. Tighten later with role checks.
create policy "auth read targets" on public.targets
  for select using (auth.role() = 'authenticated');
create policy "auth write targets" on public.targets
  for insert with check (auth.role() = 'authenticated');
create policy "auth update targets" on public.targets
  for update using (auth.role() = 'authenticated');

create policy "auth read campaigns" on public.campaigns
  for select using (auth.role() = 'authenticated');
create policy "auth write campaigns" on public.campaigns
  for insert with check (auth.role() = 'authenticated');
create policy "auth update campaigns" on public.campaigns
  for update using (auth.role() = 'authenticated');

create policy "auth read email_templates" on public.email_templates
  for select using (auth.role() = 'authenticated');
create policy "auth write email_templates" on public.email_templates
  for insert with check (auth.role() = 'authenticated');
create policy "auth update email_templates" on public.email_templates
  for update using (auth.role() = 'authenticated');

create policy "auth read email_sends" on public.email_sends
  for select using (auth.role() = 'authenticated');
create policy "auth write email_sends" on public.email_sends
  for insert with check (auth.role() = 'authenticated');
create policy "auth update email_sends" on public.email_sends
  for update using (auth.role() = 'authenticated');


