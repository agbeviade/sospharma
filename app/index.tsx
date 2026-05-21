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

const QUICK_COMMUNES = ['Cocody', 'Yopougon', 'Abobo', 'Plateau', 'Marcory', 'Treichville', 'Adjamé', 'Port-Bouët'];
const AI_ENABLED = !!process.env.EXPO_PUBLIC_ANTHROPIC_KEY;

export default function Home() {
  const { user } = useAuth();
  const [query, setQuery]         = useState('');
  const [gpsLoading, setGps]      = useState(false);
  const [aiLoading, setAi]        = useState(false);

  const goNearMe = async () => {
    setGps(true);
    try {
      const loc = await getCurrentLocation();
      router.push({ pathname: '/results', params: { lat: String(loc.latitude), lng: String(loc.longitude), source: loc.source } });
    } finally { setGps(false); }
  };

  const goCommune = (c: string) => router.push({ pathname: '/results', params: { commune: c } });

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
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{
        headerShown: false,
      }} />

      {/* ── Header custom ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Bonsoir 👋</Text>
          <Text style={styles.headerTitle}>SOS Pharma</Text>
        </View>
        <Pressable
          style={styles.avatar}
          onPress={() => router.push(user ? '/profile' : '/(auth)/login')}
        >
          <Text style={styles.avatarText}>{user ? '👤' : '🔑'}</Text>
        </Pressable>
      </View>

      {/* ── Hero ── */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Text style={styles.heroEmoji}>💊</Text>
        </View>
        <Text style={styles.heroTitle}>Trouvez une pharmacie{'\n'}de garde près de vous</Text>
        <Text style={styles.heroSub}>195 pharmacies disponibles à Abidjan et en Côte d'Ivoire</Text>
      </View>

      {/* ── Bouton GPS ── */}
      <Pressable
        style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.9 }]}
        onPress={goNearMe}
        disabled={loading}
      >
        {gpsLoading
          ? <ActivityIndicator color="#fff" />
          : <>
              <Text style={styles.ctaIcon}>📍</Text>
              <Text style={styles.ctaText}>Pharmacies près de moi</Text>
            </>
        }
      </Pressable>

      {/* ── Barre de recherche ── */}
      <View style={styles.searchCard}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={AI_ENABLED ? 'Ex : ibuprofène Cocody, garde Yopougon…' : 'Ex : pharmacie Cocody…'}
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          editable={!loading}
        />
        <Pressable style={[styles.searchBtn, loading && { opacity: 0.6 }]} onPress={handleSearch} disabled={loading}>
          {aiLoading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.searchBtnText}>→</Text>
          }
        </Pressable>
      </View>
      {AI_ENABLED && <Text style={styles.aiTag}>✨ Recherche IA activée</Text>}
      {aiLoading && <Text style={styles.aiLoading}>Analyse en cours…</Text>}

      {/* ── Communes ── */}
      <Text style={styles.sectionTitle}>Communes d'Abidjan</Text>
      <View style={styles.chips}>
        {QUICK_COMMUNES.map((c) => (
          <Pressable
            key={c}
            style={({ pressed }) => [styles.chip, pressed && { opacity: 0.75 }]}
            onPress={() => goCommune(c)}
            disabled={loading}
          >
            <Text style={styles.chipText}>{c}</Text>
          </Pressable>
        ))}
      </View>

      {/* ── Stats bar ── */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>195</Text>
          <Text style={styles.statLabel}>Pharmacies</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>24h</Text>
          <Text style={styles.statLabel}>Disponible</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>14</Text>
          <Text style={styles.statLabel}>Communes</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  container: { paddingBottom: spacing.xxl },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.lg,
    backgroundColor: '#fff',
  },
  headerGreeting: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 2 },
  avatar: {
    width: 42, height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 20 },

  // Hero
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  heroIcon: {
    width: 72, height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadow.md,
  },
  heroEmoji: { fontSize: 32 },
  heroTitle: {
    fontSize: 24, fontWeight: '800', color: colors.text,
    textAlign: 'center', lineHeight: 32, marginBottom: spacing.sm,
  },
  heroSub: {
    fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20,
  },

  // CTA
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    paddingVertical: 18,
    borderRadius: radius.lg,
    gap: 8,
    ...shadow.md,
  },
  ctaIcon: { fontSize: 18 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Search
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingLeft: spacing.md,
    overflow: 'hidden',
    ...shadow.sm,
  },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: colors.text },
  searchBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'stretch',
  },
  searchBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  aiTag: { fontSize: 11, color: colors.primary, fontWeight: '600', marginTop: 6, marginLeft: spacing.lg + 2 },
  aiLoading: { fontSize: 12, color: colors.textMuted, marginTop: 4, marginLeft: spacing.lg + 2, fontStyle: 'italic' },

  // Section
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginTop: spacing.xl, marginBottom: spacing.md,
    marginLeft: spacing.lg,
  },
  chips: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm as unknown as number,
  },
  chip: {
    backgroundColor: '#fff',
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    ...shadow.sm,
  },
  chipText: { color: colors.text, fontWeight: '600', fontSize: 13 },

  // Stats
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadow.sm,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2, fontWeight: '500' },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
});
