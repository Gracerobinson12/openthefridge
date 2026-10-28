import { useEffect, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { colors } from '../lib/theme';
import { Icon } from './Icon';
import { Button, Glass, T } from './ui';

const KEY = 'otf-install-dismissed';

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** On the website, invites people to add Open the Fridge to their home screen. */
export function InstallBanner() {
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);
  const [prompt, setPrompt] = useState<PromptEvent | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone;
    let dismissed = false;
    try { dismissed = localStorage.getItem(KEY) === '1'; } catch { /* storage blocked */ }
    if (standalone || dismissed) return;

    const ua = navigator.userAgent;
    const isIos = /iPhone|iPad|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document);
    if (isIos) {
      setIos(true);
      setShow(true);
      return;
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as PromptEvent);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (!show) return null;
  const dismiss = () => {
    setShow(false);
    try { localStorage.setItem(KEY, '1'); } catch { /* storage blocked */ }
  };

  return (
    <Glass radius={20} strong style={{ padding: 12, paddingLeft: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <T w="bold" size={14}>Put the Fridge on your home screen</T>
        {ios ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <T size={12} color={colors.ink2}>Tap </T>
            <Icon name="share" size={14} color={colors.ink2} strokeWidth={2} />
            <T size={12} color={colors.ink2}> Share, then “Add to Home Screen”.</T>
          </View>
        ) : (
          <T size={12} color={colors.ink2}>Opens full-screen like a real app.</T>
        )}
      </View>
      {!ios && prompt ? (
        <Button small title="Install" onPress={async () => { await prompt.prompt(); await prompt.userChoice; dismiss(); }} />
      ) : null}
      <Pressable onPress={dismiss} accessibilityRole="button" accessibilityLabel="Dismiss" hitSlop={10}
        style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.tintSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="close" size={12} strokeWidth={2.8} />
      </Pressable>
    </Glass>
  );
}
