export type Commune =
  | 'Abobo'
  | 'Adjamé'
  | 'Attécoubé'
  | 'Cocody'
  | 'Koumassi'
  | 'Marcory'
  | 'Plateau'
  | 'Port-Bouët'
  | 'Treichville'
  | 'Yopougon'
  | 'Bingerville'
  | 'Anyama'
  | 'Songon';

export interface Pharmacy {
  id: string;
  name: string;
  commune: Commune | string;
  latitude: number;
  longitude: number;
  phone: string | null;
  address: string | null;
  created_at?: string;
}

export interface OnDutyEntry {
  id: string;
  pharmacy_id: string;
  start_at: string;
  end_at: string;
  is_on_duty: boolean;
}

export interface PharmacyWithDistance extends Pharmacy {
  distance_km: number;
  is_on_duty_now: boolean;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  commune?: string;
  source: 'gps' | 'manual';
}
