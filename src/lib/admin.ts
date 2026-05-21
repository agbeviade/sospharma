import { supabase } from './supabase';
import type { Pharmacy } from '../types/pharmacy';

// ── Pharmacies ──────────────────────────────────────────────────────────────

export async function fetchAllPharmacies(): Promise<Pharmacy[]> {
  const { data, error } = await supabase
    .from('pharmacies')
    .select('*')
    .order('commune')
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export interface PharmacyInput {
  name: string;
  commune: string;
  latitude: number;
  longitude: number;
  phone: string;
  address: string;
}

export async function createPharmacy(input: PharmacyInput): Promise<Pharmacy> {
  const { data, error } = await supabase
    .from('pharmacies')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePharmacy(id: string, input: Partial<PharmacyInput>): Promise<void> {
  const { error } = await supabase.from('pharmacies').update(input).eq('id', id);
  if (error) throw error;
}

export async function deletePharmacy(id: string): Promise<void> {
  const { error } = await supabase.from('pharmacies').delete().eq('id', id);
  if (error) throw error;
}

// ── Planning de garde ────────────────────────────────────────────────────────

export interface DutyWindow {
  pharmacyId: string;
  startAt: Date;
  endAt: Date;
}

/** Supprime le planning de la période et recrée les nouvelles gardes. */
export async function setDutySchedule(windows: DutyWindow[]): Promise<void> {
  if (windows.length === 0) return;

  const startAt = windows[0].startAt.toISOString();
  const endAt = windows[0].endAt.toISOString();

  // Supprime les gardes existantes sur cette fenêtre
  const { error: delErr } = await supabase
    .from('on_duty_schedule')
    .delete()
    .gte('start_at', startAt)
    .lte('end_at', endAt);
  if (delErr) throw delErr;

  const rows = windows.map((w) => ({
    pharmacy_id: w.pharmacyId,
    start_at: w.startAt.toISOString(),
    end_at: w.endAt.toISOString(),
    is_on_duty: true,
  }));

  const { error: insErr } = await supabase.from('on_duty_schedule').insert(rows);
  if (insErr) throw insErr;
}

/** Récupère les IDs des pharmacies de garde sur une fenêtre donnée. */
export async function fetchDutyPharmacyIds(start: Date, end: Date): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('on_duty_schedule')
    .select('pharmacy_id')
    .lte('start_at', end.toISOString())
    .gte('end_at', start.toISOString())
    .eq('is_on_duty', true);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.pharmacy_id));
}

// ── Sync depuis pharmacies-de-garde.ci ──────────────────────────────────────

export interface SyncResult {
  pharmacies: number;
  onDuty: number;
  weekStart: string;
  weekEnd: string;
  scrapedAt: string;
}

export async function syncPharmaciesFromSource(): Promise<SyncResult> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/sync-pharmacies`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  const json = await res.json();
  if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
  return json as SyncResult;
}

// ── Profil admin ─────────────────────────────────────────────────────────────

export async function fetchIsAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  return data?.is_admin ?? false;
}
