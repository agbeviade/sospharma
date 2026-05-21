/**
 * scripts/scrape-and-seed.js
 *
 * Scrapes ALL pharmacies from pharmacies-de-garde.ci (no Playwright needed —
 * TablePress embeds the data directly in the HTML) and generates
 * supabase/seed.sql.
 *
 * Usage:
 *   node scripts/scrape-and-seed.js          # generate SQL file only
 *   node scripts/scrape-and-seed.js --push   # also upsert directly to Supabase
 *
 * For --push you need EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * in your environment (or .env loaded manually).
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SOURCE_URL =
  'https://www.pharmacies-de-garde.ci/liste-des-pharmacies-de-garde-en-cote-divoire/';

// ---------------------------------------------------------------------------
// GPS anchors per commune / sector
// ---------------------------------------------------------------------------
const GPS = {
  'ABOBO': { lat: 5.4145, lng: -4.0268 },
  'ABOBO PK 18': { lat: 5.4601, lng: -4.0426 },
  'ABOBO PK 19': { lat: 5.4699, lng: -4.0451 },
  'ABOBO PK 20': { lat: 5.4798, lng: -4.0476 },
  'ABOBO PK 21': { lat: 5.4897, lng: -4.0501 },
  'ABOBO PK 22': { lat: 5.4996, lng: -4.0526 },
  'ADJAME': { lat: 5.3589, lng: -4.0268 },
  'ADJAME CENTRE': { lat: 5.3589, lng: -4.0268 },
  'ADJAME - WILLIAMSVILLE': { lat: 5.3720, lng: -4.0320 },
  'ANYAMA': { lat: 5.4910, lng: -4.0460 },
  'ATTECOUBE': { lat: 5.3530, lng: -4.0450 },
  'BINGERVILLE': { lat: 5.3565, lng: -3.8831 },
  'ZONE AKOUEDO': { lat: 5.3770, lng: -3.9650 },
  'ZONE AKOUEDO + PALMERAIE EXTENSION + ABATTA': { lat: 5.3770, lng: -3.9650 },
  'COCODY': { lat: 5.3544, lng: -3.9949 },
  'COCODY CENTRE': { lat: 5.3544, lng: -3.9949 },
  'COCODY - RIVIERA': { lat: 5.3726, lng: -3.9630 },
  'COCODY - II PLATEAUX': { lat: 5.3878, lng: -3.9813 },
  'KOUMASSI': { lat: 5.3037, lng: -3.9911 },
  'MARCORY': { lat: 5.3104, lng: -4.0059 },
  'MARCORY NORD': { lat: 5.3155, lng: -4.0059 },
  'MARCORY - ANOUMABO': { lat: 5.3045, lng: -4.0120 },
  'PLATEAU': { lat: 5.3194, lng: -4.0228 },
  'PORT BOUET': { lat: 5.2566, lng: -3.9282 },
  'PORT BOUET CENTRE': { lat: 5.2566, lng: -3.9282 },
  'PORT BOUET - VRIDI': { lat: 5.2710, lng: -4.0080 },
  'PORT BOUET - ADJOUFFOU + GONZAQ + ANANI': { lat: 5.2411, lng: -3.9195 },
  'TREICHVILLE': { lat: 5.2978, lng: -4.0160 },
  'YOPOUGON': { lat: 5.3413, lng: -4.0831 },
  'YOPOUGON - ABOBODOUME + LOCODJORO': { lat: 5.3750, lng: -4.1060 },
  'YOPOUGON - ALLOKOI PK 23': { lat: 5.3600, lng: -4.1050 },
  'YOPOUGON - Secteur 1': { lat: 5.3250, lng: -4.0780 },
  'YOPOUGON - Secteur 2': { lat: 5.3290, lng: -4.0820 },
  'YOPOUGON - Secteur 3': { lat: 5.3330, lng: -4.0860 },
  'YOPOUGON - Secteur 4': { lat: 5.3370, lng: -4.0900 },
  'YOPOUGON - Secteur 5': { lat: 5.3410, lng: -4.0940 },
  'YOPOUGON - Secteur 6': { lat: 5.3450, lng: -4.0980 },
  'YOPOUGON - Secteur 7': { lat: 5.3490, lng: -4.1020 },
  'YOPOUGON - Secteur 8': { lat: 5.3530, lng: -4.1060 },
  'YOPOUGON - Secteur 9': { lat: 5.3570, lng: -4.1100 },
  'YOPOUGON - Secteur 10': { lat: 5.3610, lng: -4.1140 },
  'YOPOUGON - Secteur 11': { lat: 5.3650, lng: -4.1180 },
  'YOPOUGON - Secteur 12': { lat: 5.3690, lng: -4.1220 },
  'YOPOUGON - Secteur 13': { lat: 5.3730, lng: -4.1260 },
  'YOPOUGON - Secteur 14': { lat: 5.3770, lng: -4.1300 },
  'YOPOUGON - Secteur 15': { lat: 5.3810, lng: -4.1340 },
  'YOPOUGON - Secteur 16': { lat: 5.3850, lng: -4.1380 },
  'YOPOUGON - Secteur 17': { lat: 5.3890, lng: -4.1420 },
  // Interior
  'ABENGOUROU': { lat: 6.7294, lng: -3.4968 },
  'ABOISSO': { lat: 5.4674, lng: -3.2094 },
  'ADZOPE': { lat: 6.1079, lng: -3.8657 },
  'AGBOVILLE': { lat: 5.9267, lng: -4.2138 },
  'AKOUPE': { lat: 6.3833, lng: -3.8833 },
  'ALEPE': { lat: 5.4955, lng: -3.6662 },
  'AZAGUIE': { lat: 5.6333, lng: -4.0833 },
  'BEOUMI': { lat: 7.6731, lng: -5.5804 },
  'BOCANDA': { lat: 7.0667, lng: -4.5167 },
  'BONDOUKOU': { lat: 8.0354, lng: -2.8003 },
  'BONGOUANOU': { lat: 6.6548, lng: -4.2033 },
  'BOUAKE': { lat: 7.6931, lng: -5.0308 },
  'BOUNA': { lat: 9.2673, lng: -2.9981 },
  'BOUNDIALI': { lat: 9.5239, lng: -6.4839 },
  'DALOA': { lat: 6.8773, lng: -6.4502 },
  'DANANE': { lat: 7.2670, lng: -8.1578 },
  'DAOUKRO': { lat: 7.0667, lng: -3.9667 },
  'DIMBOKRO': { lat: 6.6500, lng: -4.7000 },
  'DIVO': { lat: 5.8349, lng: -5.3635 },
  'DUEKOUE': { lat: 6.7419, lng: -7.3503 },
  'FERKESSEDOUGOU': { lat: 9.5925, lng: -5.1991 },
  'GAGNOA': { lat: 6.1322, lng: -5.9503 },
  'GRAND BASSAM': { lat: 5.2024, lng: -3.7417 },
  'GRAND LAHOU': { lat: 5.1394, lng: -5.0174 },
  'GUIGLO': { lat: 6.5372, lng: -7.4911 },
  'ISSIA': { lat: 6.4818, lng: -6.5829 },
  'JACQUEVILLE': { lat: 5.2060, lng: -4.4146 },
  'KATIOLA': { lat: 8.1333, lng: -5.1000 },
  'KORHOGO': { lat: 9.4578, lng: -5.6291 },
  'LAKOTA': { lat: 5.8422, lng: -5.6840 },
  'MAN': { lat: 7.4125, lng: -7.5538 },
  'ODIENNE': { lat: 9.5000, lng: -7.5667 },
  'OUME': { lat: 6.3769, lng: -5.4153 },
  'SAN PEDRO': { lat: 4.7484, lng: -6.6369 },
  'SASSANDRA': { lat: 4.9507, lng: -6.0849 },
  'SEGUELA': { lat: 7.9601, lng: -6.6714 },
  'SIKENSI': { lat: 5.6667, lng: -4.5833 },
  'SOUBRE': { lat: 5.7833, lng: -6.5833 },
  'TABOU': { lat: 4.4225, lng: -7.3588 },
  'TIASSALE': { lat: 5.8969, lng: -4.8236 },
  'TIEBISSOU': { lat: 7.1500, lng: -5.2333 },
  'TOUBA': { lat: 8.2843, lng: -7.6868 },
  'TOUMODI': { lat: 6.5667, lng: -5.0167 },
  'VAVOUA': { lat: 7.3769, lng: -6.4739 },
  'YAMOUSSOUKRO': { lat: 6.8276, lng: -5.2893 },
  'ZUENNOULA': { lat: 7.4333, lng: -6.0500 },
};

function stripAccents(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function lookupGps(rawCommune) {
  const up = stripAccents(rawCommune.trim().toUpperCase()).replace(/\s+/g, ' ');
  for (const [key, coords] of Object.entries(GPS)) {
    if (stripAccents(key.toUpperCase()) === up) return coords;
  }
  for (const [key, coords] of Object.entries(GPS)) {
    const k = stripAccents(key.toUpperCase());
    if (up.startsWith(k) || k.startsWith(up)) return coords;
  }
  if (up.startsWith('YOPOUGON')) return GPS['YOPOUGON'];
  if (up.startsWith('COCODY')) return GPS['COCODY'];
  if (up.startsWith('MARCORY')) return GPS['MARCORY'];
  if (up.startsWith('ABOBO')) return GPS['ABOBO'];
  if (up.startsWith('ADJAME')) return GPS['ADJAME'];
  if (up.startsWith('PORT BOUET') || up.startsWith('PORT-BOUET')) return GPS['PORT BOUET'];
  return { lat: 5.3599, lng: -4.0083 }; // Abidjan centre
}

function canonicalCommune(raw) {
  const up = stripAccents(raw.trim().toUpperCase());
  if (up.startsWith('YOPOUGON')) return 'Yopougon';
  if (up.startsWith('COCODY')) return 'Cocody';
  if (up.startsWith('MARCORY')) return 'Marcory';
  if (up.startsWith('ABOBO')) return 'Abobo';
  if (up.startsWith('ADJAME')) return 'Adjamé';
  if (up.startsWith('PORT')) return 'Port-Bouët';
  if (up.startsWith('ATTECOUBE')) return 'Attécoubé';
  if (up.startsWith('TREICHVILLE')) return 'Treichville';
  if (up.startsWith('PLATEAU')) return 'Plateau';
  if (up.startsWith('KOUMASSI')) return 'Koumassi';
  if (up.startsWith('ANYAMA')) return 'Anyama';
  if (up.startsWith('BINGERVILLE') || up.startsWith('ZONE AKOUEDO')) return 'Bingerville';
  if (up.startsWith('BOUAKE')) return 'Bouaké';
  if (up.startsWith('YAMOUSSOUKRO')) return 'Yamoussoukro';
  if (up.startsWith('SAN PEDRO')) return 'San-Pédro';
  if (up.startsWith('KORHOGO')) return 'Korhogo';
  if (up.startsWith('DALOA')) return 'Daloa';
  if (up.startsWith('MAN')) return 'Man';
  if (up.startsWith('GRAND BASSAM')) return 'Grand-Bassam';
  return raw.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function parsePhone(contact) {
  if (!contact) return null;
  const m = contact.match(/TEL[.\s:]+([0-9][0-9\s]{8,})/i);
  if (!m) return null;
  return m[1].replace(/\s+/g, ' ').trim();
}

function deterministicOffset(name, idx) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return ((h + idx * 17) % 100 - 50) * 0.00008;
}

// ---------------------------------------------------------------------------
// Fetch HTML
// ---------------------------------------------------------------------------
function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const get = (u, redirects = 0) => {
      const mod = u.startsWith('https') ? require('https') : require('http');
      mod.get(u, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SOS-Pharma-Bot/1.0)' } }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (redirects > 5) return reject(new Error('Too many redirects'));
          return get(res.headers.location, redirects + 1);
        }
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => resolve(body));
        res.on('error', reject);
      }).on('error', reject);
    };
    get(url);
  });
}

// ---------------------------------------------------------------------------
// Parse table rows from HTML
// ---------------------------------------------------------------------------
function parseTable(html, tableId) {
  const start = html.indexOf(`id="${tableId}"`);
  if (start === -1) { console.warn(`Table ${tableId} not found`); return []; }
  const end = html.indexOf('</table>', start) + 8;
  const tableHtml = html.slice(start, end);

  const rows = [];
  const rowRe = /<tr[^>]*class="row-\d+"[^>]*>([\s\S]*?)<\/tr>/g;
  let m;
  while ((m = rowRe.exec(tableHtml)) !== null) {
    const cells = Array.from(m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g))
      .map(c => c[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    if (cells.length >= 2 && cells[1]) {
      rows.push({ commune: cells[0] || '', name: cells[1] || '', contact: cells[2] || '', address: cells[3] || '' });
    }
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Generate seed SQL
// ---------------------------------------------------------------------------
function generateSeed(pharmacies) {
  const esc = s => (s || '').replace(/'/g, "''");
  const withCoords = pharmacies.map((p, i) => {
    const coords = lookupGps(p.commune);
    return {
      name: esc(p.name).slice(0, 200),
      commune: esc(canonicalCommune(p.commune)),
      phone: parsePhone(p.contact),
      address: p.address ? esc(p.address).slice(0, 300) : null,
      lat: (coords.lat + deterministicOffset(p.name, i)).toFixed(6),
      lng: (coords.lng + deterministicOffset(p.commune, i + 1000)).toFixed(6),
    };
  });

  const lines = [
    `-- Generated by scripts/scrape-and-seed.js — ${new Date().toISOString()}`,
    `-- ${pharmacies.length} pharmacies`,
    '',
    'truncate table on_duty_schedule cascade;',
    'truncate table pharmacies cascade;',
    '',
    'insert into pharmacies (name, commune, phone, address, latitude, longitude) values',
  ];

  withCoords.forEach((p, i) => {
    const phone = p.phone ? `'${p.phone}'` : 'null';
    const address = p.address ? `'${p.address}'` : 'null';
    const comma = i < withCoords.length - 1 ? ',' : ';';
    lines.push(`  ('${p.name}', '${p.commune}', ${phone}, ${address}, ${p.lat}, ${p.lng})${comma}`);
  });

  lines.push('');
  lines.push('-- Duty schedule: all scraped pharmacies are on duty this week');
  lines.push(`insert into on_duty_schedule (pharmacy_id, starts_at, ends_at)`);
  lines.push(`select p.id,`);
  lines.push(`  date_trunc('week', now() at time zone 'Africa/Abidjan') at time zone 'Africa/Abidjan',`);
  lines.push(`  date_trunc('week', now() at time zone 'Africa/Abidjan') at time zone 'Africa/Abidjan' + interval '6 days 23 hours 59 minutes'`);
  lines.push(`from pharmacies p;`);
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
(async () => {
  const doPush = process.argv.includes('--push');

  console.log('Fetching pharmacies-de-garde.ci...');
  const html = await fetchHtml(SOURCE_URL);
  console.log(`Downloaded ${html.length} bytes`);

  const abidjan = parseTable(html, 'tablepress-177');
  const interior = parseTable(html, 'tablepress-174');
  const all = [...abidjan, ...interior];
  console.log(`Parsed: ${abidjan.length} Abidjan + ${interior.length} interior = ${all.length} total`);

  if (all.length === 0) { console.error('No rows parsed'); process.exit(1); }

  const sql = generateSeed(all);
  const outPath = path.join(__dirname, '..', 'supabase', 'seed.sql');
  fs.writeFileSync(outPath, sql, 'utf8');
  console.log(`\nWrote ${outPath}`);

  if (doPush) {
    // Load .env manually
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const [k, ...v] = line.split('=');
        if (k && v.length) process.env[k.trim()] = v.join('=').trim();
      });
    }

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      console.error('Set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to use --push');
      process.exit(1);
    }

    console.log('\nPushing to Supabase Edge Function...');
    const res = await fetch(`${supabaseUrl}/functions/v1/sync-pharmacies`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    console.log('Result:', json);
    if (!json.ok) { console.error('Push failed'); process.exit(1); }
  }

  console.log('\nNext steps:');
  console.log('  1. Run schema_v2.sql in Supabase SQL Editor (if not done)');
  console.log('  2. Run supabase/seed.sql in Supabase SQL Editor');
  console.log('  3. Deploy Edge Function: npx supabase functions deploy sync-pharmacies');
  console.log('  4. Add GitHub secrets: SUPABASE_URL, SUPABASE_ANON_KEY');
  console.log('  5. Promote admin: update profiles set is_admin=true where id=(select id from auth.users where email=\'agbeviade2017@gmail.com\');');
})();
