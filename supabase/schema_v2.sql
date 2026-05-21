-- SOS Pharma — Migration v2 : rôle admin + RLS écriture
-- À exécuter dans Supabase SQL Editor après schema.sql

-- Colonne is_admin sur les profils
alter table profiles add column if not exists is_admin boolean not null default false;

-- Helper function : est-ce que l'utilisateur courant est admin ?
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select is_admin from profiles where id = auth.uid()),
    false
  );
$$;

-- Pharmacies : les admins peuvent tout faire
drop policy if exists "admins manage pharmacies" on pharmacies;
create policy "admins manage pharmacies"
  on pharmacies for all
  using (is_admin())
  with check (is_admin());

-- Planning de garde : les admins peuvent tout faire
drop policy if exists "admins manage duty schedule" on on_duty_schedule;
create policy "admins manage duty schedule"
  on on_duty_schedule for all
  using (is_admin())
  with check (is_admin());

-- Pour promouvoir un utilisateur admin, exécuter (remplace l'email) :
-- update profiles set is_admin = true where id = (
--   select id from auth.users where email = 'votre@email.com'
-- );
