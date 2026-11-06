import { router } from 'expo-router';
import { Linking, Pressable, View } from 'react-native';
import { LEGAL, type LegalDoc } from '../lib/legal';
import { colors } from '../lib/theme';
import { Screen } from './Screen';
import { Glass, IconButton, T } from './ui';

/** Renders a Terms / Privacy / Guidelines / Support page from the text in src/lib/legal.ts. */
export function LegalPage({ doc, showDate = true }: { doc: LegalDoc; showDate?: boolean }) {
  return (
    <Screen glow="violet" bottomSpace={40}>
      <IconButton icon="back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      <View style={{ gap: 6 }}>
        <T w="heavy" size={30} accessibilityRole="header">{doc.title}</T>
        {showDate ? <T size={13} color={colors.ink3}>Effective {LEGAL.effectiveDate}</T> : null}
      </View>
      <T size={15} color={colors.ink2} style={{ lineHeight: 22 }}>{doc.intro}</T>
      <Glass radius={22} style={{ padding: 18, gap: 18 }}>
        {doc.sections.map((s) => (
          <View key={s.h} style={{ gap: 6 }}>
            <T w="bold" size={16}>{s.h}</T>
            {s.p.map((p, i) => (
              <T key={i} size={14} color={colors.ink2} style={{ lineHeight: 21 }}>{p}</T>
            ))}
          </View>
        ))}
      </Glass>
      <Pressable onPress={() => Linking.openURL(`mailto:${LEGAL.contactEmail}`)} accessibilityRole="link" style={{ alignItems: 'center', padding: 8 }}>
        <T w="semibold" size={14} color={colors.accent}>Email {LEGAL.contactEmail}</T>
      </Pressable>
    </Screen>
  );
}
