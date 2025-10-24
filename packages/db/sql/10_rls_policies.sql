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
