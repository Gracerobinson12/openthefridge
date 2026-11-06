import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import { Backdrop, Button, Glass, Input, Label, Photo, Row, Switch, T } from '../../components/ui';
import { SITE_URL } from '../../lib/config';
import { notify } from '../../lib/dialog';
import { hasBlockedWord, KIND_MESSAGE } from '../../lib/filter';
import { useApp, useData } from '../../lib/store';
import { colors } from '../../lib/theme';

export default function ShareSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api, me, changed } = useApp();
  const insets = useSafeAreaInsets();
  const { data: recipe } = useData((a) => a.recipe(id), [id]);
  const { data: groups } = useData((a) => a.groups(), []);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [tiktok, setTiktok] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const mine = recipe?.author_id === me?.id;
  const chosen = Object.keys(picked).filter((k) => picked[k]);
  const count = chosen.length + (tiktok ? 1 : 0);
  const close = () => (router.canGoBack() ? router.back() : router.replace(`/recipe/${id}`));

  async function shareLink() {
    const url = Platform.OS === 'web' ? `${window.location.origin}/recipe/${id}` : `${SITE_URL}/recipe/${id}`;
    const message = `${recipe?.title ?? 'A recipe'} on Open the Fridge: ${url}`;
    try {
      if (Platform.OS === 'web' && navigator.share) await navigator.share({ title: recipe?.title, url });
      else if (Platform.OS === 'web') { await navigator.clipboard.writeText(url); notify('Link copied'); }
      else await Share.share({ message, url });
    } catch { /* cancelled */ }
  }

  async function submit() {
    if (hasBlockedWord(note)) return notify('Let’s keep it kind', KIND_MESSAGE);
    setBusy(true);
    try {
      if (chosen.length) await api.shareToGroups(id, chosen, note.trim());
      changed();
      if (tiktok) router.replace(`/slides/${id}`);
      else {
        close();
        if (chosen.length) notify('Shared!', `Posted to ${chosen.length} ${chosen.length === 1 ? 'group' : 'groups'}.`);
      }
    } catch (e) {
      notify('Couldn’t share', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Backdrop variant="peach" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 30, gap: 16, maxWidth: 560, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Photo uri={recipe?.photos[0]} category={recipe?.category} height={52} radius={15} style={{ width: 52 }} />
          <View style={{ flex: 1 }}>
            <T w="heavy" size={18} numberOfLines={1}>{recipe?.title ?? ' '}</T>
            <T size={13} color={colors.ink2}>Share recipe</T>
          </View>
          <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close"
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.tintSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="close" size={14} strokeWidth={2.8} />
          </Pressable>
        </View>

        <Label>SHARE TO GROUPS</Label>
        <Glass radius={22}>
          {(groups ?? []).map((g) => {
            const on = !!picked[g.id];
            return (
              <Row key={g.id} onPress={() => setPicked({ ...picked, [g.id]: !on })} style={{ minHeight: 60 }}>
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: g.color, borderWidth: 1, borderColor: colors.glassBorder }} />
                <View style={{ flex: 1 }}>
                  <T w="bold" size={15}>{g.name}</T>
                  <T size={12} color={colors.ink2}>{g.member_count} members</T>
                </View>
                <View accessibilityRole="checkbox" accessibilityState={{ checked: on }}
                  style={{ width: 24, height: 24, borderRadius: 12, borderWidth: on ? 0 : 1.5, borderColor: 'rgba(20,17,26,0.3)', backgroundColor: on ? colors.ink : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {on ? <Icon name="check" size={13} color={colors.white} strokeWidth={3.4} /> : null}
                </View>
              </Row>
            );
          })}
          <Row last onPress={() => router.push('/groups')}>
            <T w="semibold" size={15} color={colors.accent}>+ New group</T>
          </Row>
        </Glass>

        {mine ? (
          <Glass radius={22}>
            <Row last style={{ minHeight: 60 }}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="music" size={18} color={colors.white} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <T w="bold" size={15}>Post to TikTok</T>
                <T size={12} color={colors.ink2}>As photo slides you can rearrange</T>
              </View>
              <Switch value={tiktok} onChange={setTiktok} label="Post to TikTok" />
            </Row>
          </Glass>
        ) : null}

        <Input value={note} onChangeText={setNote} placeholder="Add a note for the group…" accessibilityLabel="Add a note" maxLength={200} />

        <Button title={count === 0 ? 'Choose where to share' : tiktok && !chosen.length ? 'Next: arrange slides' : `Share to ${count} ${count === 1 ? 'place' : 'places'}`}
          disabled={count === 0} busy={busy} onPress={submit} />
        <Button title="Copy or send link" icon="link" variant="soft" onPress={shareLink} />
      </ScrollView>
    </View>
  );
}
