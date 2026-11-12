import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, View } from 'react-native';
import { useApp } from '../lib/store';
import { colors } from '../lib/theme';
import type { ImportedRecipe, VideoSource } from '../lib/types';
import { parseVideoLink } from '../lib/videoLink';
import { Icon } from './Icon';
import { Button, Glass, Input, T } from './ui';

export const platformName = (p?: string) => (p === 'youtube' ? 'YouTube' : p === 'tiktok' ? 'TikTok' : 'video');

/**
 * Top of the Add screen: paste a TikTok or YouTube link → the recipe fills in below.
 * Once imported it shows who made it, with a reminder to double-check.
 */
export function ImportCard({ source, partial, onImported, onClear, autoFocus }: {
  source: VideoSource | null;
  partial: boolean;
  onImported: (r: ImportedRecipe) => void;
  onClear: () => void;
  autoFocus?: boolean;
}) {
  const { api } = useApp();
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(text = link) {
    setError(null);
    const parsed = parseVideoLink(text);
    if (!parsed) return setError('That doesn’t look like a TikTok or YouTube video link.');
    setBusy(true);
    try {
      onImported(await api.importFromLink(parsed.url));
      setLink('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      setLink(text);
      if (parseVideoLink(text)) run(text);
    } catch {
      setError('Couldn’t read your clipboard. Long-press the box and choose Paste.');
    }
  }

  if (source) {
    return (
      <Glass radius={22} strong style={{ padding: 14, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={16} color={colors.white} strokeWidth={3} />
          </View>
          <View style={{ flex: 1 }}>
            <T w="bold" size={15}>Imported from {platformName(source.source_platform)}</T>
            <T size={13} color={colors.ink2} numberOfLines={1}>Recipe by {source.source_author} · we’ll credit them</T>
          </View>
          <Pressable onPress={onClear} accessibilityRole="button" hitSlop={8}>
            <T w="semibold" size={13} color={colors.accent}>Remove</T>
          </Pressable>
        </View>
        <T size={13} color={partial ? colors.heart : colors.ink2} style={{ lineHeight: 18 }}>
          {partial
            ? 'The video didn’t include everything, so some amounts or steps may be missing. Fill in the gaps below before saving.'
            : 'Double-check amounts and steps below. AI can get things wrong.'}
        </T>
      </Glass>
    );
  }

  return (
    <Glass radius={22} strong style={{ padding: 14, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="link" size={17} color={colors.white} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1 }}>
          <T w="bold" size={15}>Import from a video</T>
          <T size={13} color={colors.ink2}>Paste a TikTok or YouTube link and we’ll write out the steps.</T>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Input value={link} onChangeText={(v) => { setLink(v); setError(null); }} placeholder="tiktok.com/… or youtube.com/…"
          accessibilityLabel="Video link" autoCapitalize="none" autoCorrect={false} keyboardType="url" autoFocus={autoFocus}
          onSubmitEditing={() => run()} editable={!busy} style={{ flex: 1 }} />
        {Platform.OS === 'web' && !link ? (
          <Button title="Paste" variant="soft" small onPress={pasteFromClipboard} style={{ height: 48 }} />
        ) : null}
      </View>
      {busy ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
          <ActivityIndicator color={colors.ink} />
          <T size={13} color={colors.ink2} style={{ flex: 1 }}>Reading the video and writing out the steps… this can take up to 30 seconds.</T>
        </View>
      ) : (
        <Button title="Get the recipe" onPress={() => run()} disabled={!link.trim()} />
      )}
      {error ? <T size={13} color={colors.heart}>{error}</T> : null}
    </Glass>
  );
}
