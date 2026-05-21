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

export default function Register() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirm) {
      setError('Remplis tous les champs.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }
    setLoading(true);
    setError(null);
    const err = await signUp(email.trim(), password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <View style={styles.center}>
        <Text style={styles.successIcon}>✉️</Text>
        <Text style={styles.successTitle}>Vérifie ta boîte mail</Text>
        <Text style={styles.successBody}>
          Un lien de confirmation a été envoyé à {email}.{'\n'}Clique dessus pour activer ton
          compte.
        </Text>
        <Pressable style={styles.backBtn} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.backBtnText}>Retour à la connexion</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Créer un compte</Text>

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
            autoComplete="new-password"
            placeholder="••••••••  (min. 6 caractères)"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Confirmer le mot de passe</Text>
          <TextInput
            style={styles.input}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            autoComplete="new-password"
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={handleRegister}
            returnKeyType="done"
          />

          <Pressable
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Créer mon compte</Text>
            )}
          </Pressable>
        </View>

        <Text style={styles.footer}>
          Déjà un compte ?{' '}
          <Link href="/(auth)/login" style={styles.link}>
            Se connecter
          </Link>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingTop: spacing.xl },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
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
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
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
  successIcon: { fontSize: 48, marginBottom: spacing.lg },
  successTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  successBody: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  backBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  backBtnText: { color: '#fff', fontWeight: '700' },
});
