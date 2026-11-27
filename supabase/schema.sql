-- DOMI · Sincronización entre dispositivos (Supabase)
-- Pega todo este archivo en Supabase → SQL Editor → New query → Run.
-- Es seguro ejecutarlo más de una vez.
--
-- Privacidad: el contenido de cada registro llega YA CIFRADO desde el
-- dispositivo (AES-GCM con una llave derivada de la contraseña del usuario).
-- El servidor solo guarda texto ilegible.

-- Registros cifrados (movimientos, metas, inversiones, límites, ajustes…)
create table if not exists public.domi_records (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  id         text        not null,
  kind       text        not null,
  payload    text        not null,               -- contenido cifrado (base64)
  iv         text        not null,               -- vector de inicialización (base64)
  deleted    boolean     not null default false, -- borrado lógico para sincronizar eliminaciones
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index if not exists domi_records_user_updated on public.domi_records (user_id, updated_at);

-- Datos para verificar la contraseña de cifrado (nunca se guarda la contraseña)
create table if not exists public.domi_keys (
  user_id     uuid        primary key default auth.uid() references auth.users (id) on delete cascade,
  salt        text        not null,
  verifier    text        not null,
  verifier_iv text        not null,
  created_at  timestamptz not null default now()
);

-- Seguridad por fila: cada persona solo puede ver y modificar lo suyo
alter table public.domi_records enable row level security;
alter table public.domi_keys    enable row level security;

drop policy if exists "domi: solo mis registros" on public.domi_records;
create policy "domi: solo mis registros" on public.domi_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "domi: solo mi llave" on public.domi_keys;
create policy "domi: solo mi llave" on public.domi_keys
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Tiempo real: avisar a los otros dispositivos cuando algo cambia
do $$ begin
  alter publication supabase_realtime add table public.domi_records;
exception when duplicate_object then null; end $$;
