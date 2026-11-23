import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Backdrop, T } from '../components/ui';
import { LEGAL } from '../lib/legal';
import { colors, font } from '../lib/theme';

export default function About() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Backdrop variant="peach" />
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: insets.top + 40, gap: 16, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
        <T w="heavy" size={30}>About {LEGAL.appName}</T>
        <T size={16} style={{ lineHeight: 24 }} color={colors.ink2}>
          {LEGAL.appName} is a recipe-sharing app where you save, write, and share recipes with your
          friends and family — pull a recipe straight from a TikTok or YouTube video, build one from
          your own handwritten notes, or just type it in by hand, then share it to the Fridge or to a
          private group.
        </T>
        <T w="bold" size={18} style={{ marginTop: 8 }}>Who makes {LEGAL.appName}</T>
        <T size={16} style={{ lineHeight: 24 }} color={colors.ink2}>
          {LEGAL.appName} is built and operated by Grace Robinson, founder of {LEGAL.owner}, a
          company registered in {LEGAL.state}.
        </T>
        <T w="bold" size={18} style={{ marginTop: 8 }}>Contact</T>
        <T size={16} style={{ lineHeight: 24 }} color={colors.ink2}>
          Questions, feedback, or support requests: {LEGAL.contactEmail}
        </T>
      </ScrollView>
    </View>
  );
}