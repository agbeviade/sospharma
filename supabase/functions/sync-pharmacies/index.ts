/**
 * Edge Function: sync-pharmacies
 *
 * Scrapes pharmacies-de-garde.ci and upserts current on-duty pharmacies
 * into the Supabase database. Safe to call repeatedly — idempotent.
 *
 * Triggered by:
 *   - GitHub Actions cron (daily)
 *   - Admin "Sync" button in the app
 *   - Manual: supabase functions invoke sync-pharmacies
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SOURCE_URL =
  'https://www.pharmacies-de-garde.ci/liste-des-pharmacies-de-garde-en-cote-divoire/';

// ---------------------------------------------------------------------------
// GPS anchors per commune / sector
// ---------------------------------------------------------------------------
const GPS: Record<string, { lat: number; lng: number }> = {
  'ABOBO': { lat: 5.4145, lng: -4.0268 },
  'ABOBO PK 18': { lat: 5.4601, lng: -4.0426 },
  'ABOBO PK 19': { lat: 5.4699, lng: -4.0451 },
  'ABOBO PK 20': { lat: 5.4798, lng: -4.0476 },
  'ABOBO PK 21': { lat: 5.4897, lng: -4.0501 },
  'ABOBO PK 22': { lat: 5.4996, lng: -4.0526 },
  'ADJAME': { lat: 5.3589, lng: -4.0268 },
  'ADJAME CENTRE': { lat: 5.3589, lng: -4.0268 },
  'ADJAME - WILLIAMSVILLE': { lat: 5.3720, lng: -4.0320 },
  'ADJAME WILLIAMSVILLE': { lat: 5.3720, lng: -4.0320 },
  'ANYAMA': { lat: 5.4910, lng: -4.0460 },
  'ATTECOUBE': { lat: 5.3530, lng: -4.0450 },
  'BINGERVILLE': { lat: 5.3565, lng: -3.8831 },
  'ZONE AKOUEDO': { lat: 5.3770, lng: -3.9650 },
  'ZONE AKOUEDO + PALMERAIE EXTENSION + ABATTA': { lat: 5.3770, lng: -3.9650 },
  'COCODY': { lat: 5.3544, lng: -3.9949 },
  'COCODY CENTRE': { lat: 5.3544, lng: -3.9949 },
  'COCODY - RIVIERA': { lat: 5.3726, lng: -3.9630 },
  'COCODY RIVIERA': { lat: 5.3726, lng: -3.9630 },
  'COCODY - II PLATEAUX': { lat: 5.3878, lng: -3.9813 },
  'COCODY II PLATEAUX': { lat: 5.3878, lng: -3.9813 },
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
  'ANYAMA': { lat: 5.4910, lng: -4.0460 },
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function stripAccents(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function lookupGps(rawCommune: string): { lat: number; lng: number } {
  const up = stripAccents(rawCommune.trim().toUpperCase()).replace(/\s+/g, ' ');

  // Exact match
  for (const [key, coords] of Object.entries(GPS)) {
    if (stripAccents(key.toUpperCase()) === up) return coords;
  }
  // Prefix match
  for (const [key, coords] of Object.entries(GPS)) {
    const k = stripAccents(key.toUpperCase());
    if (up.startsWith(k) || k.startsWith(up)) return coords;
  }
  // Generic commune prefix
  if (up.startsWith('YOPOUGON')) return GPS['YOPOUGON'];
  if (up.startsWith('COCODY')) return GPS['COCODY'];
  if (up.startsWith('MARCORY')) return GPS['MARCORY'];
  if (up.startsWith('ABOBO')) return GPS['ABOBO'];
  if (up.startsWith('ADJAME')) return GPS['ADJAME'];
  if (up.startsWith('PORT BOUET') || up.startsWith('PORT-BOUET')) return GPS['PORT BOUET'];

  // Fallback: Abidjan centre
  return { lat: 5.3599, lng: -4.0083 };
}

function canonicalCommune(raw: string): string {
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
  // Title case fallback
  return raw.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function parsePhone(contact: string): string | null {
  const m = contact.match(/TEL[.\s:]+([0-9][0-9\s]{8,})/i);
  if (!m) return null;
  return m[1].replace(/\s+/g, ' ').trim();
}

// Small deterministic offset per pharmacy name so pins don't stack
function deterministicOffset(name: string, idx: number): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return ((h + idx * 17) % 100 - 50) * 0.00008;
}

// ---------------------------------------------------------------------------
// Parse table rows from HTML
// ---------------------------------------------------------------------------
interface RawRow {
  commune: string;
  name: string;
  contact: string;
  address: string;
}

function parseTable(html: string, tableId: string): RawRow[] {
  const start = html.indexOf(`id="${tableId}"`);
  if (start === -1) return [];
  const end = html.indexOf('</table>', start) + 8;
  const tableHtml = html.slice(start, end);

  const rows: RawRow[] = [];
  const rowRe = /<tr[^>]*class="row-\d+"[^>]*>([\s\S]*?)<\/tr>/g;
  let m: RegExpExecArray | null;
  while ((m = rowRe.exec(tableHtml)) !== null) {
    const cells = Array.from(m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g))
      .map((c) => c[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    if (cells.length >= 2 && cells[1].length > 0) {
      rows.push({
        commune: cells[0] || '',
        name: cells[1] || '',
        contact: cells[2] || '',
        address: cells[3] || '',
      });
    }
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  // Allow CORS for admin panel calls
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // 1. Fetch source HTML
    console.log('Fetching source...');
    const res = await fetch(SOURCE_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SOS-Pharma-Bot/1.0)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    console.log(`Got ${html.length} bytes`);

    // 2. Parse both tables
    const abidjanRows = parseTable(html, 'tablepress-177');
    const interiorRows = parseTable(html, 'tablepress-174');
    const allRows = [...abidjanRows, ...interiorRows];
    console.log(`Parsed: ${abidjanRows.length} Abidjan + ${interiorRows.length} interior`);

    if (allRows.length === 0) throw new Error('No rows parsed — site may have changed');

    // 3. Build pharmacy records
    const pharmacies = allRows.map((row, i) => {
      const coords = lookupGps(row.commune);
      return {
        name: row.name.slice(0, 200),
        commune: canonicalCommune(row.commune),
        phone: parsePhone(row.contact),
        address: row.address.slice(0, 300) || null,
        latitude: coords.lat + deterministicOffset(row.name, i),
        longitude: coords.lng + deterministicOffset(row.commune, i + 1000),
      };
    });

    // 4. Upsert pharmacies (match on name + commune)
    const { error: upsertErr } = await supabase
      .from('pharmacies')
      .upsert(pharmacies, { onConflict: 'name,commune', ignoreDuplicates: false });
    if (upsertErr) throw upsertErr;
    console.log(`Upserted ${pharmacies.length} pharmacies`);

    // 5. Replace on_duty_schedule for the current week
    // Week window: Monday 00:00 → Sunday 23:59 (Africa/Abidjan = UTC+0)
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0=Sun
    const daysToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() + daysToMon);
    weekStart.setUTCHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 0);

    const startsAt = weekStart.toISOString();
    const endsAt = weekEnd.toISOString();

    // Delete existing schedule for this week
    await supabase
      .from('on_duty_schedule')
      .delete()
      .gte('start_at', startsAt)
      .lte('end_at', endsAt);

    // Fetch pharmacy IDs for the scraped names
    const names = pharmacies.map((p) => p.name);
    const { data: rows, error: selectErr } = await supabase
      .from('pharmacies')
      .select('id, name, commune')
      .in('name', names);
    if (selectErr) throw selectErr;

    const scheduleRows = (rows || []).map((p) => ({
      pharmacy_id: p.id,
      start_at: startsAt,
      end_at: endsAt,
    }));

    if (scheduleRows.length > 0) {
      const { error: schedErr } = await supabase
        .from('on_duty_schedule')
        .insert(scheduleRows);
      if (schedErr) throw schedErr;
    }

    console.log(`Inserted ${scheduleRows.length} duty schedule entries`);

    return new Response(
      JSON.stringify({
        ok: true,
        pharmacies: pharmacies.length,
        onDuty: scheduleRows.length,
        weekStart: startsAt,
        weekEnd: endsAt,
        scrapedAt: new Date().toISOString(),
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error
      ? err.message
      : (err as Record<string, unknown>)?.message
        ? JSON.stringify(err)
        : String(err);
    console.error('Sync failed:', msg, err);
    return new Response(
      JSON.stringify({ ok: false, error: msg, detail: JSON.stringify(err) }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
