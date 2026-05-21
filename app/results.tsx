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
import { useLocalSearchParams, router } from 'expo-router';
import { fetchOnDutyPharmacies } from '../src/lib/pharmacies';
import PharmacyMap from '../src/components/PharmacyMap';
import type { PharmacyWithDistance, UserLocation } from '../src/types/pharmacy';
import { colors, radius, shadow, spacing } from '../src/theme';

const ABIDJAN_CENTER: UserLocation = { latitude: 5.3599, longitude: -4.0083, source: 'manual' };
type ViewMode = 'list' | 'map';

export default function Results() {
  const params = useLocalSearchParams<{
    lat?: string; lng?: string; commune?: string;
    medication?: string; aiQuery?: string; aiSource?: string;
  }>();
  const [items, setItems]   = useState<PharmacyWithDistance[]>([]);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [mode, setMode]     = useState<ViewMode>('list');

  const userLocation: UserLocation = {
    latitude:  params.lat ? Number(params.lat) : ABIDJAN_CENTER.latitude,
    longitude: params.lng ? Number(params.lng) : ABIDJAN_CENTER.longitude,
    source: params.lat ? 'gps' : 'manual',
  };

  useEffect(() => {
    fetchOnDutyPharmacies(userLocation, { commune: params.commune })
      .then(setItems)
      .catch((e) => setError(e.message ?? 'Erreur de chargement'))
      .finally(() => setLoad(false));
  }, [params.lat, params.lng, params.commune]);

  if (loading) {
    return (
      <View style={styles.center}>
        <View style={styles.loadingIcon}><Text style={{ fontSize: 32 }}>💊</Text></View>
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: spacing.lg }} />
        <Text style={styles.loadingText}>Recherche des pharmacies…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 48, marginBottom: spacing.lg }}>⚠️</Text>
        <Text style={styles.errorTitle}>Impossible de charger</Text>
        <Text style={styles.errorBody}>{error}</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 48, marginBottom: spacing.lg }}>🔍</Text>
        <Text style={styles.emptyTitle}>Aucune pharmacie trouvée</Text>
        <Text style={styles.errorBody}>
          {params.commune ? `Aucun résultat pour "${params.commune}"` : 'Essaie une autre commune'}
        </Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Retour</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>

      {/* Intent banner */}
      {params.aiQuery ? (
        <View style={styles.intentBanner}>
          <Text style={styles.intentIcon}>{params.aiSource === 'ai' ? '✨' : '🔍'}</Text>
          <Text style={styles.intentText} numberOfLines={1}>« {params.aiQuery} »</Text>
          {params.commune   && <View style={styles.intentTag}><Text style={styles.intentTagText}>{params.commune}</Text></View>}
          {params.medication && <View style={styles.intentTag}><Text style={styles.intentTagText}>💊 {params.medication}</Text></View>}
        </View>
      ) : null}

      {/* Toggle liste / carte */}
      <View style={styles.toolbar}>
        <Text style={styles.toolbarCount}>
          <Text style={styles.toolbarCountNum}>{items.length}</Text>
          {' '}pharmacie{items.length > 1 ? 's' : ''}
        </Text>
        <View style={styles.toggle}>
          <Pressable
            style={[styles.toggleBtn, mode === 'list' && styles.toggleBtnActive]}
            onPress={() => setMode('list')}
          >
            <Text style={[styles.toggleBtnText, mode === 'list' && styles.toggleBtnTextActive]}>
              Liste
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, mode === 'map' && styles.toggleBtnActive]}
            onPress={() => setMode('map')}
          >
            <Text style={[styles.toggleBtnText, mode === 'map' && styles.toggleBtnTextActive]}>
              Carte
            </Text>
          </Pressable>
        </View>
      </View>

      {mode === 'list' ? (
        <FlatList
          data={items}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md as unknown as number }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <PharmacyCard item={item} />}
        />
      ) : (
        <PharmacyMap pharmacies={items} userLocation={userLocation} />
      )}
    </View>
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
      {/* Indicateur coloré à gauche */}
      <View style={[styles.cardAccent, item.is_on_duty_now && styles.cardAccentActive]} />

      <View style={styles.cardBody}>
        {/* En-tête */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          {item.is_on_duty_now && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>● De garde</Text>
            </View>
          )}
        </View>

        {/* Méta */}
        <View style={styles.cardMeta}>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>📍 {item.commune}</Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>🛣 {item.distance_km.toFixed(1)} km</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable style={styles.actionPrimary} onPress={openMaps}>
            <Text style={styles.actionPrimaryText}>🗺️  Itinéraire</Text>
          </Pressable>
          {item.phone && (
            <Pressable style={styles.actionSecondary} onPress={call}>
              <Text style={styles.actionSecondaryText}>📞  Appeler</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.bg },
  loadingIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    ...shadow.md,
  },
  loadingText: { marginTop: spacing.md, color: colors.textMuted, fontSize: 15, fontWeight: '500' },
  errorTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  errorBody:  { color: colors.textMuted, textAlign: 'center', fontSize: 14, lineHeight: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  backBtn: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  backBtnText: { color: '#fff', fontWeight: '700' },

  // Intent banner
  intentBanner: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
    gap: spacing.xs as unknown as number,
    paddingHorizontal: spacing.lg, paddingVertical: 10,
    backgroundColor: colors.primaryLight,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  intentIcon: { fontSize: 14 },
  intentText: { fontSize: 13, color: colors.primaryDark, fontStyle: 'italic', flex: 1 },
  intentTag: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  intentTagText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  // Toolbar
  toolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  toolbarCount: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  toolbarCountNum: { fontWeight: '800', color: colors.text, fontSize: 16 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    padding: 3,
    borderWidth: 1, borderColor: colors.border,
  },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: radius.pill },
  toggleBtnActive: { backgroundColor: colors.primary },
  toggleBtnText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  toggleBtnTextActive: { color: '#fff' },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.sm,
  },
  cardAccent: { width: 4, backgroundColor: colors.border },
  cardAccentActive: { backgroundColor: colors.primary },
  cardBody: { flex: 1, padding: spacing.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1, marginRight: spacing.sm },
  badge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  cardMeta: { flexDirection: 'row', gap: spacing.sm as unknown as number, marginBottom: spacing.md },
  metaChip: {
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
  },
  metaChipText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: spacing.sm as unknown as number },
  actionPrimary: {
    flex: 1, backgroundColor: colors.primary,
    borderRadius: radius.md, paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  actionPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  actionSecondary: {
    flex: 1, backgroundColor: colors.bg,
    borderRadius: radius.md, paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  actionSecondaryText: { color: colors.text, fontWeight: '600', fontSize: 13 },
});
