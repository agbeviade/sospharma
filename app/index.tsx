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
import { colors, radius, spacing } from '../src/theme';

const QUICK_COMMUNES = ['Cocody', 'Yopougon', 'Abobo', 'Plateau', 'Marcory', 'Treichville'];

const AI_ENABLED = !!process.env.EXPO_PUBLIC_ANTHROPIC_KEY;

export default function Home() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const goNearMe = async () => {
    setGpsLoading(true);
    try {
      const loc = await getCurrentLocation();
      router.push({
        pathname: '/results',
        params: { lat: String(loc.latitude), lng: String(loc.longitude), source: loc.source },
      });
    } finally {
      setGpsLoading(false);
    }
  };

  const goCommune = (commune: string) =>
    router.push({ pathname: '/results', params: { commune } });

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return goNearMe();

    setAiLoading(true);
    try {
      const intent = await parseSearch(q);

      if (intent.useLocation) {
        const loc = await getCurrentLocation();
        router.push({
          pathname: '/results',
          params: {
            lat: String(loc.latitude),
            lng: String(loc.longitude),
            commune: intent.commune ?? '',
            medication: intent.medication ?? '',
            aiQuery: q,
            aiSource: intent.source,
          },
        });
      } else {
        router.push({
          pathname: '/results',
          params: {
            commune: intent.commune ?? '',
            medication: intent.medication ?? '',
            aiQuery: q,
            aiSource: intent.source,
          },
        });
      }
    } finally {
      setAiLoading(false);
    }
  };

  const loading = gpsLoading || aiLoading;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={() => router.push(user ? '/profile' : '/(auth)/login')}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, paddingRight: 4 })}
            >
              <Text style={{ color: '#fff', fontSize: 22 }}>{user ? '👤' : '🔑'}</Text>
            </Pressable>
          ),
        }}
      />

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Besoin d'une pharmacie ?</Text>
        <Text style={styles.heroSubtitle}>
          Trouve la pharmacie de garde la plus proche en un clic.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={goNearMe}
        disabled={loading}
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
      >
        {gpsLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.ctaText}>📍 Pharmacies de garde près de moi</Text>
        )}
      </Pressable>

      {/* Barre de recherche IA */}
      <View style={styles.searchWrapper}>
        <View style={[styles.searchBox, aiLoading && styles.searchBoxActive]}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={
              AI_ENABLED
                ? 'Ex : pharmacie de garde Cocody, ibuprofène Yopougon…'
                : 'Ex : pharmacie de garde Cocody…'
            }
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            editable={!loading}
          />
          <Pressable
            style={[styles.searchBtn, loading && { opacity: 0.6 }]}
            onPress={handleSearch}
            disabled={loading}
          >
            {aiLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.searchBtnText}>→</Text>
            )}
          </Pressable>
        </View>
        {AI_ENABLED && (
          <Text style={styles.aiTag}>✨ Recherche IA activée</Text>
        )}
        {aiLoading && (
          <Text style={styles.aiLoading}>Analyse de votre recherche…</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Communes d'Abidjan</Text>
      <View style={styles.chips}>
        {QUICK_COMMUNES.map((c) => (
          <Pressable key={c} style={styles.chip} onPress={() => goCommune(c)} disabled={loading}>
            <Text style={styles.chipText}>{c}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.footer}>
        SOS Pharma — {QUICK_COMMUNES.length}+ communes couvertes à Abidjan
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  hero: { marginTop: spacing.lg, marginBottom: spacing.xl },
  heroTitle: { fontSize: 26, fontWeight: '800', color: colors.text },
  heroSubtitle: { fontSize: 15, color: colors.textMuted, marginTop: spacing.xs },
  cta: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  searchWrapper: { marginBottom: spacing.xl },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: spacing.md,
    overflow: 'hidden',
  },
  searchBoxActive: { borderColor: colors.primary },
  input: { flex: 1, paddingVertical: spacing.md, fontSize: 15, color: colors.text },
  searchBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  searchBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  aiTag: { fontSize: 11, color: colors.primary, fontWeight: '600', marginTop: spacing.xs, marginLeft: 2 },
  aiLoading: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs, marginLeft: 2, fontStyle: 'italic' },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm as unknown as number },
  chip: {
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipText: { color: colors.text, fontWeight: '600' },
  footer: { marginTop: spacing.xxl, fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});
