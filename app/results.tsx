import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Stack } from 'expo-router';
import { fetchOnDutyPharmacies } from '../src/lib/pharmacies';
import PharmacyMap from '../src/components/PharmacyMap';
import type { PharmacyWithDistance, UserLocation } from '../src/types/pharmacy';
import { colors, radius, shadow, spacing } from '../src/theme';
import BottomNav from '../src/components/BottomNav';

const ABIDJAN_CENTER: UserLocation = { latitude: 5.3599, longitude: -4.0083, source: 'manual' };
type ViewMode = 'list' | 'map';

export default function Results() {
  const params = useLocalSearchParams<{
    lat?: string; lng?: string; commune?: string;
    medication?: string; aiQuery?: string; aiSource?: string;
  }>();
  const [items, setItems]     = useState<PharmacyWithDistance[]>([]);
  const [loading, setLoad]    = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [mode, setMode]       = useState<ViewMode>('list');
  const [filterText, setFilter] = useState(params.commune ?? '');

  const userLocation: UserLocation = {
    latitude:  params.lat ? Number(params.lat) : ABIDJAN_CENTER.latitude,
    longitude: params.lng ? Number(params.lng) : ABIDJAN_CENTER.longitude,
    source: params.lat ? 'gps' : 'manual',
  };

  useEffect(() => {
    setLoad(true);
    fetchOnDutyPharmacies(userLocation, { commune: params.commune })
      .then(setItems)
      .catch((e) => setError(e.message ?? 'Erreur'))
      .finally(() => setLoad(false));
  }, [params.lat, params.lng, params.commune]);

  const filtered = filterText
    ? items.filter(p => p.commune.toLowerCase().includes(filterText.toLowerCase()) || p.name.toLowerCase().includes(filterText.toLowerCase()))
    : items;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Header custom ── */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Pharmacies proches</Text>
        <Pressable style={styles.filterBtn}>
          <Text style={styles.filterIcon}>⚙</Text>
        </Pressable>
      </View>

      {/* ── Barre de filtre ── */}
      <View style={styles.filterBar}>
        <View style={styles.filterInput}>
          <Text style={styles.filterSearchIcon}>🔍</Text>
          <TextInput
            value={filterText}
            onChangeText={setFilter}
            placeholder="Rechercher une commune..."
            placeholderTextColor={colors.textMuted}
            style={styles.filterTextInput}
          />
        </View>
        <View style={styles.togglePill}>
          <Pressable style={[styles.toggleBtn, mode === 'list' && styles.toggleBtnActive]} onPress={() => setMode('list')}>
            <Text style={[styles.toggleText, mode === 'list' && styles.toggleTextActive]}>≡ Liste</Text>
          </Pressable>
          <Pressable style={[styles.toggleBtn, mode === 'map' && styles.toggleBtnActive]} onPress={() => setMode('map')}>
            <Text style={[styles.toggleText, mode === 'map' && styles.toggleTextActive]}>⊞ Carte</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Recherche des pharmacies…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : mode === 'map' ? (
        <PharmacyMap pharmacies={filtered} userLocation={userLocation} />
      ) : (
        <>
          <Text style={styles.countLabel}>
            <Text style={styles.countNum}>{filtered.length}</Text>
            {' '}résultat{filtered.length > 1 ? 's' : ''}
          </Text>
          <FlatList
            data={filtered}
            keyExtractor={(p) => p.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <PharmacyCard item={item} />}
          />
        </>
      )}

      <BottomNav />
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
      {/* En-tête carte */}
      <View style={styles.cardTop}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardDist}>{item.distance_km.toFixed(1)} km</Text>
        </View>
        {item.is_on_duty_now && (
          <View style={styles.dutyBadge}>
            <View style={styles.dutyDot} />
            <Text style={styles.dutyText}>De garde</Text>
          </View>
        )}
      </View>

      {/* Adresse */}
      {item.address ? (
        <View style={styles.addressRow}>
          <Text style={styles.addressIcon}>📍</Text>
          <Text style={styles.addressText} numberOfLines={1}>{item.address}, {item.commune}</Text>
        </View>
      ) : (
        <View style={styles.addressRow}>
          <Text style={styles.addressIcon}>📍</Text>
          <Text style={styles.addressText}>{item.commune}</Text>
        </View>
      )}

      {/* Ligne ouvert */}
      <View style={styles.metaRow}>
        <Text style={styles.distIcon}>🛣</Text>
        <Text style={styles.distText}>{item.distance_km.toFixed(1)} km</Text>
        {item.is_on_duty_now && <Text style={styles.openText}>  Ouvert</Text>}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable style={styles.btnPrimary} onPress={openMaps}>
          <Text style={styles.btnPrimaryIcon}>🗺️</Text>
          <Text style={styles.btnPrimaryText}>Itinéraire</Text>
        </Pressable>
        {item.phone && (
          <Pressable style={styles.btnSecondary} onPress={call}>
            <Text style={styles.btnSecondaryIcon}>📞</Text>
            <Text style={styles.btnSecondaryText}>Appeler</Text>
          </Pressable>
        )}
      </View>

      {/* Pied de carte */}
      {item.is_on_duty_now && (
        <Text style={styles.openUntil}>Ouvert jusqu'à 08h</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  loadingText: { marginTop: spacing.md, color: colors.textMuted, fontSize: 14 },
  errorText: { color: colors.accent, fontSize: 15, textAlign: 'center' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 52, paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    ...shadow.sm,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.bg,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.sm,
  },
  backIcon: { fontSize: 18, color: colors.text, fontWeight: '600' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center' },
  filterBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  filterIcon: { fontSize: 16, color: colors.primary },

  // Filter bar
  filterBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: '#fff',
    gap: spacing.sm as unknown as number,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  filterInput: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    gap: spacing.xs as unknown as number,
  },
  filterSearchIcon: { fontSize: 14 },
  filterTextInput: { flex: 1, fontSize: 14, color: colors.text },
  togglePill: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    padding: 2,
    borderWidth: 1, borderColor: colors.border,
  },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  toggleBtnActive: { backgroundColor: colors.primary },
  toggleText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  toggleTextActive: { color: '#fff' },

  countLabel: {
    fontSize: 13, color: colors.textMuted,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  countNum: { fontWeight: '800', color: colors.text },

  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md as unknown as number },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.sm,
  },
  cardTop: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: spacing.sm,
  },
  cardTitleRow: { flex: 1, marginRight: spacing.sm },
  cardName: { fontSize: 16, fontWeight: '800', color: colors.text },
  cardDist: { fontSize: 13, color: colors.textMuted, fontWeight: '500', marginTop: 2 },
  dutyBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.successLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    gap: 4 as unknown as number,
  },
  dutyDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  dutyText: { fontSize: 12, fontWeight: '700', color: colors.successDark },

  addressRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 4 as unknown as number, marginBottom: 6,
  },
  addressIcon: { fontSize: 12 },
  addressText: { fontSize: 13, color: colors.textMuted, flex: 1 },

  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  distIcon: { fontSize: 12, marginRight: 4 },
  distText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  openText: { fontSize: 13, color: colors.success, fontWeight: '600' },

  actions: { flexDirection: 'row', gap: spacing.sm as unknown as number, marginBottom: spacing.sm },
  btnPrimary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md, paddingVertical: 11,
    gap: 6 as unknown as number,
  },
  btnPrimaryIcon: { fontSize: 14 },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnSecondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderRadius: radius.md, paddingVertical: 11,
    borderWidth: 1.5, borderColor: colors.border,
    gap: 6 as unknown as number,
  },
  btnSecondaryIcon: { fontSize: 14 },
  btnSecondaryText: { color: colors.text, fontWeight: '600', fontSize: 14 },

  openUntil: { fontSize: 12, color: colors.success, fontWeight: '600', marginTop: 4 },
});
