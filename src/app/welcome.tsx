import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { Backdrop, Button, Glass, T } from '../components/ui';
import { useInstall } from '../lib/install';
import { categoryStyle, CATEGORIES, colors } from '../lib/theme';

const ICON = Platform.OS === 'web' ? { uri: '/icons/icon-512.png' } : require('../../assets/icon.png');

/** First screen for signed-out visitors: what the app is, install it, sign up or log in. */
export default function Welcome() {
  const insets = useSafeAreaInsets();
  const { installed, ios, canPrompt, install } = useInstall();
  const [showIosHelp, setShowIosHelp] = useState(false);
  const showInstall = Platform.OS === 'web' && !installed && (ios || canPrompt);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Backdrop variant="pink" />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 28, paddingHorizontal: 24, maxWidth: 480, width: '100%', alignSelf: 'center', gap: 28 }}>
        <View style={{ alignItems: 'center', gap: 18 }}>
          <Image source={ICON} accessibilityIgnoresInvertColors style={{ width: 112, height: 112, borderRadius: 28, boxShadow: '0px 18px 40px rgba(40,25,70,0.18)' }} />
          <View style={{ alignItems: 'center', gap: 8 }}>
            <T w="heavy" size={40} accessibilityRole="header" style={{ textAlign: 'center' }}>Open the Fridge</T>
            <T size={17} color={colors.ink2} style={{ textAlign: 'center', lineHeight: 24 }}>
              Pin your recipes, see what everyone's cooking, and share with your people.
            </T>
          </View>
        </View>

        {/* Category magnets, a little preview of the Fridge */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }} aria-hidden>
          {CATEGORIES.map((c, i) => (
            <Glass key={c} radius={18} strong style={{ height: 36, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 7, transform: [{ rotate: `${[-3, 2, -1, 3, -2][i]}deg` }] }}>
              <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: categoryStyle[c].dot }} />
              <T w="semibold" size={14}>{c}</T>
            </Glass>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <View style={{ gap: 10 }}>
          {showInstall ? (
            <Glass radius={24} strong style={{ padding: 14, gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="plus" size={20} color={colors.white} strokeWidth={2.4} />
                </View>
                <View style={{ flex: 1 }}>
                  <T w="bold" size={15}>Get the app</T>
                  <T size={13} color={colors.ink2}>Add it to your home screen. It opens full-screen, like a real app.</T>
                </View>
              </View>
              <Button
                title={ios ? 'How to add to Home Screen' : 'Install Open the Fridge'}
                icon={ios ? 'share' : undefined}
                onPress={async () => (ios ? setShowIosHelp(!showIosHelp) : install())}
              />
              {ios && showIosHelp ? (
                <View style={{ gap: 8, paddingHorizontal: 4 }}>
                  {[
                    ['1', 'Open this page in Safari'],
                    ['2', 'Tap the Share button at the bottom of the screen'],
                    ['3', 'Scroll down, tap “Add to Home Screen”, then Add'],
                    ['4', 'Open the Fridge icon from your home screen'],
                  ].map(([n, text]) => (
                    <View key={n} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                      <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
                        <T w="bold" size={12} color={colors.white}>{n}</T>
                      </View>
                      <T size={14} style={{ flex: 1 }}>{text}</T>
                    </View>
                  ))}
                </View>
              ) : null}
            </Glass>
          ) : null}

          <Button title="Create an account" onPress={() => router.push({ pathname: '/sign-in', params: { mode: 'up' } })} />
          <Button title="Log in" variant="soft" onPress={() => router.push({ pathname: '/sign-in', params: { mode: 'in' } })} />
          <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 14, paddingTop: 6 }}>
            {([['Terms', '/terms'], ['Privacy', '/privacy'], ['Guidelines', '/guidelines'], ['Help', '/support']] as const).map(([label, href]) => (
              <Pressable key={label} onPress={() => router.push(href)} accessibilityRole="link" hitSlop={6}>
                <T w="semibold" size={12} color={colors.ink3}>{label}</T>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
