import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/lib/auth';
import { fetchIsAdmin } from '../src/lib/admin';
import { colors, radius, spacing } from '../src/theme';

export default function Profile() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) fetchIsAdmin().then(setIsAdmin);
  }, [user]);

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.notLoggedTitle}>Tu n'es pas connecté</Text>
        <Pressable style={styles.btn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.btnText}>Se connecter</Text>
        </Pressable>
      </View>
    );
  }

  const handleSignOut = async () => {
    setLoading(true);
    await signOut();
    setLoading(false);
    router.replace('/');
  };

  const initials = user.email?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.avatarWrapper}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.email}>{user.email}</Text>
        <Text style={styles.since}>
          Membre depuis{' '}
          {new Date(user.created_at).toLocaleDateString('fr-FR', {
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compte</Text>
        <View style={styles.card}>
          <Row label="Email" value={user.email ?? '—'} />
          <Row label="Identifiant" value={user.id.slice(0, 8) + '…'} last />
        </View>
      </View>

      {isAdmin && (
        <Pressable
          style={({ pressed }) => [styles.adminBtn, pressed && { opacity: 0.85 }]}
          onPress={() => router.push('/admin')}
        >
          <Text style={styles.adminBtnText}>⚙️ Administration</Text>
        </Pressable>
      )}

      <Pressable
        style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.8 }]}
        onPress={handleSignOut}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <Text style={styles.logoutText}>Se déconnecter</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  notLoggedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  avatarWrapper: { alignItems: 'center', marginVertical: spacing.xl },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '800' },
  email: { fontSize: 16, fontWeight: '700', color: colors.text },
  since: { marginTop: 4, fontSize: 13, color: colors.textMuted },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { fontSize: 14, color: colors.textMuted },
  rowValue: { fontSize: 14, fontWeight: '600', color: colors.text, maxWidth: '60%' },
  btn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  btnText: { color: '#fff', fontWeight: '700' },
  logoutBtn: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  logoutText: { color: colors.accent, fontWeight: '700', fontSize: 15 },
  adminBtn: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  adminBtnText: { color: colors.text, fontWeight: '700', fontSize: 15 },
});
