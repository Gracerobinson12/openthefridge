import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, useFonts } from '@expo-google-fonts/inter';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '../lib/store';
import { colors } from '../lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Sends signed-out people to the sign-in screen (live mode only). */
function AuthGate() {
  const { api, me, ready } = useApp();
  const segments = useSegments();
  useEffect(() => {
    if (!ready || api.mode === 'demo') return;
    const onSignIn = segments[0] === 'sign-in';
    if (!me && !onSignIn) router.replace('/sign-in');
    if (me && onSignIn) router.replace('/');
  }, [ready, me, segments, api.mode]);
  return null;
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
        <StatusBar style="dark" />
        <AuthGate />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="add" options={{ presentation: 'modal' }} />
          <Stack.Screen name="share/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="sign-in" options={{ animation: 'fade' }} />
        </Stack>
      </AppProvider>
    </SafeAreaProvider>
  );
}
