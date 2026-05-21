import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { colors, shadow, spacing } from '../theme';

const TABS = [
  { icon: '⊞', label: 'Accueil',  href: '/' as const },
  { icon: '◎', label: 'Recherche', href: '/results' as const },
  { icon: '♡',  label: 'Favoris',  href: '/' as const },
  { icon: '◉',  label: 'Profil',   href: '/profile' as const },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const active = path === tab.href || (tab.href === '/' && path === '/index');
        return (
          <Pressable
            key={tab.label}
            style={styles.tab}
            onPress={() => router.push(tab.href as any)}
          >
            <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
              <Text style={[styles.icon, active && styles.iconActive]}>{tab.icon}</Text>
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...shadow.md,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4 as unknown as number },
  iconWrap: {
    width: 40, height: 40,
    borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: colors.primaryLight },
  icon: { fontSize: 20, color: colors.textMuted },
  iconActive: { color: colors.primary },
  label: { fontSize: 10, color: colors.textMuted, fontWeight: '500' },
  labelActive: { color: colors.primary, fontWeight: '700' },
});
