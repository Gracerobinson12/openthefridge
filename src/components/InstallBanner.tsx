import { useEffect, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useInstall } from '../lib/install';
import { colors } from '../lib/theme';
import { Icon } from './Icon';
import { Button, Glass, T } from './ui';

const KEY = 'otf-install-dismissed';

/** On the website, a small reminder on the Fridge to add the app to the home screen. */
export function InstallBanner() {
  const { installed, ios, canPrompt, install } = useInstall();
  const [dismissed, setDismissed] = useState(true);
  useEffect(() => {
    try { setDismissed(localStorage.getItem(KEY) === '1'); } catch { setDismissed(false); }
  }, []);
  if (Platform.OS !== 'web' || installed || dismissed || !(ios || canPrompt)) return null;
  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(KEY, '1'); } catch { /* storage blocked */ }
  };
  return (
    <Glass radius={20} strong style={{ padding: 12, paddingLeft: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <T w="bold" size={14}>Put the Fridge on your home screen</T>
        {ios ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <T size={12} color={colors.ink2}>In Safari tap </T>
            <Icon name="share" size={14} color={colors.ink2} strokeWidth={2} />
            <T size={12} color={colors.ink2}> Share, then “Add to Home Screen”.</T>
          </View>
        ) : (
          <T size={12} color={colors.ink2}>Opens full-screen like a real app.</T>
        )}
      </View>
      {!ios ? <Button small title="Install" onPress={async () => { if (await install()) dismiss(); }} /> : null}
      <Pressable onPress={dismiss} accessibilityRole="button" accessibilityLabel="Dismiss" hitSlop={10}
        style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.tintSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="close" size={12} strokeWidth={2.8} />
      </Pressable>
    </Glass>
  );
}
