import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { fetchOnDutyPharmacies } from '../src/lib/pharmacies';
import type { PharmacyWithDistance, UserLocation } from '../src/types/pharmacy';
import { colors, radius, spacing } from '../src/theme';

const ABIDJAN_CENTER = { latitude: 5.3599, longitude: -4.0083 };

export default function Results() {
  const params = useLocalSearchParams<{ lat?: string; lng?: string; commune?: string }>();
  const [items, setItems] = useState<PharmacyWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user: UserLocation = {
      latitude: params.lat ? Number(params.lat) : ABIDJAN_CENTER.latitude,
      longitude: params.lng ? Number(params.lng) : ABIDJAN_CENTER.longitude,
      source: params.lat ? 'gps' : 'manual',
    };
    fetchOnDutyPharmacies(user, { commune: params.commune })
      .then(setItems)
      .catch((e) => setError(e.message ?? 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [params.lat, params.lng, params.commune]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Impossible de charger les pharmacies</Text>
        <Text style={styles.errorBody}>{error}</Text>
        <Text style={styles.errorHint}>
          Configure EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY dans .env
        </Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Aucune pharmacie trouvée</Text>
        <Text style={styles.errorHint}>
          Ajoute des pharmacies dans la table `pharmacies` Supabase
          {params.commune ? ` ou retire le filtre "${params.commune}"` : ''}.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(p) => p.id}
      contentContainerStyle={{ padding: spacing.lg }}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      renderItem={({ item }) => <PharmacyCard item={item} />}
    />
  );
}

function PharmacyCard({ item }: { item: PharmacyWithDistance }) {
  const openMaps = () => {
    const url = Platform.select({
      ios: `maps://?daddr=${item.latitude},${item.longitude}`,
      android: `google.navigation:q=${item.latitude},${item.longitude}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}`,
    });
    Linking.openURL(url!);
  };
  const call = () => item.phone && Linking.openURL(`tel:${item.phone}`);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        {item.is_on_duty_now && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>De garde</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardMeta}>
        {item.commune} • {item.distance_km.toFixed(1)} km
      </Text>
      <View style={styles.actions}>
        <Pressable style={[styles.actionBtn, styles.actionPrimary]} onPress={openMaps}>
          <Text style={styles.actionPrimaryText}>🗺️ Itinéraire</Text>
        </Pressable>
        {item.phone && (
          <Pressable style={styles.actionBtn} onPress={call}>
            <Text style={styles.actionText}>📞 Appeler</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  cardMeta: { color: colors.textMuted, marginTop: 4 },
  badge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginLeft: spacing.sm,
  },
  badgeText: { color: colors.success, fontSize: 12, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: spacing.sm as unknown as number, marginTop: spacing.md },
  actionBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  actionPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionPrimaryText: { color: '#fff', fontWeight: '700' },
  actionText: { color: colors.text, fontWeight: '600' },
  errorTitle: { fontSize: 16, fontWeight: '700', color: colors.accent, marginBottom: spacing.sm },
  errorBody: { color: colors.text, textAlign: 'center', marginBottom: spacing.md },
  errorHint: { color: colors.textMuted, textAlign: 'center', fontSize: 13 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
});
