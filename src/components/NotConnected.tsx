import { View } from 'react-native';
import { colors } from '../lib/theme';
import { T } from './ui';

/** Shown on a live build that was made without the Supabase settings, instead of fake test data. */
export function NotConnected() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 10 }}>
      <T w="heavy" size={26} style={{ textAlign: 'center' }}>Open the Fridge isn’t connected yet</T>
      <T size={15} color={colors.ink2} style={{ textAlign: 'center', lineHeight: 22, maxWidth: 420 }}>
        This build is missing its database settings. In Vercel, add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY under
        Settings → Environment Variables, then redeploy.
      </T>
    </View>
  );
}
