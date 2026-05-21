import * as Location from 'expo-location';
import type { UserLocation } from '../types/pharmacy';

const ABIDJAN_CENTER = { latitude: 5.3599, longitude: -4.0083 };

export async function getCurrentLocation(): Promise<UserLocation> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return { ...ABIDJAN_CENTER, source: 'manual', commune: 'Plateau' };
  }
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    source: 'gps',
  };
}
