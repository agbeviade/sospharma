import { supabase } from './supabase';
import { haversineKm } from './distance';
import type { Pharmacy, PharmacyWithDistance, UserLocation } from '../types/pharmacy';

export async function fetchOnDutyPharmacies(
  user: UserLocation,
  opts: { onlyOnDuty?: boolean; commune?: string; limit?: number } = {},
): Promise<PharmacyWithDistance[]> {
  const { onlyOnDuty = true, commune, limit = 20 } = opts;

  let query = supabase.from('pharmacies').select('*');
  if (commune) query = query.eq('commune', commune);
  const { data, error } = await query;
  if (error) throw error;

  const now = new Date().toISOString();
  let onDutyIds = new Set<string>();
  if (onlyOnDuty) {
    const { data: duty, error: dutyErr } = await supabase
      .from('on_duty_schedule')
      .select('pharmacy_id')
      .lte('start_at', now)
      .gte('end_at', now)
      .eq('is_on_duty', true);
    if (dutyErr) throw dutyErr;
    onDutyIds = new Set((duty ?? []).map((d) => d.pharmacy_id));
  }

  const enriched: PharmacyWithDistance[] = (data ?? []).map((p: Pharmacy) => ({
    ...p,
    distance_km: haversineKm(user, p),
    is_on_duty_now: onDutyIds.has(p.id),
  }));

  return enriched
    .filter((p) => (onlyOnDuty ? p.is_on_duty_now : true))
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, limit);
}
