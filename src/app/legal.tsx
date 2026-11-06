import { router, type Href } from 'expo-router';
import { View } from 'react-native';
import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { Glass, IconButton, Row, T } from '../components/ui';
import { colors } from '../lib/theme';

const LINKS: [string, Href][] = [
  ['Terms of Service', '/terms'],
  ['Privacy Policy', '/privacy'],
  ['Community Guidelines', '/guidelines'],
  ['Help & Support', '/support'],
];

export default function Legal() {
  return (
    <Screen glow="violet" bottomSpace={40}>
      <IconButton icon="back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      <T w="heavy" size={30} accessibilityRole="header">Terms & Privacy</T>
      <Glass radius={22}>
        {LINKS.map(([label, href], i) => (
          <Row key={label} last={i === LINKS.length - 1} onPress={() => router.push(href)}>
            <T w="semibold" size={15} style={{ flex: 1 }}>{label}</T>
            <View><Icon name="chevron" size={16} color={colors.ink3} strokeWidth={2.2} /></View>
          </Row>
        ))}
      </Glass>
    </Screen>
  );
}
