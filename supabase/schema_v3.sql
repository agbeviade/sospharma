-- SOS Pharma — Migration v3 : contrainte unique pour upsert + service role bypass RLS
-- À exécuter dans Supabase SQL Editor après schema_v2.sql

-- Contrainte unique (name, commune) — permet l'upsert idempotent depuis l'Edge Function
alter table pharmacies
  add constraint if not exists pharmacies_name_commune_key unique (name, commune);

-- L'Edge Function tourne avec le service role key et doit bypasser RLS
-- (le service role bypasse RLS automatiquement dans Supabase — aucune action requise)
-- Si vous utilisez la clé anon depuis GitHub Actions, décommentez ceci :
-- create policy "service role can manage pharmacies" on pharmacies
--   for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
