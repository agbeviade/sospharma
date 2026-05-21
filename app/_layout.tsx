import * as WebBrowser from 'expo-web-browser';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/lib/auth';
import { colors } from '../src/theme';

// Required for OAuth redirect handling on web/Android
WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'SOS Pharma' }} />
        <Stack.Screen name="results" options={{ title: 'Pharmacies de garde' }} />
        <Stack.Screen name="profile" options={{ title: 'Mon profil' }} />
        <Stack.Screen name="admin" options={{ title: 'Administration' }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
