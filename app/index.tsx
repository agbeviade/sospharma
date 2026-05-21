import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useAuth } from '../src/lib/auth';
import { getCurrentLocation } from '../src/lib/location';
import { parseSearch } from '../src/lib/ai-search';
import { colors, radius, shadow, spacing } from '../src/theme';
import BottomNav from '../src/components/BottomNav';

const QUICK_COMMUNES = ['Cocody', 'Yopougon', 'Abobo', 'Plateau', 'Marcory', 'Treichville', 'Adjamé', 'Port-Bouët'];
const AI_ENABLED = !!process.env.EXPO_PUBLIC_ANTHROPIC_KEY;

export default function Home() {
  const { user } = useAuth();
  const [query, setQuery]    = useState('');
  const [selected, setSelected] = useState('Cocody');
  const [gpsLoading, setGps] = useState(false);
  const [aiLoading, setAi]   = useState(false);

  const goNearMe = async () => {
    setGps(true);
    try {
      const loc = await getCurrentLocation();
      router.push({ pathname: '/results', params: { lat: String(loc.latitude), lng: String(loc.longitude) } });
    } finally { setGps(false); }
  };

  const goCommune = (c: string) => {
    setSelected(c);
    router.push({ pathname: '/results', params: { commune: c } });
  };

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return goNearMe();
    setAi(true);
    try {
      const intent = await parseSearch(q);
      const base = { commune: intent.commune ?? '', medication: intent.medication ?? '', aiQuery: q, aiSource: intent.source };
      if (intent.useLocation) {
        const loc = await getCurrentLocation();
        router.push({ pathname: '/results', params: { ...base, lat: String(loc.latitude), lng: String(loc.longitude) } });
      } else {
        router.push({ pathname: '/results', params: base });
      }
    } finally { setAi(false); }
  };

  const loading = gpsLoading || aiLoading;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Blob décoratif ── */}
        <View style={styles.blob} />

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonsoir {user?.email?.split('@')[0] ?? 'David'} 👋</Text>
            <Text style={styles.heroTitle}>Trouvez une{'\n'}pharmacie de garde</Text>
          </View>
          <Pressable
            style={styles.avatarBtn}
            onPress={() => router.push(user ? '/profile' : '/(auth)/login')}
          >
            <Text style={styles.avatarText}>{user ? '👤' : '🔑'}</Text>
          </Pressable>
        </View>

        {/* ── Barre de recherche ── */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Rechercher une commune..."
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              editable={!loading}
            />
            {aiLoading && <ActivityIndicator color={colors.primary} size="small" />}
          </View>
          <Pressable style={[styles.gpsBtn, gpsLoading && { opacity: 0.7 }]} onPress={goNearMe} disabled={loading}>
            {gpsLoading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.gpsBtnText}>📍</Text>
            }
          </Pressable>
        </View>

        {/* ── Chips communes ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {QUICK_COMMUNES.map((c) => (
            <Pressable
              key={c}
              style={[styles.chip, selected === c && styles.chipActive]}
              onPress={() => goCommune(c)}
              disabled={loading}
            >
              <Text style={[styles.chipText, selected === c && styles.chipTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Action Section ── */}
        <Text style={styles.sectionTitle}>Action Section</Text>
        <View style={styles.actionGrid}>
          <Pressable style={styles.actionCard} onPress={goNearMe} disabled={loading}>
            <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
              <Text style={styles.actionIconText}>📍</Text>
            </View>
            <Text style={styles.actionLabel}>Pharmacies{'\n'}proches</Text>
            <Text style={styles.actionSub}>Localization GPS</Text>
          </Pressable>
          <Pressable style={styles.actionCard} onPress={() => goCommune(selected)} disabled={loading}>
            <View style={[styles.actionIcon, { backgroundColor: colors.successLight }]}>
              <Text style={styles.actionIconText}>✚</Text>
            </View>
            <Text style={styles.actionLabel}>Pharmacies{'\n'}ouvertes</Text>
            <Text style={styles.actionSub}>Green accent</Text>
          </Pressable>
        </View>

        {/* ── Map teaser ── */}
        <Pressable style={styles.mapTeaser} onPress={goNearMe}>
          <View style={styles.mapBg}>
            <Text style={styles.mapEmoji}>🗺️</Text>
          </View>
          <View style={styles.mapPopup}>
            <Text style={styles.mapPopupTitle}>3 pharmacies de garde proches</Text>
            <Text style={styles.mapPopupBtn}>Voir maintenant →</Text>
          </View>
        </Pressable>

        {AI_ENABLED && <Text style={styles.aiTag}>✨ Recherche IA activée</Text>}
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { paddingBottom: spacing.lg },

  blob: {
    position: 'absolute', top: -60, right: -60,
    width: 220, height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(79,123,247,0.10)',
  },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 52, paddingBottom: spacing.xl,
  },
  greeting: { fontSize: 14, color: colors.textMuted, fontWeight: '500', marginBottom: 4 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: colors.text, lineHeight: 36 },
  avatarBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
    ...shadow.sm,
  },
  avatarText: { fontSize: 20 },

  // Search
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm as unknown as number,
    marginBottom: spacing.lg,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    gap: spacing.sm as unknown as number,
    ...shadow.sm,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  gpsBtn: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...shadow.md,
  },
  gpsBtnText: { fontSize: 20 },

  // Chips
  chipsRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm as unknown as number,
    marginBottom: spacing.xl,
  },
  chip: {
    backgroundColor: '#fff',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: '#fff' },

  // Section
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
  },

  // Action cards
  actionGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md as unknown as number,
    marginBottom: spacing.xl,
  },
  actionCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.sm,
  },
  actionIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  actionIconText: { fontSize: 22 },
  actionLabel: { fontSize: 14, fontWeight: '700', color: colors.text, lineHeight: 20, marginBottom: 4 },
  actionSub: { fontSize: 11, color: colors.textMuted },

  // Map teaser
  mapTeaser: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.sm,
  },
  mapBg: {
    height: 140, backgroundColor: '#C7D7F5',
    alignItems: 'center', justifyContent: 'center',
  },
  mapEmoji: { fontSize: 48 },
  mapPopup: {
    position: 'absolute', bottom: spacing.md, left: spacing.md,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadow.md,
  },
  mapPopupTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  mapPopupBtn: { fontSize: 12, color: colors.primary, fontWeight: '600', marginTop: 2 },

  aiTag: { fontSize: 11, color: colors.primary, fontWeight: '600', textAlign: 'center', marginTop: spacing.md },
});
