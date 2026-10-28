import { router, usePathname, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadow } from '../lib/theme';
import { Icon, type IconName } from './Icon';
import { Glass, T } from './ui';

const TABS: { href: Href; path: string; label: string; icon: IconName }[] = [
  { href: '/', path: '/', label: 'Fridge', icon: 'fridge' },
  { href: '/tin', path: '/tin', label: 'My Tin', icon: 'tin' },
  { href: '/groups', path: '/groups', label: 'Groups', icon: 'groups' },
  { href: '/profile', path: '/profile', label: 'Profile', icon: 'profile' },
];

/** Floating glass tab bar with the + button in the middle. */
export function TabBar() {
  const path = usePathname();
  const insets = useSafeAreaInsets();
  const tab = (t: (typeof TABS)[number]) => {
    const on = path === t.path;
    return (
      <Pressable key={t.label} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => router.navigate(t.href)}
        style={{ flex: 1, alignItems: 'center', gap: 3, paddingVertical: 8, borderRadius: 26, backgroundColor: on ? 'rgba(20,17,26,0.08)' : 'transparent' }}>
        <Icon name={t.icon} color={on ? colors.ink : '#5B5566'} />
        <T w="semibold" size={10} color={on ? colors.ink : '#5B5566'}>{t.label}</T>
      </Pressable>
    );
  };
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(insets.bottom, 18) }}>
      <Glass radius={34} strong style={{ height: 68, boxShadow: shadow.float, maxWidth: 520, width: '100%', alignSelf: 'center' }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 }}>
          {tab(TABS[0])}
          {tab(TABS[1])}
          <Pressable accessibilityRole="button" accessibilityLabel="Add a recipe" onPress={() => router.push('/add')} style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', boxShadow: shadow.button }}>
              <Icon name="plus" color={colors.white} strokeWidth={2.4} />
            </View>
          </Pressable>
          {tab(TABS[2])}
          {tab(TABS[3])}
        </View>
      </Glass>
    </View>
  );
}
