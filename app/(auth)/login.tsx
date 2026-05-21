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
import { colors, radius, shadow, spacing } from '../../src/theme';

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPwd, setShowPwd]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [googleLoading, setGoogle]  = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) { setError('Remplis tous les champs.'); return; }
    setLoading(true); setError(null);
    const err = await signIn(email.trim(), password);
    setLoading(false);
    if (err) setError(err); else router.replace('/');
  };

  const handleGoogle = async () => {
    setGoogle(true); setError(null);
    const err = await signInWithGoogle();
    setGoogle(false);
    if (err) setError(err); else router.replace('/');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        {/* ── Logo ── */}
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>✚</Text>
          </View>
        </View>

        {/* ── Titre ── */}
        <Text style={styles.title}>Bienvenue sur{'\n'}SOS Pharma</Text>
        <Text style={styles.subtitle}>Connectez-vous pour accéder à votre compte médical sécurisé</Text>

        {/* ── Erreur ── */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* ── Email ── */}
        <View style={styles.inputWrap}>
          <View style={styles.inputIcon}><Text style={styles.inputIconText}>✉</Text></View>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
        </View>

        {/* ── Mot de passe ── */}
        <View style={styles.inputWrap}>
          <View style={styles.inputIcon}><Text style={styles.inputIconText}>🔒</Text></View>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPwd}
            autoComplete="current-password"
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            onSubmitEditing={handleLogin}
            returnKeyType="done"
          />
          <Pressable onPress={() => setShowPwd(v => !v)} style={styles.eyeBtn}>
            <Text style={styles.inputIconText}>{showPwd ? '👁' : '🙈'}</Text>
          </Pressable>
        </View>

        {/* ── Connexion ── */}
        <Pressable
          style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.88 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnPrimaryText}>Se connecter</Text>
          }
        </Pressable>

        {/* ── Divider ── */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou continuer avec</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* ── Google ── */}
        <Pressable
          style={({ pressed }) => [styles.btnGoogle, pressed && { opacity: 0.85 }]}
          onPress={handleGoogle}
          disabled={googleLoading}
        >
          {googleLoading
            ? <ActivityIndicator color={colors.text} />
            : <>
                <Text style={styles.googleLogo}>G</Text>
                <Text style={styles.btnGoogleText}>Continuer avec Google</Text>
              </>
          }
        </Pressable>

        {/* ── Inscription ── */}
        <Text style={styles.footer}>
          Pas encore de compte ?{' '}
          <Link href="/(auth)/register" style={styles.link}>S'inscrire</Link>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  container: { paddingHorizontal: spacing.xl, paddingTop: 60, paddingBottom: spacing.xxl },

  logoWrap: { alignItems: 'center', marginBottom: spacing.xl },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    ...shadow.md,
  },
  logoText: { fontSize: 36, color: colors.primary },

  title: {
    fontSize: 28, fontWeight: '800', color: colors.text,
    textAlign: 'center', lineHeight: 36, marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14, color: colors.textMuted, textAlign: 'center',
    lineHeight: 20, marginBottom: spacing.xl,
  },

  errorBox: {
    backgroundColor: '#FEE2E2', borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.md,
  },
  errorText: { color: '#B91C1C', fontSize: 14 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.border,
    marginBottom: spacing.md,
    paddingRight: spacing.md,
    ...shadow.sm,
  },
  inputIcon: {
    width: 48, alignItems: 'center', justifyContent: 'center',
  },
  inputIconText: { fontSize: 16 },
  input: {
    flex: 1, paddingVertical: 15,
    fontSize: 15, color: colors.text,
  },
  eyeBtn: { padding: spacing.xs },

  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadow.md,
  },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: spacing.sm, fontSize: 13, color: colors.textMuted },

  btnGoogle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    paddingVertical: 15,
    borderWidth: 1.5, borderColor: colors.border,
    gap: spacing.sm as unknown as number,
    marginBottom: spacing.xl,
    ...shadow.sm,
  },
  googleLogo: { fontSize: 16, fontWeight: '900', color: '#4285F4' },
  btnGoogleText: { fontSize: 15, fontWeight: '600', color: colors.text },

  footer: { textAlign: 'center', color: colors.textMuted, fontSize: 14 },
  link: { color: colors.primary, fontWeight: '700' },
});
