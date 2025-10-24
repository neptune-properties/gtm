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
