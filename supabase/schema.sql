-- SOS Pharma — schéma Supabase
-- À exécuter dans Supabase SQL editor (ou via `supabase db push`).

create extension if not exists "uuid-ossp";

create table if not exists pharmacies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  commune text not null,
  latitude double precision not null,
  longitude double precision not null,
  phone text,
  address text,
  created_at timestamptz not null default now()
);

create index if not exists pharmacies_commune_idx on pharmacies (commune);

create table if not exists on_duty_schedule (
  id uuid primary key default uuid_generate_v4(),
  pharmacy_id uuid not null references pharmacies(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  is_on_duty boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists on_duty_window_idx on on_duty_schedule (start_at, end_at);
create index if not exists on_duty_pharmacy_idx on on_duty_schedule (pharmacy_id);

-- Profils utilisateurs (liés à auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  default_commune text,
  last_latitude double precision,
  last_longitude double precision,
  created_at timestamptz not null default now()
);

-- Historique de recherche (optionnel)
create table if not exists search_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  query text not null,
  created_at timestamptz not null default now()
);

-- RLS
alter table pharmacies enable row level security;
alter table on_duty_schedule enable row level security;
alter table profiles enable row level security;
alter table search_history enable row level security;

-- Lecture publique des pharmacies et plannings (lecture seule pour anon)
drop policy if exists "pharmacies are readable by everyone" on pharmacies;
create policy "pharmacies are readable by everyone"
  on pharmacies for select using (true);

drop policy if exists "on_duty readable by everyone" on on_duty_schedule;
create policy "on_duty readable by everyone"
  on on_duty_schedule for select using (true);

-- Profils : chaque user gère le sien
drop policy if exists "users manage own profile" on profiles;
create policy "users manage own profile"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "users manage own search history" on search_history;
create policy "users manage own search history"
  on search_history for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
