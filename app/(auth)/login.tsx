import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../../src/lib/auth';
import { colors, radius, spacing } from '../../src/theme';

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Remplis tous les champs.');
      return;
    }
    setLoading(true);
    setError(null);
    const err = await signIn(email.trim(), password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      router.replace('/');
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError(null);
    const err = await signInWithGoogle();
    setGoogleLoading(false);
    if (err) setError(err);
    else router.replace('/');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Bon retour 👋</Text>

          {error && <Text style={styles.error}>{error}</Text>}

          <Text style={styles.label}>Adresse e-mail</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="vous@exemple.com"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={handleLogin}
            returnKeyType="done"
          />

          <Pressable
            style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && { opacity: 0.85 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnPrimaryText}>Se connecter</Text>
            )}
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            style={({ pressed }) => [styles.btn, styles.btnOutline, pressed && { opacity: 0.75 }]}
            onPress={handleGoogle}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.btnOutlineText}>🔵 Continuer avec Google</Text>
            )}
          </Pressable>
        </View>

        <Text style={styles.footer}>
          Pas encore de compte ?{' '}
          <Link href="/(auth)/register" style={styles.link}>
            S'inscrire
          </Link>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingTop: spacing.xl },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: spacing.lg },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text,
    marginBottom: spacing.md,
  },
  btn: {
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnOutline: { borderWidth: 1, borderColor: colors.border },
  btnOutlineText: { color: colors.text, fontWeight: '600', fontSize: 15 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: spacing.sm, color: colors.textMuted, fontSize: 13 },
  error: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: 14,
  },
  footer: { textAlign: 'center', marginTop: spacing.xl, color: colors.textMuted },
  link: { color: colors.primary, fontWeight: '700' },
});
