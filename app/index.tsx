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
import { router } from 'expo-router';
import { getCurrentLocation } from '../src/lib/location';
import { colors, radius, spacing } from '../src/theme';

const QUICK_COMMUNES = ['Cocody', 'Yopougon', 'Abobo', 'Plateau', 'Marcory', 'Treichville'];

export default function Home() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const goNearMe = async () => {
    setLoading(true);
    try {
      const loc = await getCurrentLocation();
      router.push({
        pathname: '/results',
        params: {
          lat: String(loc.latitude),
          lng: String(loc.longitude),
          source: loc.source,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const goCommune = (commune: string) => {
    router.push({ pathname: '/results', params: { commune } });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Besoin d'une pharmacie ?</Text>
        <Text style={styles.heroSubtitle}>
          Trouve la pharmacie de garde la plus proche en un clic.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={goNearMe}
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.ctaText}>📍 Pharmacies de garde près de moi</Text>
        )}
      </Pressable>

      <View style={styles.searchBox}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="ex: pharmacie de garde cocody"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          returnKeyType="search"
          onSubmitEditing={() => {
            const match = QUICK_COMMUNES.find((c) =>
              query.toLowerCase().includes(c.toLowerCase()),
            );
            if (match) goCommune(match);
            else goNearMe();
          }}
        />
      </View>

      <Text style={styles.sectionTitle}>Communes d'Abidjan</Text>
      <View style={styles.chips}>
        {QUICK_COMMUNES.map((c) => (
          <Pressable key={c} style={styles.chip} onPress={() => goCommune(c)}>
            <Text style={styles.chipText}>{c}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.footer}>
        MVP — données pharmacies à connecter via Supabase.
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
  searchBox: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  input: { paddingVertical: spacing.md, fontSize: 15, color: colors.text },
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
  footer: {
    marginTop: spacing.xxl,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
