-- Seed minimal : quelques pharmacies fictives d'Abidjan pour tester l'app.
-- Remplacer par les vraies données (https://www.pharmacies-de-garde.ci/).

insert into pharmacies (name, commune, latitude, longitude, phone, address) values
  ('Pharmacie de la Riviera', 'Cocody', 5.3678, -3.9722, '+225 27 22 47 12 34', 'Riviera 3, Cocody'),
  ('Pharmacie du Plateau', 'Plateau', 5.3261, -4.0186, '+225 27 20 32 11 22', 'Av. Chardy, Plateau'),
  ('Pharmacie Yopougon Niangon', 'Yopougon', 5.3402, -4.1019, '+225 27 23 45 67 89', 'Niangon Sud, Yopougon'),
  ('Pharmacie Abobo Centre', 'Abobo', 5.4286, -4.0203, '+225 27 24 11 22 33', 'Abobo gare'),
  ('Pharmacie Marcory Zone 4', 'Marcory', 5.2917, -3.9961, '+225 27 21 35 46 57', 'Zone 4, Marcory'),
  ('Pharmacie Treichville', 'Treichville', 5.2937, -4.0094, '+225 27 21 24 35 46', 'Av. 8, Treichville');

-- Mettre 3 pharmacies de garde pour les 24 prochaines heures
insert into on_duty_schedule (pharmacy_id, start_at, end_at, is_on_duty)
select id, now() - interval '2 hours', now() + interval '22 hours', true
from pharmacies
where name in (
  'Pharmacie de la Riviera',
  'Pharmacie Yopougon Niangon',
  'Pharmacie Marcory Zone 4'
);
