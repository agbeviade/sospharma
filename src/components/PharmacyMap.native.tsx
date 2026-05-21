import { StyleSheet, View } from 'react-native';
import MapView, { Callout, Marker, type Region } from 'react-native-maps';
import type { PharmacyWithDistance, UserLocation } from '../types/pharmacy';
import { colors } from '../theme';

const ABIDJAN: Region = {
  latitude: 5.3599,
  longitude: -4.0083,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

interface Props {
  pharmacies: PharmacyWithDistance[];
  userLocation: UserLocation | null;
}

export default function PharmacyMap({ pharmacies, userLocation }: Props) {
  const initialRegion: Region =
    userLocation
      ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }
      : ABIDJAN;

  return (
    <View style={styles.container}>
      <MapView style={StyleSheet.absoluteFill} initialRegion={initialRegion}>
        {userLocation && (
          <Marker
            coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
            pinColor={colors.primary}
            title="Ma position"
          />
        )}
        {pharmacies.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
            pinColor={p.is_on_duty_now ? colors.success : '#9CA3AF'}
            title={p.name}
            description={`${p.commune} • ${p.distance_km.toFixed(1)} km${p.phone ? ` • ${p.phone}` : ''}`}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
