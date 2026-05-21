# SOS Pharma

Trouver rapidement les pharmacies de garde à Abidjan — web + mobile à partir d'une seule codebase.

## Stack

- **Expo (React Native + Web)** — un seul code pour iOS, Android, Web
- **expo-router** — routing fichier-par-fichier
- **Supabase** — Postgres + Auth + API auto
- **expo-location** — géolocalisation
- **TypeScript** strict

## Démarrage

```bash
cd sos-pharma
npm install

# 1. Crée un projet sur https://supabase.com
# 2. SQL editor → colle supabase/schema.sql puis supabase/seed.sql
# 3. Settings → API → copie URL + anon key
cp .env.example .env
# édite .env

npm run web        # web
npm run android    # Android (émulateur ou device via Expo Go)
npm run ios        # iOS (Mac requis)
```

## Structure

```
app/                     écrans (expo-router)
  _layout.tsx            navigation racine
  index.tsx              accueil (CTA + recherche + chips communes)
  results.tsx            liste pharmacies + appel/itinéraire
src/
  lib/
    supabase.ts          client Supabase
    location.ts          GPS + fallback Abidjan
    distance.ts          calcul haversine
    pharmacies.ts        requête + filtre garde + tri distance
  types/pharmacy.ts
  theme.ts               couleurs / spacings
supabase/
  schema.sql             tables + RLS
  seed.sql               6 pharmacies d'exemple
```

## Roadmap MVP

- [x] Sprint 0 : scaffold + schéma DB + écrans accueil/résultats
- [ ] Sprint 1 : Auth Supabase (email + Google), profil
- [ ] Sprint 2 : Carte (`react-native-maps` mobile / `react-leaflet` web)
- [ ] Sprint 3 : Vraies données pharmacies (scraping pharmacies-de-garde.ci + admin)
- [ ] Sprint 4 : Recherche IA (GPT-4o-mini pour parser l'intent → filtres)
- [ ] Sprint 5 : Admin panel (CRUD pharmacies + planning de garde)

## Le vrai défi : les données

Le planning de garde change chaque semaine. Avant scale-up il faut soit :
- scraper https://www.pharmacies-de-garde.ci/ (vérifier les CGU)
- partenariat avec l'Ordre des Pharmaciens de Côte d'Ivoire
- backoffice admin pour saisie hebdo

Sans flux de données fiable, l'app perd la confiance des utilisateurs en quelques jours.
