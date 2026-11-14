import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, TextInput, View } from 'react-native';
import { hasBlockedWord, KIND_MESSAGE } from '../lib/filter';
import { useApp } from '../lib/store';
import { colors, font } from '../lib/theme';
import type { ImportedRecipe, VideoSource } from '../lib/types';
import { parseVideoLink } from '../lib/videoLink';
import { Icon } from './Icon';
import { Button, Glass, Input, T } from './ui';

export const platformName = (p?: string) => (p === 'youtube' ? 'YouTube' : p === 'tiktok' ? 'TikTok' : 'video');

type Mode = 'video' | 'notes';

/**
 * Top of the Add screen. Two ways to skip typing a recipe out:
 *  • From a video: paste a TikTok or YouTube link.
 *  • From my notes: paste rough notes (a dish name and some ingredients is enough).
 * Either way the form below is filled in for the person to check before saving.
 */
export function ImportCard({ source, partial, fromNotes, suggestedCount, onImported, onClear, autoFocus }: {
  /** Set after a video import (who to credit). */
  source: VideoSource | null;
  partial: boolean;
  /** True after a recipe was built from notes. */
  fromNotes: boolean;
  /** How many AI-suggested ingredients are still waiting for Keep / Remove. */
  suggestedCount: number;
  onImported: (r: ImportedRecipe, from: Mode) => void;
  onClear: () => void;
  autoFocus?: boolean;
}) {
  const { api } = useApp();
  const [mode, setMode] = useState<Mode>('video');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runVideo(text = link) {
    setError(null);
    const parsed = parseVideoLink(text);
    if (!parsed) return setError('That doesn’t look like a TikTok or YouTube video link.');
    setBusy(true);
    try {
      onImported(await api.importFromLink(parsed.url), 'video');
      setLink('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function runNotes() {
    setError(null);
    const text = notes.trim();
    if (text.length < 3) return setError('Paste or type your notes first. A dish name and a few ingredients is enough.');
    if (hasBlockedWord(text)) return setError(KIND_MESSAGE);
    setBusy(true);
    try {
      onImported(await api.buildFromNotes(text), 'notes');
      setNotes('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function paste() {
    try {
      const text = await navigator.clipboard.readText();
      if (mode === 'video') {
        setLink(text);
        if (parseVideoLink(text)) runVideo(text);
      } else {
        setNotes(text);
      }
    } catch {
      setError('Couldn’t read your clipboard. Long-press the box and choose Paste.');
    }
  }

  /* ── After a video import ── */
  if (source) {
    return (
      <Glass radius={22} strong style={{ padding: 14, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Badge icon="check" />
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

  /* ── After building from notes ── */
  if (fromNotes) {
    return (
      <Glass radius={22} strong style={{ padding: 14, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Badge icon="check" />
          <View style={{ flex: 1 }}>
            <T w="bold" size={15}>Built from your notes</T>
            <T size={13} color={colors.ink2}>
              {suggestedCount > 0
                ? `We suggested ${suggestedCount} ${suggestedCount === 1 ? 'ingredient' : 'ingredients'} to complete it. Keep or remove each one below.`
                : 'Everything below is ready for you to check.'}
            </T>
          </View>
          <Pressable onPress={onClear} accessibilityRole="button" hitSlop={8}>
            <T w="semibold" size={13} color={colors.accent}>Start over</T>
          </Pressable>
        </View>
        <T size={13} color={colors.ink2} style={{ lineHeight: 18 }}>
          Amounts marked “guessed” weren’t in your notes. Check them before cooking. AI can get things wrong.
        </T>
      </Glass>
    );
  }

  /* ── Start: choose video or notes ── */
  const notesMode = mode === 'notes';
  return (
    <Glass radius={22} strong style={{ padding: 14, gap: 10 }}>
      <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: 'rgba(20,17,26,0.06)', borderRadius: 13, padding: 3 }}>
        {([['video', 'From a video'], ['notes', 'From my notes']] as const).map(([k, label]) => (
          <Pressable key={k} accessibilityRole="tab" accessibilityState={{ selected: mode === k }} disabled={busy}
            onPress={() => { setMode(k); setError(null); }}
            style={{ flex: 1, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: mode === k ? colors.white : 'transparent', boxShadow: mode === k ? '0px 2px 8px rgba(40,25,70,0.12)' : undefined }}>
            <T w="semibold" size={14}>{label}</T>
          </Pressable>
        ))}
      </View>

      <T size={13} color={colors.ink2}>
        {notesMode
          ? 'Paste what you have: a dish name, ingredients, half a recipe. We’ll write the full recipe and suggest anything that’s missing.'
          : 'Paste a TikTok or YouTube link and we’ll write out the ingredients and steps.'}
      </T>

      {notesMode ? (
        <TextInput value={notes} onChangeText={(v) => { setNotes(v); setError(null); }} multiline editable={!busy} maxLength={4000}
          placeholder={'e.g.\nmom’s chili\nground beef, kidney beans, onion,\nchili powder, can of tomatoes'} placeholderTextColor={colors.ink3}
          accessibilityLabel="Your notes" autoFocus={false}
          style={{ minHeight: 120, borderRadius: 16, padding: 14, backgroundColor: 'rgba(255,255,255,0.75)', borderWidth: 1, borderColor: colors.hairline, fontFamily: font.medium, fontSize: 15, color: colors.ink, textAlignVertical: 'top' }} />
      ) : (
        <Input value={link} onChangeText={(v) => { setLink(v); setError(null); }} placeholder="tiktok.com/… or youtube.com/…"
          accessibilityLabel="Video link" autoCapitalize="none" autoCorrect={false} keyboardType="url" autoFocus={autoFocus}
          onSubmitEditing={() => runVideo()} editable={!busy} />
      )}

      {busy ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
          <ActivityIndicator color={colors.ink} />
          <T size={13} color={colors.ink2} style={{ flex: 1 }}>
            {notesMode ? 'Writing your recipe…' : 'Reading the video and writing out the steps… this can take up to 30 seconds.'}
          </T>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {Platform.OS === 'web' && !(notesMode ? notes : link) ? (
            <Button title="Paste" variant="soft" onPress={paste} style={{ flex: 1 }} />
          ) : null}
          <Button title={notesMode ? 'Build my recipe' : 'Get the recipe'} onPress={() => (notesMode ? runNotes() : runVideo())}
            disabled={!(notesMode ? notes : link).trim()} style={{ flex: 2 }} />
        </View>
      )}
      {error ? <T size={13} color={colors.heart}>{error}</T> : null}
    </Glass>
  );
}

function Badge({ icon }: { icon: 'check' | 'link' }) {
  return (
    <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={16} color={colors.white} strokeWidth={3} />
    </View>
  );
}
