import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, useFonts } from '@expo-google-fonts/inter';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SheetProvider } from '../components/ActionSheet';
import { AppProvider, useApp } from '../lib/store';
import { colors } from '../lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Sends signed-out people to the welcome screen, and signed-in people past it. */
function AuthGate() {
  const { api, me, ready } = useApp();
  const segments = useSegments();
  useEffect(() => {
    if (!ready) return;
    const open = ['welcome', 'sign-in', 'legal', 'terms', 'privacy', 'guidelines', 'support'].includes(segments[0] as string);
    if (!me && !open) router.replace('/welcome');
    if (me && (segments[0] === 'welcome' || segments[0] === 'sign-in')) router.replace('/');
  }, [ready, me, segments]);
  return null;
}

/** Covers the screen until we know whether someone is signed in. */
function Splash() {
  const { ready } = useApp();
  if (ready) return null;
  return <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.bg, zIndex: 10 }} />;
}

export default function RootLayout() {
  const [loaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold });
  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);
  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <SafeAreaProvider>
      <AppProvider>
        <SheetProvider>
        <StatusBar style="dark" />
        <AuthGate />
        <Splash />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="add" options={{ presentation: 'modal' }} />
          <Stack.Screen name="share/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
          <Stack.Screen name="sign-in" />
        </Stack>
        </SheetProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
