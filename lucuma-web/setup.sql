-- Lucuma Docs: run once in Supabase -> SQL editor
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text, name text,
  role text not null default 'member' check (role in ('member','core')),
  active boolean not null default true,
  created_at timestamptz not null default now());
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('letter','invoice','certificate')),
  number text not null, title text, data jsonb not null,
  status text not null default 'valid',
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  unique (type, number));
create table if not exists public.settings (
  key text primary key, value jsonb not null, updated_at timestamptz default now());
alter table public.profiles  enable row level security;
alter table public.documents enable row level security;
alter table public.settings  enable row level security;

create or replace function public.is_active() returns boolean language sql security definer stable set search_path=public as
$$ select exists(select 1 from profiles where id=auth.uid() and active) $$;
create or replace function public.is_core() returns boolean language sql security definer stable set search_path=public as
$$ select exists(select 1 from profiles where id=auth.uid() and active and role='core') $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as
$$ begin insert into public.profiles(id,email) values (new.id,new.email) on conflict do nothing; return new; end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
insert into public.profiles(id,email) select id,email from auth.users on conflict do nothing;

drop policy if exists p_sel on public.profiles; drop policy if exists p_upd on public.profiles;
create policy p_sel on public.profiles for select using (id=auth.uid() or public.is_core());
create policy p_upd on public.profiles for update using (public.is_core()) with check (public.is_core());
drop policy if exists d_sel on public.documents; drop policy if exists d_ins on public.documents; drop policy if exists d_upd on public.documents; drop policy if exists d_del on public.documents;
create policy d_sel on public.documents for select using (public.is_active());
create policy d_ins on public.documents for insert with check (public.is_active());
create policy d_upd on public.documents for update using (public.is_active() and (created_by=auth.uid() or public.is_core()));
create policy d_del on public.documents for delete using (public.is_core());
drop policy if exists s_sel on public.settings; drop policy if exists s_ins on public.settings; drop policy if exists s_upd on public.settings;
create policy s_sel on public.settings for select using (public.is_active());
create policy s_ins on public.settings for insert with check (public.is_core());
create policy s_upd on public.settings for update using (public.is_core()) with check (public.is_core());

-- Public certificate check: exact certificate number only, returns no other data.
create or replace function public.verify_certificate(p_no text) returns json
language sql security definer stable set search_path=public as
$$
 select json_build_object(
   'holder',d.data->>'name',
   'role',d.data->>'role',
   'start',d.data->>'start',
   'end',d.data->>'end',
   'period',d.data->>'period',
   'ptype',d.data->>'ptype',
   'issued',d.data->>'date',
   'status',d.status,
   'number',d.number,
   'issuer_name',coalesce(nullif(d.data->>'issuerName',''),p.name,p.email,'Lucuma Innovations'),
   'issuer_email',coalesce(nullif(d.data->>'issuerEmail',''),p.email,'')
 )
 from public.documents d
 left join public.profiles p on p.id=d.created_by
 where d.type='certificate' and d.number=upper(trim(p_no))
 limit 1
$$;
grant execute on function public.verify_certificate(text) to anon, authenticated;

-- After creating YOUR user (Authentication -> Users), make yourself a core member:
-- update public.profiles set role='core' where email='you@example.com';
