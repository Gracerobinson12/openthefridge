import { router } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '../components/Screen';
import { Glass, IconButton, T } from '../components/ui';
import { colors } from '../lib/theme';

// Starting-point terms and privacy text. Have it reviewed before a public launch,
// and replace [CONTACT EMAIL] with a real address.
const SECTIONS: [string, string][] = [
  ['What Open the Fridge is', 'Open the Fridge lets you save recipes, share them with groups you choose, and see recipes other people post.'],
  ['Your account', 'You need an email and password to use the app. Keep your password private. You can delete your account any time in Profile, which removes your profile, recipes, comments and groups you own.'],
  ['What you post', 'You own the recipes and photos you post. By posting, you let Open the Fridge show them to the people you share with (everyone on the Fridge, or only your groups). Only post photos and text you have the right to share.'],
  ['Be kind', 'No harassment, hate, spam, nudity, or anything illegal. You can report a recipe or block a person from the “…” menu on any recipe. We may remove posts or accounts that break these rules.'],
  ['What we collect', 'Your email, username, display name, profile photo, the recipes, photos and comments you post, and who you follow and which groups you are in. We use this only to run the app.'],
  ['Where it is stored', 'Data is stored with our hosting provider (Supabase). We do not sell your data or show ads.'],
  ['TikTok', 'Posting slides to TikTok only happens when you choose to, and only after you connect your TikTok account.'],
  ['Contact', 'Questions or deletion requests: [CONTACT EMAIL].'],
];

export default function Legal() {
  return (
    <Screen glow="violet" bottomSpace={40}>
      <IconButton icon="back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))} />
      <T w="heavy" size={30} accessibilityRole="header">Terms & Privacy</T>
      <Glass radius={22} style={{ padding: 18, gap: 16 }}>
        {SECTIONS.map(([h, body]) => (
          <View key={h} style={{ gap: 4 }}>
            <T w="bold" size={16}>{h}</T>
            <T size={14} color={colors.ink2} style={{ lineHeight: 21 }}>{body}</T>
          </View>
        ))}
      </Glass>
    </Screen>
  );
}
