-- DOMI · Hogar compartido entre cuentas (Supabase)
-- Pega todo este archivo en Supabase → SQL Editor → New query → Run.
-- Es seguro ejecutarlo más de una vez. Requiere haber corrido antes schema.sql.
--
-- Privacidad: cada hogar tiene su propia llave de cifrado, que solo viaja
-- dentro de la invitación (nunca llega al servidor). Aquí solo se guarda
-- texto cifrado y quién pertenece a cada hogar.

-- Hogares
create table if not exists public.domi_homes (
  id         uuid        primary key default gen_random_uuid(),
  owner      uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  join_hash  text        not null,               -- huella de la invitación (no permite descifrar nada)
  created_at timestamptz not null default now()
);

-- Quién vive en cada hogar
create table if not exists public.domi_home_members (
  home_id   uuid        not null references public.domi_homes (id) on delete cascade,
  user_id   uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (home_id, user_id)
);

-- Registros cifrados del hogar (configuración, gastos compartidos, saldos)
create table if not exists public.domi_home_records (
  home_id    uuid        not null references public.domi_homes (id) on delete cascade,
  id         text        not null,
  payload    text        not null,
  iv         text        not null,
  deleted    boolean     not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid        default auth.uid(),
  primary key (home_id, id)
);
create index if not exists domi_home_records_updated on public.domi_home_records (home_id, updated_at);

-- ¿La persona con sesión iniciada vive en este hogar?
create or replace function public.domi_is_member(h uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.domi_home_members where home_id = h and user_id = auth.uid());
$$;

-- Unirse con una invitación: solo funciona si la huella coincide
create or replace function public.domi_join_home(h uuid, token text) returns boolean
  language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  if not exists (select 1 from public.domi_homes where id = h and join_hash = encode(sha256(convert_to(token, 'UTF8')), 'hex')) then
    return false;
  end if;
  insert into public.domi_home_members (home_id, user_id) values (h, auth.uid()) on conflict do nothing;
  return true;
end $$;

alter table public.domi_homes        enable row level security;
alter table public.domi_home_members enable row level security;
alter table public.domi_home_records enable row level security;

drop policy if exists "domi: ver mis hogares" on public.domi_homes;
create policy "domi: ver mis hogares" on public.domi_homes
  for select using (owner = auth.uid() or public.domi_is_member(id));
drop policy if exists "domi: crear hogar" on public.domi_homes;
create policy "domi: crear hogar" on public.domi_homes
  for insert with check (owner = auth.uid());
drop policy if exists "domi: borrar mi hogar" on public.domi_homes;
create policy "domi: borrar mi hogar" on public.domi_homes
  for delete using (owner = auth.uid());

drop policy if exists "domi: ver integrantes" on public.domi_home_members;
create policy "domi: ver integrantes" on public.domi_home_members
  for select using (public.domi_is_member(home_id));
drop policy if exists "domi: el creador se agrega" on public.domi_home_members;
create policy "domi: el creador se agrega" on public.domi_home_members
  for insert with check (user_id = auth.uid() and exists (select 1 from public.domi_homes where id = home_id and owner = auth.uid()));
drop policy if exists "domi: salir o quitar" on public.domi_home_members;
create policy "domi: salir o quitar" on public.domi_home_members
  for delete using (user_id = auth.uid() or exists (select 1 from public.domi_homes where id = home_id and owner = auth.uid()));

drop policy if exists "domi: registros del hogar" on public.domi_home_records;
create policy "domi: registros del hogar" on public.domi_home_records
  for all using (public.domi_is_member(home_id)) with check (public.domi_is_member(home_id));

-- Tiempo real
do $$ begin
  alter publication supabase_realtime add table public.domi_home_records;
exception when duplicate_object then null; end $$;

grant select, insert, delete on public.domi_homes        to authenticated;
grant select, insert, delete on public.domi_home_members to authenticated;
grant select, insert, update, delete on public.domi_home_records to authenticated;
grant execute on function public.domi_is_member(uuid)       to authenticated;
grant execute on function public.domi_join_home(uuid, text) to authenticated;
